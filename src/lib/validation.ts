export function validateEmail(email: string): string | null {
  if (!email.trim()) return 'Email is required';
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!re.test(email)) return 'Please enter a valid email address';
  return null;
}

export function validatePassword(password: string): string | null {
  if (!password) return 'Password is required';
  if (password.length < 8) return 'Password must be at least 8 characters';
  if (!/[A-Z]/.test(password)) return 'Password must contain at least one uppercase letter';
  if (!/[a-z]/.test(password)) return 'Password must contain at least one lowercase letter';
  if (!/[0-9]/.test(password)) return 'Password must contain at least one number';
  return null;
}

export function getPasswordStrength(password: string): { score: number; label: string; color: string } {
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  const levels = [
    { label: 'Very weak', color: '#ef4444' },
    { label: 'Weak', color: '#f97316' },
    { label: 'Fair', color: '#eab308' },
    { label: 'Good', color: '#4F7942' },
    { label: 'Strong', color: '#355E3B' },
    { label: 'Very strong', color: '#355E3B' },
  ];
  return { score, ...levels[Math.min(score, 5)] };
}

export function validateEmployeeId(id: string): string | null {
  if (!id.trim()) return 'Employee ID is required';
  if (id.length < 3) return 'Employee ID must be at least 3 characters';
  if (!/^[A-Za-z0-9_-]+$/.test(id)) return 'Employee ID can only contain letters, numbers, hyphens and underscores';
  return null;
}

export function validateDateRange(start: string, end: string): string | null {
  if (!start) return 'Start date is required';
  if (!end) return 'End date is required';
  if (new Date(end) < new Date(start)) return 'End date cannot be before start date';
  return null;
}

export function validateSalary(value: number, field: string): string | null {
  if (isNaN(value)) return `${field} must be a number`;
  if (value < 0) return `${field} cannot be negative`;
  return null;
}
