import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';

// Tests run without Vitest globals, so React Testing Library's automatic
// cleanup hook never registers itself - unmount between tests explicitly,
// otherwise renders pile up in the same document.
afterEach(() => {
  cleanup();
});
