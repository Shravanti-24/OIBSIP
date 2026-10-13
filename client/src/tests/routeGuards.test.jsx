import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { AuthContext } from '../context/authContext';
import { AdminRoute, GuestRoute, ProtectedRoute } from '../components/ProtectedRoute';

const ADMIN = { _id: 'a1', name: 'Admin', role: 'admin' };
const CUSTOMER = { _id: 'u1', name: 'Ada', role: 'user' };

/**
 * Renders a guard around a protected page, with every redirect target the
 * guards can navigate to also mounted, so the assertion is "where did the
 * user actually end up" rather than "what did the component return".
 */
function renderGuard(Guard, session) {
  return render(
    <AuthContext.Provider value={{ isLoading: false, user: null, ...session }}>
      <MemoryRouter initialEntries={['/guarded']}>
        <Routes>
          <Route element={<Guard />}>
            <Route path="/guarded" element={<p>guarded page</p>} />
          </Route>
          <Route path="/login" element={<p>customer login</p>} />
          <Route path="/admin/login" element={<p>admin login</p>} />
          <Route path="/dashboard" element={<p>customer dashboard</p>} />
          <Route path="/admin" element={<p>admin dashboard</p>} />
        </Routes>
      </MemoryRouter>
    </AuthContext.Provider>,
  );
}

describe('ProtectedRoute', () => {
  it('waits for the session probe instead of bouncing the user to login', () => {
    renderGuard(ProtectedRoute, { isLoading: true });
    expect(screen.getByText('Checking your session...')).toBeInTheDocument();
    expect(screen.queryByText('customer login')).not.toBeInTheDocument();
    expect(screen.queryByText('guarded page')).not.toBeInTheDocument();
  });

  it('sends an anonymous visitor to the customer login', () => {
    renderGuard(ProtectedRoute, { user: null });
    expect(screen.getByText('customer login')).toBeInTheDocument();
  });

  it('renders the page for a signed-in customer', () => {
    renderGuard(ProtectedRoute, { user: CUSTOMER });
    expect(screen.getByText('guarded page')).toBeInTheDocument();
  });

  it('renders the page for an admin too', () => {
    renderGuard(ProtectedRoute, { user: ADMIN });
    expect(screen.getByText('guarded page')).toBeInTheDocument();
  });
});

describe('AdminRoute', () => {
  it('waits for the session probe', () => {
    renderGuard(AdminRoute, { isLoading: true });
    expect(screen.getByText('Checking your session...')).toBeInTheDocument();
  });

  it('sends an anonymous visitor to the admin login', () => {
    renderGuard(AdminRoute, { user: null });
    expect(screen.getByText('admin login')).toBeInTheDocument();
  });

  it('keeps a signed-in non-admin out, redirecting to their own dashboard', () => {
    renderGuard(AdminRoute, { user: CUSTOMER });
    expect(screen.getByText('customer dashboard')).toBeInTheDocument();
    expect(screen.queryByText('guarded page')).not.toBeInTheDocument();
  });

  it('lets an admin through', () => {
    renderGuard(AdminRoute, { user: ADMIN });
    expect(screen.getByText('guarded page')).toBeInTheDocument();
  });
});

describe('GuestRoute', () => {
  it('waits for the session probe', () => {
    renderGuard(GuestRoute, { isLoading: true });
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('renders the page for an anonymous visitor', () => {
    renderGuard(GuestRoute, { user: null });
    expect(screen.getByText('guarded page')).toBeInTheDocument();
  });

  it('redirects a signed-in customer to their dashboard', () => {
    renderGuard(GuestRoute, { user: CUSTOMER });
    expect(screen.getByText('customer dashboard')).toBeInTheDocument();
  });

  it('redirects a signed-in admin to the admin dashboard', () => {
    renderGuard(GuestRoute, { user: ADMIN });
    expect(screen.getByText('admin dashboard')).toBeInTheDocument();
  });
});
