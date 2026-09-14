import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import AuthLayout from '../layouts/AuthLayout';
import TextField from '../components/TextField';
import Button from '../components/Button';
import Alert from '../components/Alert';
import * as authService from '../services/auth.service';
import { extractErrorMessage } from '../utils/errors';
import { validatePassword, validateConfirmPassword } from '../utils/validators';

export default function ResetPassword() {
  const { token } = useParams();
  const [form, setForm] = useState({ password: '', confirmPassword: '' });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  function validate() {
    const nextErrors = {
      password: validatePassword(form.password),
      confirmPassword: validateConfirmPassword(form.password, form.confirmPassword),
    };
    setErrors(nextErrors);
    return Object.values(nextErrors).every((msg) => !msg);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setServerError('');
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      await authService.resetPassword({ token, ...form });
      setSuccess(true);
    } catch (error) {
      setServerError(extractErrorMessage(error, 'This reset link is invalid or has expired.'));
    } finally {
      setIsSubmitting(false);
    }
  }

  if (success) {
    return (
      <AuthLayout title="Password reset">
        <Alert type="success">Your password has been reset successfully.</Alert>
        <Link to="/login">
          <Button className="mt-6">Go to login</Button>
        </Link>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title="Choose a new password" subtitle="Enter and confirm your new password">
      <form className="space-y-4" onSubmit={handleSubmit} noValidate>
        <Alert type="error">{serverError}</Alert>
        <TextField
          id="password"
          label="New password"
          type="password"
          autoComplete="new-password"
          value={form.password}
          onChange={handleChange}
          error={errors.password}
        />
        <TextField
          id="confirmPassword"
          label="Confirm new password"
          type="password"
          autoComplete="new-password"
          value={form.confirmPassword}
          onChange={handleChange}
          error={errors.confirmPassword}
        />
        <Button type="submit" isLoading={isSubmitting}>
          Reset password
        </Button>
      </form>
    </AuthLayout>
  );
}
