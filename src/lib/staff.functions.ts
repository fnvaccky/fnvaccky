import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireAdmin } from "@/lib/require-admin";
import { AppError } from "@/lib/app-error";

const createStaffSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, "Password must be at least 8 characters"),
  fullName: z.string().min(1, "Full name is required"),
  role: z.enum(["admin", "hr"]),
});

/** Admin-only: provision a brand-new HR/Admin account. This is the ONLY way
 * a new staff user can be created in Harmony Suite — there is no self-service
 * sign-up. Uses the service-role client, but only after requireAdmin confirms
 * the caller is an Administrator. */
export const createStaffAccount = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .validator((input: unknown) => createStaffSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } =
      await import("@/integrations/supabase/client.server");

    const { data: created, error: createError } =
      await supabaseAdmin.auth.admin.createUser({
        email: data.email,
        password: data.password,
        email_confirm: true,
        user_metadata: { full_name: data.fullName },
      });
    if (createError || !created.user) {
      throw new AppError(
        createError?.message ?? "Failed to create account",
        400,
      );
    }

    const userId = created.user.id;

    // handle_new_user() trigger already created the profiles row; just make sure
    // the name is set and assign the role.
    await supabaseAdmin
      .from("profiles")
      .update({ full_name: data.fullName })
      .eq("id", userId);

    const { error: roleError } = await supabaseAdmin
      .from("user_roles")
      .insert({ user_id: userId, role: data.role });
    if (roleError) {
      // Roll back the auth user so we don't leave an unusable, roleless account behind.
      await supabaseAdmin.auth.admin.deleteUser(userId);
      throw new AppError(roleError.message, 400);
    }

    return { userId, email: data.email };
  });

const updateStaffSchema = z.object({
  userId: z.string().uuid(),
  fullName: z.string().min(1).optional(),
  role: z.enum(["admin", "hr"]).optional(),
});

/** Admin-only: change an existing staff member's display name and/or role. */
export const updateStaffAccount = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .validator((input: unknown) => updateStaffSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } =
      await import("@/integrations/supabase/client.server");

    if (data.fullName) {
      await supabaseAdmin
        .from("profiles")
        .update({ full_name: data.fullName })
        .eq("id", data.userId);
    }
    if (data.role) {
      // An admin should not be able to lock everyone (including themselves) out by
      // demoting the last remaining admin.
      if (data.role === "hr") {
        const { count } = await supabaseAdmin
          .from("user_roles")
          .select("*", { count: "exact", head: true })
          .eq("role", "admin");
        const { data: currentRole } = await supabaseAdmin
          .from("user_roles")
          .select("role")
          .eq("user_id", data.userId)
          .maybeSingle();
        if (currentRole?.role === "admin" && (count ?? 0) <= 1) {
          throw new AppError(
            "Cannot demote the last remaining Administrator",
            400,
          );
        }
      }
      await supabaseAdmin
        .from("user_roles")
        .update({ role: data.role })
        .eq("user_id", data.userId);
    }
    return { ok: true };
  });

const setActiveSchema = z.object({
  userId: z.string().uuid(),
  isActive: z.boolean(),
});

/** Admin-only: deactivate ("Deactivate HR Account") or reactivate a staff account.
 * Deactivation both flips profiles.is_active (checked on every route load) and
 * bans the Supabase Auth user so a currently-open session can't keep working
 * and the account can't sign in again. */
export const setStaffAccountActive = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .validator((input: unknown) => setActiveSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } =
      await import("@/integrations/supabase/client.server");

    if (data.isActive === false) {
      const { data: role } = await supabaseAdmin
        .from("user_roles")
        .select("role")
        .eq("user_id", data.userId)
        .maybeSingle();
      if (role?.role === "admin") {
        const { count } = await supabaseAdmin
          .from("user_roles")
          .select("*", { count: "exact", head: true })
          .eq("role", "admin");
        if ((count ?? 0) <= 1)
          throw new AppError(
            "Cannot deactivate the last remaining Administrator",
            400,
          );
      }
    }

    await supabaseAdmin
      .from("profiles")
      .update({ is_active: data.isActive })
      .eq("id", data.userId);
    await supabaseAdmin.auth.admin.updateUserById(data.userId, {
      ban_duration: data.isActive ? "none" : "876000h", // ~100 years == effectively permanent until reactivated
    });
    return { ok: true };
  });

/** Admin-only: list every staff account with its role and status, for the
 * "Manage HR Staff Accounts" admin screen. */
export const listStaffAccounts = createServerFn({ method: "GET" })
  .middleware([requireAdmin])
  .handler(async () => {
    const { supabaseAdmin } =
      await import("@/integrations/supabase/client.server");

    const [
      { data: profiles, error: profilesError },
      { data: roles, error: rolesError },
    ] = await Promise.all([
      supabaseAdmin
        .from("profiles")
        .select("id, full_name, email, is_active, created_at")
        .order("created_at", { ascending: false }),
      supabaseAdmin.from("user_roles").select("user_id, role"),
    ]);
    if (profilesError) throw new AppError(profilesError.message, 400);
    if (rolesError) throw new AppError(rolesError.message, 400);

    const roleByUser = new Map(roles?.map((r) => [r.user_id, r.role]));
    return (profiles ?? [])
      .filter((p) => roleByUser.has(p.id)) // only show provisioned staff, not stray auth users
      .map((p) => ({ ...p, role: roleByUser.get(p.id)! }));
  });
