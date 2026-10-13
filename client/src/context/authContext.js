import { createContext } from 'react';

/**
 * Session context. Kept in its own module so the provider file only exports
 * components, which is what Vite's fast refresh needs to update it in place.
 */
export const AuthContext = createContext(null);
