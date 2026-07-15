import { createMiddleware } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { AppError } from "@/lib/app-error";

/**
 * Composes on top of requireSupabaseAuth. Confirms the authenticated caller
 * actually holds the 'admin' role before letting an admin-only server
 * function proceed. Used for every mutation that touches user_roles,
 * account provisioning, or other admin-only actions (HR staff accounts,
 * system settings, etc.) — see SECURITY.md.
 */
export const requireAdmin = createMiddleware({ type: "function" })
  .middleware([requireSupabaseAuth])
  .server(async ({ next, context }) => {
    const { data, error } = await context.supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", context.userId)
      .limit(1)
      .maybeSingle();

    if (error || !data || data.role !== "admin") {
      throw new AppError(
        "Forbidden: this action requires the Administrator role",
        403,
      );
    }

    return next({ context: { ...context, isAdmin: true as const } });
  });
