export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5";
  };
  public: {
    Tables: {
      applicants: {
        Row: {
          applied_at: string;
          created_at: string;
          email: string;
          first_name: string;
          id: string;
          job_posting_id: string | null;
          last_name: string;
          notes: string | null;
          phone: string | null;
          resume_path: string | null;
          resume_url: string | null;
          status: Database["public"]["Enums"]["applicant_status"];
          updated_at: string;
        };
        Insert: {
          applied_at?: string;
          created_at?: string;
          email: string;
          first_name: string;
          id?: string;
          job_posting_id?: string | null;
          last_name: string;
          notes?: string | null;
          phone?: string | null;
          resume_path?: string | null;
          resume_url?: string | null;
          status?: Database["public"]["Enums"]["applicant_status"];
          updated_at?: string;
        };
        Update: {
          applied_at?: string;
          created_at?: string;
          email?: string;
          first_name?: string;
          id?: string;
          job_posting_id?: string | null;
          last_name?: string;
          notes?: string | null;
          phone?: string | null;
          resume_path?: string | null;
          resume_url?: string | null;
          status?: Database["public"]["Enums"]["applicant_status"];
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "applicants_job_posting_id_fkey";
            columns: ["job_posting_id"];
            isOneToOne: false;
            referencedRelation: "job_postings";
            referencedColumns: ["id"];
          },
        ];
      };
      attendance: {
        Row: {
          created_at: string;
          date: string;
          employee_id: string;
          hours_worked: number | null;
          id: string;
          late_minutes: number | null;
          notes: string | null;
          overtime_hours: number | null;
          time_in: string | null;
          time_out: string | null;
          undertime_minutes: number | null;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          date: string;
          employee_id: string;
          hours_worked?: number | null;
          id?: string;
          late_minutes?: number | null;
          notes?: string | null;
          overtime_hours?: number | null;
          time_in?: string | null;
          time_out?: string | null;
          undertime_minutes?: number | null;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          date?: string;
          employee_id?: string;
          hours_worked?: number | null;
          id?: string;
          late_minutes?: number | null;
          notes?: string | null;
          overtime_hours?: number | null;
          time_in?: string | null;
          time_out?: string | null;
          undertime_minutes?: number | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "attendance_employee_id_fkey";
            columns: ["employee_id"];
            isOneToOne: false;
            referencedRelation: "employees";
            referencedColumns: ["id"];
          },
        ];
      };
      audit_logs: {
        Row: {
          action: string;
          created_at: string;
          entity: string | null;
          entity_id: string | null;
          id: string;
          metadata: Json | null;
          user_id: string | null;
        };
        Insert: {
          action: string;
          created_at?: string;
          entity?: string | null;
          entity_id?: string | null;
          id?: string;
          metadata?: Json | null;
          user_id?: string | null;
        };
        Update: {
          action?: string;
          created_at?: string;
          entity?: string | null;
          entity_id?: string | null;
          id?: string;
          metadata?: Json | null;
          user_id?: string | null;
        };
        Relationships: [];
      };
      departments: {
        Row: {
          created_at: string;
          description: string | null;
          id: string;
          name: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          description?: string | null;
          id?: string;
          name: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          description?: string | null;
          id?: string;
          name?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      employees: {
        Row: {
          address: string | null;
          avatar_url: string | null;
          basic_salary: number | null;
          created_at: string;
          department_id: string | null;
          email: string | null;
          employee_code: string;
          first_name: string;
          hire_date: string;
          id: string;
          last_name: string;
          leave_balance: number | null;
          phone: string | null;
          position_id: string | null;
          status: Database["public"]["Enums"]["employment_status"];
          updated_at: string;
        };
        Insert: {
          address?: string | null;
          avatar_url?: string | null;
          basic_salary?: number | null;
          created_at?: string;
          department_id?: string | null;
          email?: string | null;
          employee_code?: string;
          first_name: string;
          hire_date?: string;
          id?: string;
          last_name: string;
          leave_balance?: number | null;
          phone?: string | null;
          position_id?: string | null;
          status?: Database["public"]["Enums"]["employment_status"];
          updated_at?: string;
        };
        Update: {
          address?: string | null;
          avatar_url?: string | null;
          basic_salary?: number | null;
          created_at?: string;
          department_id?: string | null;
          email?: string | null;
          employee_code?: string;
          first_name?: string;
          hire_date?: string;
          id?: string;
          last_name?: string;
          leave_balance?: number | null;
          phone?: string | null;
          position_id?: string | null;
          status?: Database["public"]["Enums"]["employment_status"];
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "employees_department_id_fkey";
            columns: ["department_id"];
            isOneToOne: false;
            referencedRelation: "departments";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "employees_position_id_fkey";
            columns: ["position_id"];
            isOneToOne: false;
            referencedRelation: "positions";
            referencedColumns: ["id"];
          },
        ];
      };
      interviews: {
        Row: {
          applicant_id: string;
          created_at: string;
          id: string;
          interviewer: string | null;
          notes: string | null;
          scheduled_at: string;
          status: Database["public"]["Enums"]["interview_status"];
          type: Database["public"]["Enums"]["interview_type"];
          updated_at: string;
        };
        Insert: {
          applicant_id: string;
          created_at?: string;
          id?: string;
          interviewer?: string | null;
          notes?: string | null;
          scheduled_at: string;
          status?: Database["public"]["Enums"]["interview_status"];
          type?: Database["public"]["Enums"]["interview_type"];
          updated_at?: string;
        };
        Update: {
          applicant_id?: string;
          created_at?: string;
          id?: string;
          interviewer?: string | null;
          notes?: string | null;
          scheduled_at?: string;
          status?: Database["public"]["Enums"]["interview_status"];
          type?: Database["public"]["Enums"]["interview_type"];
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "interviews_applicant_id_fkey";
            columns: ["applicant_id"];
            isOneToOne: false;
            referencedRelation: "applicants";
            referencedColumns: ["id"];
          },
        ];
      };
      job_postings: {
        Row: {
          closing_date: string | null;
          created_at: string;
          department_id: string | null;
          description: string | null;
          id: string;
          position_id: string | null;
          posted_date: string | null;
          requirements: string | null;
          status: Database["public"]["Enums"]["job_status"];
          title: string;
          updated_at: string;
        };
        Insert: {
          closing_date?: string | null;
          created_at?: string;
          department_id?: string | null;
          description?: string | null;
          id?: string;
          position_id?: string | null;
          posted_date?: string | null;
          requirements?: string | null;
          status?: Database["public"]["Enums"]["job_status"];
          title: string;
          updated_at?: string;
        };
        Update: {
          closing_date?: string | null;
          created_at?: string;
          department_id?: string | null;
          description?: string | null;
          id?: string;
          position_id?: string | null;
          posted_date?: string | null;
          requirements?: string | null;
          status?: Database["public"]["Enums"]["job_status"];
          title?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "job_postings_department_id_fkey";
            columns: ["department_id"];
            isOneToOne: false;
            referencedRelation: "departments";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "job_postings_position_id_fkey";
            columns: ["position_id"];
            isOneToOne: false;
            referencedRelation: "positions";
            referencedColumns: ["id"];
          },
        ];
      };
      leave_requests: {
        Row: {
          approved_at: string | null;
          approved_by: string | null;
          created_at: string;
          days: number;
          employee_id: string;
          end_date: string;
          id: string;
          leave_type: Database["public"]["Enums"]["leave_type"];
          reason: string | null;
          start_date: string;
          status: Database["public"]["Enums"]["leave_status"];
          updated_at: string;
        };
        Insert: {
          approved_at?: string | null;
          approved_by?: string | null;
          created_at?: string;
          days?: number;
          employee_id: string;
          end_date: string;
          id?: string;
          leave_type: Database["public"]["Enums"]["leave_type"];
          reason?: string | null;
          start_date: string;
          status?: Database["public"]["Enums"]["leave_status"];
          updated_at?: string;
        };
        Update: {
          approved_at?: string | null;
          approved_by?: string | null;
          created_at?: string;
          days?: number;
          employee_id?: string;
          end_date?: string;
          id?: string;
          leave_type?: Database["public"]["Enums"]["leave_type"];
          reason?: string | null;
          start_date?: string;
          status?: Database["public"]["Enums"]["leave_status"];
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "leave_requests_employee_id_fkey";
            columns: ["employee_id"];
            isOneToOne: false;
            referencedRelation: "employees";
            referencedColumns: ["id"];
          },
        ];
      };
      payroll: {
        Row: {
          allowances: number;
          basic_salary: number;
          created_at: string;
          deductions: number;
          employee_id: string;
          gross_salary: number;
          id: string;
          leave_deduction: number;
          net_salary: number;
          overtime_pay: number;
          period_end: string;
          period_start: string;
          review_notes: string | null;
          reviewed_at: string | null;
          reviewed_by: string | null;
          status: Database["public"]["Enums"]["payroll_status"];
          updated_at: string;
        };
        Insert: {
          allowances?: number;
          basic_salary?: number;
          created_at?: string;
          deductions?: number;
          employee_id: string;
          gross_salary?: number;
          id?: string;
          leave_deduction?: number;
          net_salary?: number;
          overtime_pay?: number;
          period_end: string;
          period_start: string;
          review_notes?: string | null;
          reviewed_at?: string | null;
          reviewed_by?: string | null;
          status?: Database["public"]["Enums"]["payroll_status"];
          updated_at?: string;
        };
        Update: {
          allowances?: number;
          basic_salary?: number;
          created_at?: string;
          deductions?: number;
          employee_id?: string;
          gross_salary?: number;
          id?: string;
          leave_deduction?: number;
          net_salary?: number;
          overtime_pay?: number;
          period_end?: string;
          period_start?: string;
          review_notes?: string | null;
          reviewed_at?: string | null;
          reviewed_by?: string | null;
          status?: Database["public"]["Enums"]["payroll_status"];
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "payroll_employee_id_fkey";
            columns: ["employee_id"];
            isOneToOne: false;
            referencedRelation: "employees";
            referencedColumns: ["id"];
          },
        ];
      };
      positions: {
        Row: {
          base_salary: number | null;
          created_at: string;
          department_id: string | null;
          id: string;
          salary_grade: string | null;
          salary_grade_id: string | null;
          title: string;
          updated_at: string;
        };
        Insert: {
          base_salary?: number | null;
          created_at?: string;
          department_id?: string | null;
          id?: string;
          salary_grade?: string | null;
          salary_grade_id?: string | null;
          title: string;
          updated_at?: string;
        };
        Update: {
          base_salary?: number | null;
          created_at?: string;
          department_id?: string | null;
          id?: string;
          salary_grade?: string | null;
          salary_grade_id?: string | null;
          title?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "positions_department_id_fkey";
            columns: ["department_id"];
            isOneToOne: false;
            referencedRelation: "departments";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "positions_salary_grade_id_fkey";
            columns: ["salary_grade_id"];
            isOneToOne: false;
            referencedRelation: "salary_grades";
            referencedColumns: ["id"];
          },
        ];
      };
      profiles: {
        Row: {
          avatar_url: string | null;
          created_at: string;
          email: string | null;
          full_name: string | null;
          id: string;
          is_active: boolean;
          updated_at: string;
        };
        Insert: {
          avatar_url?: string | null;
          created_at?: string;
          email?: string | null;
          full_name?: string | null;
          id: string;
          is_active?: boolean;
          updated_at?: string;
        };
        Update: {
          avatar_url?: string | null;
          created_at?: string;
          email?: string | null;
          full_name?: string | null;
          id?: string;
          is_active?: boolean;
          updated_at?: string;
        };
        Relationships: [];
      };
      user_roles: {
        Row: {
          created_at: string;
          id: string;
          role: Database["public"]["Enums"]["app_role"];
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          role: Database["public"]["Enums"]["app_role"];
          user_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          role?: Database["public"]["Enums"]["app_role"];
          user_id?: string;
        };
        Relationships: [];
      };
      salary_grades: {
        Row: {
          created_at: string;
          grade_code: string;
          id: string;
          label: string;
          max_salary: number;
          min_salary: number;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          grade_code: string;
          id?: string;
          label: string;
          max_salary?: number;
          min_salary?: number;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          grade_code?: string;
          id?: string;
          label?: string;
          max_salary?: number;
          min_salary?: number;
          updated_at?: string;
        };
        Relationships: [];
      };
      job_offers: {
        Row: {
          applicant_id: string;
          created_at: string;
          created_by: string | null;
          decided_at: string | null;
          id: string;
          notes: string | null;
          offered_salary: number;
          position_id: string | null;
          start_date: string | null;
          status: Database["public"]["Enums"]["offer_status"];
          updated_at: string;
        };
        Insert: {
          applicant_id: string;
          created_at?: string;
          created_by?: string | null;
          decided_at?: string | null;
          id?: string;
          notes?: string | null;
          offered_salary?: number;
          position_id?: string | null;
          start_date?: string | null;
          status?: Database["public"]["Enums"]["offer_status"];
          updated_at?: string;
        };
        Update: {
          applicant_id?: string;
          created_at?: string;
          created_by?: string | null;
          decided_at?: string | null;
          id?: string;
          notes?: string | null;
          offered_salary?: number;
          position_id?: string | null;
          start_date?: string | null;
          status?: Database["public"]["Enums"]["offer_status"];
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "job_offers_applicant_id_fkey";
            columns: ["applicant_id"];
            isOneToOne: false;
            referencedRelation: "applicants";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "job_offers_position_id_fkey";
            columns: ["position_id"];
            isOneToOne: false;
            referencedRelation: "positions";
            referencedColumns: ["id"];
          },
        ];
      };
      employment_contracts: {
        Row: {
          created_at: string;
          deployed_at: string | null;
          employee_id: string | null;
          id: string;
          job_offer_id: string;
          signed_at: string | null;
          status: Database["public"]["Enums"]["contract_status"];
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          deployed_at?: string | null;
          employee_id?: string | null;
          id?: string;
          job_offer_id: string;
          signed_at?: string | null;
          status?: Database["public"]["Enums"]["contract_status"];
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          deployed_at?: string | null;
          employee_id?: string | null;
          id?: string;
          job_offer_id?: string;
          signed_at?: string | null;
          status?: Database["public"]["Enums"]["contract_status"];
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "employment_contracts_employee_id_fkey";
            columns: ["employee_id"];
            isOneToOne: false;
            referencedRelation: "employees";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "employment_contracts_job_offer_id_fkey";
            columns: ["job_offer_id"];
            isOneToOne: false;
            referencedRelation: "job_offers";
            referencedColumns: ["id"];
          },
        ];
      };
      notifications: {
        Row: {
          body: string | null;
          created_at: string;
          id: string;
          is_read: boolean;
          recipient_user_id: string | null;
          title: string;
        };
        Insert: {
          body?: string | null;
          created_at?: string;
          id?: string;
          is_read?: boolean;
          recipient_user_id?: string | null;
          title: string;
        };
        Update: {
          body?: string | null;
          created_at?: string;
          id?: string;
          is_read?: boolean;
          recipient_user_id?: string | null;
          title?: string;
        };
        Relationships: [];
      };
      employee_documents: {
        Row: {
          created_at: string;
          employee_id: string;
          file_name: string;
          id: string;
          storage_path: string;
          uploaded_by: string | null;
        };
        Insert: {
          created_at?: string;
          employee_id: string;
          file_name: string;
          id?: string;
          storage_path: string;
          uploaded_by?: string | null;
        };
        Update: {
          created_at?: string;
          employee_id?: string;
          file_name?: string;
          id?: string;
          storage_path?: string;
          uploaded_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "employee_documents_employee_id_fkey";
            columns: ["employee_id"];
            isOneToOne: false;
            referencedRelation: "employees";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"];
          _user_id: string;
        };
        Returns: boolean;
      };
      is_staff: { Args: { _user_id: string }; Returns: boolean };
    };
    Enums: {
      app_role: "admin" | "hr";
      applicant_status:
        "applied" | "screening" | "interview" | "offer" | "hired" | "rejected";
      contract_status: "draft" | "sent" | "signed";
      employment_status:
        "active" | "probation" | "resigned" | "terminated" | "on_leave";
      interview_status:
        "scheduled" | "completed" | "cancelled" | "passed" | "failed";
      interview_type: "initial" | "technical" | "final";
      job_status: "draft" | "published" | "closed";
      leave_status: "pending" | "approved" | "rejected" | "cancelled";
      leave_type:
        | "vacation"
        | "sick"
        | "emergency"
        | "maternity"
        | "paternity"
        | "unpaid";
      offer_status: "pending" | "accepted" | "declined";
      payroll_status: "draft" | "reviewed" | "released";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<
  keyof Database,
  "public"
>];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    keyof DefaultSchema["Enums"] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "hr"],
      applicant_status: [
        "applied",
        "screening",
        "interview",
        "offer",
        "hired",
        "rejected",
      ],
      contract_status: ["draft", "sent", "signed"],
      employment_status: [
        "active",
        "probation",
        "resigned",
        "terminated",
        "on_leave",
      ],
      interview_status: [
        "scheduled",
        "completed",
        "cancelled",
        "passed",
        "failed",
      ],
      interview_type: ["initial", "technical", "final"],
      job_status: ["draft", "published", "closed"],
      leave_status: ["pending", "approved", "rejected", "cancelled"],
      leave_type: [
        "vacation",
        "sick",
        "emergency",
        "maternity",
        "paternity",
        "unpaid",
      ],
      offer_status: ["pending", "accepted", "declined"],
      payroll_status: ["draft", "reviewed", "released"],
    },
  },
} as const;
