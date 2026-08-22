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
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    const url = new URL(req.url);
    const action = url.pathname.split("/").pop() || "";

    if (action === "signup") {
      const { employeeId, email, role } = await req.json();

      if (!employeeId || !email || !role) {
        return json({ error: "All fields are required" }, 400);
      }
      if (!["employee", "hr"].includes(role)) {
        return json({ error: "Invalid role" }, 400);
      }

      // Check email uniqueness
      const { data: existingUsers } = await supabase.auth.admin.listUsers();
      const emailTaken = (existingUsers?.users || []).some(
        (u) => u.email?.toLowerCase() === email.toLowerCase()
      );
      if (emailTaken) {
        return json({ error: "An account with this email already exists" }, 409);
      }

      // Check employee ID uniqueness
      const { data: existingEmp } = await supabase
        .from("employees")
        .select("employee_id")
        .eq("employee_id", employeeId)
        .maybeSingle();
      if (existingEmp) {
        return json({ error: "This Employee ID is already registered" }, 409);
      }

      // Generate 6-digit code
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

      // Invalidate old codes for this email
      await supabase
        .from("verification_codes")
        .update({ used: true })
        .eq("email", email.toLowerCase());

      // Store code with role metadata (password is NOT stored - client resends on verify)
      const { error: codeError } = await supabase
        .from("verification_codes")
        .insert({
          email: email.toLowerCase(),
          employee_id: employeeId,
          code,
          expires_at: expiresAt,
        });

      if (codeError) {
        return json({ error: "Failed to initiate signup" }, 500);
      }

      // Return code for demo (no email sending in this environment)
      return json({
        message: "Verification code generated",
        code,
      });
    }

    if (action === "verify-email") {
      const { email, code, password, employeeId, role } = await req.json();

      if (!email || !code || !password || !employeeId || !role) {
        return json({ error: "All fields are required for verification" }, 400);
      }
      if (password.length < 8) {
        return json({ error: "Password must be at least 8 characters" }, 400);
      }

      // Look up the code
      const { data: record, error } = await supabase
        .from("verification_codes")
        .select("*")
        .eq("email", email.toLowerCase())
        .eq("used", false)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error || !record) {
        return json({ error: "Invalid or expired verification code" }, 400);
      }

      if (record.code !== code) {
        return json({ error: "Invalid verification code" }, 400);
      }
      if (new Date(record.expires_at) < new Date()) {
        return json({ error: "Verification code has expired. Please sign up again." }, 400);
      }

      // Re-check uniqueness (race condition guard)
      const { data: existingUsers } = await supabase.auth.admin.listUsers();
      const emailTaken = (existingUsers?.users || []).some(
        (u) => u.email?.toLowerCase() === email.toLowerCase()
      );
      if (emailTaken) {
        return json({ error: "An account with this email already exists" }, 409);
      }

      const { data: existingEmp } = await supabase
        .from("employees")
        .select("employee_id")
        .eq("employee_id", employeeId)
        .maybeSingle();
      if (existingEmp) {
        return json({ error: "This Employee ID is already registered" }, 409);
      }

      // Create auth user with email confirmed
      const { data: authUser, error: createError } = await supabase.auth.admin.createUser({
        email: email.toLowerCase(),
        password,
        email_confirm: true,
        user_metadata: { employee_id: employeeId },
      });

      if (createError || !authUser.user) {
        return json({ error: createError?.message || "Failed to create account" }, 500);
      }

      // Set role in raw_app_meta_data (user-immutable, used for RLS)
      await supabase.auth.admin.updateUserById(authUser.user.id, {
        app_metadata: { role },
      });

      // Create employee record
      const fullName = formatName(employeeId);
      const isHr = role === "hr";
      const { error: empError } = await supabase.from("employees").insert({
        user_id: authUser.user.id,
        employee_id: employeeId,
        full_name: fullName,
        email: email.toLowerCase(),
        department: isHr ? "Human Resources" : "General",
        job_title: isHr ? "HR Manager" : "Employee",
        joining_date: new Date().toISOString().split("T")[0],
        employment_status: "Active",
        basic_salary: isHr ? 8000 : 5000,
        allowances: isHr ? 2000 : 1000,
        deductions: isHr ? 500 : 300,
      });

      if (empError) {
        await supabase.auth.admin.deleteUser(authUser.user.id);
        return json({ error: "Failed to create employee profile" }, 500);
      }

      // Create initial payroll record
      const period = new Date().toISOString().slice(0, 7);
      await supabase.from("payroll").insert({
        employee_id: (await supabase.from("employees").select("id").eq("user_id", authUser.user.id).maybeSingle()).data?.id,
        salary_period: period,
        basic_salary: isHr ? 8000 : 5000,
        allowances: isHr ? 2000 : 1000,
        deductions: isHr ? 500 : 300,
        net_salary: isHr ? 9500 : 5700,
      });

      // Mark code as used
      await supabase.from("verification_codes").update({ used: true }).eq("id", record.id);

      return json({ message: "Email verified successfully. You can now sign in." });
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

function formatName(employeeId: string): string {
  return employeeId
    .split(/[_\s-]+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}
