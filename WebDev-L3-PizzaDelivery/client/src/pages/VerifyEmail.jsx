import { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import AuthLayout from '../layouts/AuthLayout';
import Spinner from '../components/Spinner';
import Alert from '../components/Alert';
import Button from '../components/Button';
import TextField from '../components/TextField';
import * as authService from '../services/auth.service';
import { extractErrorMessage } from '../utils/errors';
import { validateEmail } from '../utils/validators';

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [status, setStatus] = useState('verifying'); // verifying | success | error
  const [message, setMessage] = useState('');
  const [resendEmail, setResendEmail] = useState('');
  const [resendError, setResendError] = useState('');
  const [resendState, setResendState] = useState('idle'); // idle | sending | sent
  // The verification token is one-time-use, so the request must fire exactly once per
  // token even though React 19 StrictMode intentionally mounts effects twice in dev.
  const requestedTokenRef = useRef(null);

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('This verification link is missing its token.');
      return;
    }

    if (requestedTokenRef.current === token) return;
    requestedTokenRef.current = token;

    authService
      .verifyEmail(token)
      .then((res) => {
        setStatus('success');
        setMessage(res.data.message);
      })
      .catch((error) => {
        setStatus('error');
        setMessage(extractErrorMessage(error, 'This verification link is invalid or has expired.'));
      });
  }, [token]);

  async function handleResend(e) {
    e.preventDefault();
    const emailErr = validateEmail(resendEmail);
    setResendError(emailErr);
    if (emailErr) return;

    setResendState('sending');
    try {
      await authService.resendVerification(resendEmail);
      setResendState('sent');
    } catch (error) {
      setResendState('idle');
      setResendError(extractErrorMessage(error, 'Could not resend verification email.'));
    }
  }

  return (
    <AuthLayout title="Email verification">
      {status === 'verifying' && <Spinner label="Verifying your email..." />}
      {status === 'success' && (
        <div className="space-y-4">
          <Alert type="success">{message}</Alert>
          <Link to="/login">
            <Button>Go to login</Button>
          </Link>
        </div>
      )}
      {status === 'error' && (
        <div className="space-y-4">
          <Alert type="error">{message}</Alert>

          {resendState === 'sent' ? (
            <Alert type="success">
              If an unverified account exists for that email, a new verification link has been sent.
            </Alert>
          ) : (
            <form className="space-y-3 text-left" onSubmit={handleResend} noValidate>
              <p className="text-sm text-ink-900/70">Request a new verification link:</p>
              <TextField
                id="resendEmail"
                label="Email address"
                type="email"
                value={resendEmail}
                onChange={(e) => setResendEmail(e.target.value)}
                error={resendError}
              />
              <Button type="submit" variant="ghost" isLoading={resendState === 'sending'}>
                Resend verification email
              </Button>
            </form>
          )}

          <Link to="/register" className="block text-center text-sm text-tomato-500 hover:underline">
            Back to registration
          </Link>
        </div>
      )}
    </AuthLayout>
  );
}
