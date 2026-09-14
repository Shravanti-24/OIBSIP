import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthLayout from '../layouts/AuthLayout';
import TextField from '../components/TextField';
import Button from '../components/Button';
import Alert from '../components/Alert';
import { useAuth } from '../hooks/useAuth';
import { extractErrorMessage } from '../utils/errors';
import { validateEmail } from '../utils/validators';

export default function AdminLogin() {
  const { adminLogin } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  function validate() {
    const nextErrors = {
      email: validateEmail(form.email),
      password: form.password ? '' : 'Password is required',
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
      await adminLogin(form);
      navigate('/admin', { replace: true });
    } catch (error) {
      setServerError(extractErrorMessage(error, 'Could not log in.'));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AuthLayout
      title="Admin login"
      subtitle="Restricted access for Pizza Delivery staff"
      footer={
        <Link to="/login" className="text-ink-900/50 hover:underline">
          Back to customer login
        </Link>
      }
    >
      <form className="space-y-4" onSubmit={handleSubmit} noValidate>
        <Alert type="error">{serverError}</Alert>
        <TextField
          id="email"
          label="Admin email"
          type="email"
          autoComplete="email"
          value={form.email}
          onChange={handleChange}
          error={errors.email}
        />
        <TextField
          id="password"
          label="Password"
          type="password"
          autoComplete="current-password"
          value={form.password}
          onChange={handleChange}
          error={errors.password}
        />
        <Button type="submit" variant="admin" isLoading={isSubmitting}>
          Log in as admin
        </Button>
      </form>
    </AuthLayout>
  );
}
