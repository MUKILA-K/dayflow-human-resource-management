import { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Mail, ArrowRight, ShieldCheck } from 'lucide-react';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import Logo from '@/components/Logo';
import { useToast } from '@/context/ToastContext';
import { verifyEmail } from '@/services/api';
import type { UserRole } from '@/types';

interface VerifyState {
  email?: string;
  employeeId?: string;
  role?: UserRole;
  code?: string;
}

export default function VerifyEmail() {
  const location = useLocation();
  const state = (location.state || {}) as VerifyState;
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string | null>>({});
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  if (!state.email || !state.employeeId || !state.role) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-cream p-4">
        <div className="card max-w-md p-8 text-center">
          <p className="text-sm text-muted">Session expired. Please sign up again.</p>
          <Link to="/signup" className="mt-4 inline-block font-semibold text-fern">
            Go to signup
          </Link>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string | null> = {
      code: code.length !== 6 ? 'Enter the 6-digit code' : null,
      password: password.length < 8 ? 'Password must be at least 8 characters' : null,
      confirmPassword: password !== confirmPassword ? 'Passwords do not match' : null,
    };
    setErrors(newErrors);
    if (Object.values(newErrors).some(Boolean)) return;

    setLoading(true);
    try {
      await verifyEmail(state.email!, code, password, state.employeeId!, state.role!);
      toast('Email verified! You can now sign in.', 'success');
      navigate('/login', { replace: true });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Verification failed';
      setErrors({ code: msg });
      toast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-cream p-4">
      <div className="w-full max-w-md">
        <div className="mb-6 flex justify-center">
          <Logo variant="dark" size="md" />
        </div>
        <div className="card p-8">
          <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-fern-light">
            <ShieldCheck className="h-7 w-7 text-fern" />
          </div>
          <h2 className="text-2xl font-bold text-ink">Verify your email</h2>
          <p className="mt-2 text-sm text-muted">
            We've sent a 6-digit verification code to <span className="font-semibold text-ink">{state.email}</span>.
          </p>

          {state.code && (
            <div className="mt-4 rounded-lg border border-fern/30 bg-fern-light p-3 text-center">
              <p className="text-xs text-muted">Demo mode — your code:</p>
              <p className="text-xl font-bold tracking-widest text-fern-dark">{state.code}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <Input
              label="Verification code"
              placeholder="Enter 6-digit code"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              error={errors.code}
              maxLength={6}
              inputMode="numeric"
            />
            <Input
              label="Password"
              type="password"
              placeholder="Min. 8 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              error={errors.password}
            />
            <Input
              label="Confirm Password"
              type="password"
              placeholder="Re-enter your password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              error={errors.confirmPassword}
            />
            <Button type="submit" loading={loading} className="w-full" size="lg">
              Verify & Create Account
              <ArrowRight className="h-4 w-4" />
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-muted">
            <Link to="/signup" className="font-semibold text-fern hover:text-fern-dark">
              Back to signup
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
