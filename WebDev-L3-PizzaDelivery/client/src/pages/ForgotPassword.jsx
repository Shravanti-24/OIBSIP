import { useState } from 'react';
import { Link } from 'react-router-dom';
import AuthLayout from '../layouts/AuthLayout';
import TextField from '../components/TextField';
import Button from '../components/Button';
import Alert from '../components/Alert';
import * as authService from '../services/auth.service';
import { extractErrorMessage } from '../utils/errors';
import { validateEmail } from '../utils/validators';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [serverError, setServerError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setServerError('');
    const emailError = validateEmail(email);
    setError(emailError);
    if (emailError) return;

    setIsSubmitting(true);
    try {
      await authService.forgotPassword(email);
      setSent(true);
    } catch (error_) {
      setServerError(extractErrorMessage(error_, 'Could not send reset email.'));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AuthLayout
      title="Forgot your password?"
      subtitle="Enter your email and we'll send you a reset link"
      footer={
        <Link to="/login" className="font-medium text-tomato-500 hover:underline">
          Back to login
        </Link>
      }
    >
      {sent ? (
        <Alert type="success">
          If an account exists for <strong>{email}</strong>, a password reset link has been sent.
        </Alert>
      ) : (
        <form className="space-y-4" onSubmit={handleSubmit} noValidate>
          <Alert type="error">{serverError}</Alert>
          <TextField
            id="email"
            label="Email address"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={error}
          />
          <Button type="submit" isLoading={isSubmitting}>
            Send reset link
          </Button>
        </form>
      )}
    </AuthLayout>
  );
}
