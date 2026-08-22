import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    // Create service-role client for privileged operations
    const serviceClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // Verify the caller is authenticated and is HR
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return json({ error: "Unauthorized" }, 401);
    }

    const userClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await userClient.auth.getUser();
    if (userError || !user) {
      return json({ error: "Unauthorized" }, 401);
    }

    const role = user.app_metadata?.role;
    if (role !== "hr") {
      return json({ error: "Forbidden: HR access required" }, 403);
    }

    const url = new URL(req.url);
    const parts = url.pathname.split("/").filter(Boolean);
    const action = parts[parts.length - 1];

    // ============================================================
    // APPROVE LEAVE
    // ============================================================
    if (action === "approve-leave") {
      const { leaveId, comment } = await req.json();
      if (!leaveId) return json({ error: "Leave ID is required" }, 400);

      const { data: leave, error: leaveError } = await serviceClient
        .from("leave_requests")
        .update({ status: "Approved", admin_comment: comment || "Approved by HR" })
        .eq("id", leaveId)
        .select("employee_id")
        .maybeSingle();

      if (leaveError || !leave) {
        return json({ error: "Failed to approve leave request" }, 500);
      }

      // Get employee's user_id for notification
      const { data: emp } = await serviceClient
        .from("employees")
        .select("user_id, full_name")
        .eq("id", leave.employee_id)
        .maybeSingle();

      if (emp) {
        await serviceClient.from("notifications").insert({
          user_id: emp.user_id,
          title: "Leave Approved",
          message: `Your leave request has been approved. Comment: ${comment || "Approved by HR"}`,
        });
      }

      return json({ message: "Leave approved successfully" });
    }

    // ============================================================
    // REJECT LEAVE
    // ============================================================
    if (action === "reject-leave") {
      const { leaveId, comment } = await req.json();
      if (!leaveId) return json({ error: "Leave ID is required" }, 400);

      const { data: leave, error: leaveError } = await serviceClient
        .from("leave_requests")
        .update({ status: "Rejected", admin_comment: comment || "Rejected by HR" })
        .eq("id", leaveId)
        .select("employee_id")
        .maybeSingle();

      if (leaveError || !leave) {
        return json({ error: "Failed to reject leave request" }, 500);
      }

      const { data: emp } = await serviceClient
        .from("employees")
        .select("user_id, full_name")
        .eq("id", leave.employee_id)
        .maybeSingle();

      if (emp) {
        await serviceClient.from("notifications").insert({
          user_id: emp.user_id,
          title: "Leave Rejected",
          message: `Your leave request has been rejected. Comment: ${comment || "Rejected by HR"}`,
        });
      }

      return json({ message: "Leave rejected successfully" });
    }

    // ============================================================
    // UPDATE EMPLOYEE (by HR)
    // ============================================================
    if (action === "update-employee") {
      const { employeeId, updates } = await req.json();
      if (!employeeId || !updates) return json({ error: "Employee ID and updates are required" }, 400);

      // Prevent negative salary values
      if (updates.basic_salary !== undefined && updates.basic_salary < 0) {
        return json({ error: "Basic salary cannot be negative" }, 400);
      }
      if (updates.allowances !== undefined && updates.allowances < 0) {
        return json({ error: "Allowances cannot be negative" }, 400);
      }
      if (updates.deductions !== undefined && updates.deductions < 0) {
        return json({ error: "Deductions cannot be negative" }, 400);
      }

      const { error } = await serviceClient
        .from("employees")
        .update(updates)
        .eq("id", employeeId);

      if (error) {
        return json({ error: "Failed to update employee" }, 500);
      }

      return json({ message: "Employee updated successfully" });
    }

    // ============================================================
    // UPDATE PAYROLL (by HR)
    // ============================================================
    if (action === "update-payroll") {
      const { employeeId, basicSalary, allowances, deductions, salaryPeriod } = await req.json();
      if (!employeeId || !salaryPeriod) return json({ error: "Employee ID and salary period are required" }, 400);

      if (basicSalary < 0 || allowances < 0 || deductions < 0) {
        return json({ error: "Salary values cannot be negative" }, 400);
      }

      const netSalary = basicSalary + allowances - deductions;

      // Upsert payroll record
      const { error } = await serviceClient
        .from("payroll")
        .upsert({
          employee_id: employeeId,
          salary_period: salaryPeriod,
          basic_salary: basicSalary,
          allowances,
          deductions,
          net_salary: netSalary,
        }, { onConflict: "employee_id,salary_period" });

      if (error) {
        return json({ error: "Failed to update payroll" }, 500);
      }

      // Also update employee salary structure
      await serviceClient
        .from("employees")
        .update({ basic_salary: basicSalary, allowances, deductions })
        .eq("id", employeeId);

      return json({ message: "Payroll updated successfully" });
    }

    // ============================================================
    // CREATE NOTIFICATION (for employee by HR)
    // ============================================================
    if (action === "notify-employee") {
      const { userId, title, message } = await req.json();
      if (!userId || !title || !message) return json({ error: "User ID, title and message are required" }, 400);

      const { error } = await serviceClient.from("notifications").insert({
        user_id: userId,
        title,
        message,
      });

      if (error) {
        return json({ error: "Failed to send notification" }, 500);
      }

      return json({ message: "Notification sent successfully" });
    }

    return json({ error: "Unknown action" }, 404);
  } catch (err) {
    return json({ error: "An unexpected error occurred" }, 500);
  }
});

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
