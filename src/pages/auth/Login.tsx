import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, ArrowRight } from 'lucide-react';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import Logo from '@/components/Logo';
import { useToast } from '@/context/ToastContext';
import { signIn } from '@/services/api';
import { validateEmail } from '@/lib/validation';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ email?: string | null; password?: string | null }>({});
  const [loading, setLoading] = useState(false);
  const [remember, setRemember] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const emailErr = validateEmail(email);
    const passwordErr = password ? null : 'Password is required';
    setErrors({ email: emailErr, password: passwordErr });
    if (emailErr || passwordErr) return;

    setLoading(true);
    try {
      const data = await signIn(email, password);
      const role = data.user?.app_metadata?.role;
      toast('Welcome back to Dayflow!', 'success');
      navigate(role === 'hr' ? '/admin/dashboard' : '/employee/dashboard', { replace: true });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Invalid email or password';
      setErrors({ password: msg });
      toast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen">
      {/* Left panel */}
      <div className="relative hidden flex-1 flex-col justify-between bg-ink p-12 lg:flex">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -right-24 -top-24 h-96 w-96 rounded-full bg-fern/10 blur-3xl" />
          <div className="absolute bottom-0 left-0 h-64 w-64 rounded-full bg-fern-dark/20 blur-3xl" />
        </div>
        <div className="relative">
          <Logo variant="light" size="lg" />
        </div>
        <div className="relative">
          <h1 className="text-5xl font-bold leading-tight text-white">
            Every workday,<br />
            <span className="text-fern">perfectly aligned.</span>
          </h1>
          <p className="mt-6 max-w-md text-lg text-white/60">
            Dayflow brings your people, attendance, leave, and payroll into one calm, connected workspace.
          </p>
          <div className="mt-12 flex gap-6">
            {[
              { num: '98%', label: 'Attendance accuracy' },
              { num: '5min', label: 'Avg. onboarding time' },
              { num: '24/7', label: 'Self-service access' },
            ].map((stat) => (
              <div key={stat.label}>
                <p className="text-2xl font-bold text-fern">{stat.num}</p>
                <p className="mt-1 text-xs text-white/40">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="relative">
          <p className="text-xs text-white/30">OSTRYA &copy; Dayflow HRMS 2026</p>
        </div>
      </div>

      {/* Right panel */}
      <div className="flex flex-1 items-center justify-center bg-white p-6 lg:p-12">
        <div className="w-full max-w-sm">
          <div className="mb-8 lg:hidden">
            <Logo variant="dark" size="md" />
          </div>
          <h2 className="text-2xl font-bold text-ink">Welcome back</h2>
          <p className="mt-2 text-sm text-muted">Sign in to continue to Dayflow.</p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3 top-[38px] h-4.5 w-4.5 text-muted" />
              <Input
                label="Email"
                type="email"
                placeholder="you@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                error={errors.email}
                className="pl-10"
                autoComplete="email"
              />
            </div>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-3 top-[38px] h-4.5 w-4.5 text-muted" />
              <Input
                label="Password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                error={errors.password}
                className="pl-10"
                autoComplete="current-password"
              />
            </div>
            <div className="flex items-center justify-between">
              <label className="flex cursor-pointer items-center gap-2 text-sm text-muted">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                  className="h-4 w-4 rounded border-border text-fern focus:ring-fern"
                />
                Remember me
              </label>
              <button type="button" className="text-sm font-medium text-fern hover:text-fern-dark">
                Forgot password?
              </button>
            </div>
            <Button type="submit" loading={loading} className="w-full" size="lg">
              Sign In
              <ArrowRight className="h-4 w-4" />
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-muted">
            Don't have an account?{' '}
            <Link to="/signup" className="font-semibold text-fern hover:text-fern-dark">
              Create account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
