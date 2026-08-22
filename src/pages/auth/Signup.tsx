import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, ArrowRight, Check, X } from 'lucide-react';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Button from '@/components/ui/Button';
import Logo from '@/components/Logo';
import { useToast } from '@/context/ToastContext';
import { signUpInitiate } from '@/services/api';
import {
  validateEmail,
  validatePassword,
  validateEmployeeId,
  getPasswordStrength,
} from '@/lib/validation';
import type { UserRole } from '@/types';

export default function Signup() {
  const [employeeId, setEmployeeId] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState<UserRole>('employee');
  const [errors, setErrors] = useState<Record<string, string | null>>({});
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const strength = getPasswordStrength(password);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string | null> = {
      employeeId: validateEmployeeId(employeeId),
      email: validateEmail(email),
      password: validatePassword(password),
      confirmPassword: password !== confirmPassword ? 'Passwords do not match' : null,
    };
    setErrors(newErrors);
    if (Object.values(newErrors).some(Boolean)) return;

    setLoading(true);
    try {
      const result = await signUpInitiate(employeeId, email, role);
      toast('Verification code generated!', 'success');
      navigate('/verify-email', {
        state: {
          email,
          employeeId,
          role,
          code: result.code,
        },
        replace: true,
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Signup failed';
      setErrors({ email: msg });
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
          <h2 className="text-2xl font-bold text-ink">Create your Dayflow account</h2>
          <p className="mt-2 text-sm text-muted">Get started with your HR workspace in minutes.</p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <Input
              label="Employee ID"
              placeholder="e.g. EMP-001 or HR-001"
              value={employeeId}
              onChange={(e) => setEmployeeId(e.target.value)}
              error={errors.employeeId}
              hint="Use HR- prefix for HR accounts"
            />
            <Input
              label="Email"
              type="email"
              placeholder="you@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              error={errors.email}
            />
            <Input
              label="Password"
              type="password"
              placeholder="Min. 8 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              error={errors.password}
            />
            {password.length > 0 && (
              <div className="space-y-2">
                <div className="flex gap-1.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div
                      key={i}
                      className="h-1.5 flex-1 rounded-full transition-colors"
                      style={{ backgroundColor: i < strength.score ? strength.color : '#e5e7eb' }}
                    />
                  ))}
                </div>
                <p className="text-xs" style={{ color: strength.color }}>
                  Password strength: {strength.label}
                </p>
              </div>
            )}
            <Input
              label="Confirm Password"
              type="password"
              placeholder="Re-enter your password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              error={errors.confirmPassword}
            />
            <Select
              label="Role"
              value={role}
              onChange={(e) => setRole(e.target.value as UserRole)}
              options={[
                { value: 'employee', label: 'Employee' },
                { value: 'hr', label: 'HR / Admin' },
              ]}
            />

            <div className="rounded-lg bg-fern-light p-4">
              <p className="mb-2 text-xs font-semibold text-fern-dark">Password requirements:</p>
              <ul className="space-y-1">
                {[
                  { label: 'At least 8 characters', met: password.length >= 8 },
                  { label: 'One uppercase letter', met: /[A-Z]/.test(password) },
                  { label: 'One lowercase letter', met: /[a-z]/.test(password) },
                  { label: 'One number', met: /[0-9]/.test(password) },
                ].map((req) => (
                  <li key={req.label} className="flex items-center gap-2 text-xs text-fern-dark">
                    {req.met ? <Check className="h-3.5 w-3.5" /> : <X className="h-3.5 w-3.5 text-muted" />}
                    {req.label}
                  </li>
                ))}
              </ul>
            </div>

            <Button type="submit" loading={loading} className="w-full" size="lg">
              Continue
              <ArrowRight className="h-4 w-4" />
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-muted">
            Already have an account?{' '}
            <Link to="/login" className="font-semibold text-fern hover:text-fern-dark">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
