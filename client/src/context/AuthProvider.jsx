import { useCallback, useEffect, useMemo, useState } from 'react';
import * as authService from '../services/auth.service';
import { AuthContext } from './authContext';

/**
 * Resolves the signed-in user from the session cookie, or `null` when there is
 * no valid session. A failed request is not an error condition here - "not
 * signed in" is the expected answer for most visitors.
 */
function fetchUserOrNull() {
  return authService
    .fetchCurrentUser()
    .then((res) => res.data.data.user)
    .catch(() => null);
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Re-resolves the session on demand (exposed as `refresh`).
  const loadCurrentUser = useCallback(async () => {
    const nextUser = await fetchUserOrNull();
    setUser(nextUser);
    setIsLoading(false);
    return nextUser;
  }, []);

  // Initial session probe. Guarded so a response that lands after unmount
  // (or after StrictMode's double mount in development) is discarded.
  useEffect(() => {
    let active = true;
    fetchUserOrNull().then((nextUser) => {
      if (!active) return;
      setUser(nextUser);
      setIsLoading(false);
    });
    return () => {
      active = false;
    };
  }, []);

  const login = useCallback(async (credentials) => {
    const res = await authService.login(credentials);
    setUser(res.data.data.user);
    return res.data.data.user;
  }, []);

  const adminLogin = useCallback(async (credentials) => {
    const res = await authService.adminLogin(credentials);
    setUser(res.data.data.user);
    return res.data.data.user;
  }, []);

  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } finally {
      setUser(null);
    }
  }, []);

  const value = useMemo(
    () => ({ user, isLoading, login, adminLogin, logout, refresh: loadCurrentUser }),
    [user, isLoading, login, adminLogin, logout, loadCurrentUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
