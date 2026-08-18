export type FieldErrors = Record<string, string>;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateEmail(email: string): string | null {
  const value = email.trim();
  if (!value) return "Email is required";
  if (!EMAIL_RE.test(value)) return "Enter a valid email address";
  return null;
}

export function validatePassword(password: string, { min = 6 } = {}): string | null {
  if (!password) return "Password is required";
  if (password.length < min) {
    return `Password must be at least ${min} characters`;
  }
  return null;
}

export function validateName(name: string): string | null {
  const value = name.trim();
  if (!value) return "Name is required";
  if (value.length < 2) return "Name must be at least 2 characters";
  return null;
}

export function validateLoginForm(input: {
  email: string;
  password: string;
}): FieldErrors {
  const errors: FieldErrors = {};
  const emailError = validateEmail(input.email);
  const passwordError = validatePassword(input.password);
  if (emailError) errors.email = emailError;
  if (passwordError) errors.password = passwordError;
  return errors;
}

export function validateRegisterForm(input: {
  name: string;
  email: string;
  password: string;
}): FieldErrors {
  const errors: FieldErrors = {};
  const nameError = validateName(input.name);
  const emailError = validateEmail(input.email);
  const passwordError = validatePassword(input.password);
  if (nameError) errors.name = nameError;
  if (emailError) errors.email = emailError;
  if (passwordError) errors.password = passwordError;
  return errors;
}
