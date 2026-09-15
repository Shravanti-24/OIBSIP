import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthLayout from '../layouts/AuthLayout';
import TextField from '../components/TextField';
import Button from '../components/Button';
import Alert from '../components/Alert';
import * as authService from '../services/auth.service';
import { extractErrorMessage } from '../utils/errors';
import {
  validateName,
  validateEmail,
  validatePassword,
  validateConfirmPassword,
} from '../utils/validators';

const initialForm = { name: '', email: '', password: '', confirmPassword: '' };

export default function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState('');
  const [success, setSuccess] = useState(false);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  function validate() {
    const nextErrors = {
      name: validateName(form.name),
      email: validateEmail(form.email),
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
      await authService.register(form);
      setSuccess(true);
    } catch (error) {
      setServerError(extractErrorMessage(error, 'Could not create your account.'));
    } finally {
      setIsSubmitting(false);
    }
  }

  if (success) {
    return (
      <AuthLayout title="Check your inbox">
        <Alert type="success">
          We sent a verification link to <strong>{form.email}</strong>. Verify your email to activate your
          account, then log in.
        </Alert>
        <Button className="mt-6" onClick={() => navigate('/login')}>
          Go to login
        </Button>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Create your account"
      subtitle="Join Pizza House to order your favorite pizzas"
      footer={
        <>
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-tomato-500 hover:underline">
            Log in
          </Link>
        </>
      }
    >
      <form className="space-y-4" onSubmit={handleSubmit} noValidate>
        <Alert type="error">{serverError}</Alert>
        <TextField
          id="name"
          label="Full name"
          autoComplete="name"
          value={form.name}
          onChange={handleChange}
          error={errors.name}
        />
        <TextField
          id="email"
          label="Email address"
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
          autoComplete="new-password"
          value={form.password}
          onChange={handleChange}
          error={errors.password}
        />
        <TextField
          id="confirmPassword"
          label="Confirm password"
          type="password"
          autoComplete="new-password"
          value={form.confirmPassword}
          onChange={handleChange}
          error={errors.confirmPassword}
        />
        <Button type="submit" isLoading={isSubmitting}>
          Create account
        </Button>
      </form>
    </AuthLayout>
  );
}
