import { describe, it, expect } from 'vitest';
import { extractErrorMessage } from '../utils/errors';

describe('extractErrorMessage', () => {
  it('prefers field-level validation details, joined into one message', () => {
    const error = {
      response: {
        data: { details: [{ message: 'Email is invalid' }, { message: 'Password is too short' }] },
      },
    };
    expect(extractErrorMessage(error)).toBe('Email is invalid Password is too short');
  });

  it("falls back to the API's own message", () => {
    const error = { response: { data: { message: 'Account is not verified' } } };
    expect(extractErrorMessage(error)).toBe('Account is not verified');
  });

  it('explains a network failure in plain language', () => {
    expect(extractErrorMessage({ message: 'Network Error' })).toBe(
      'Could not reach the server. Please check your connection and try again.',
    );
  });

  it('uses the default fallback for an unrecognised error', () => {
    expect(extractErrorMessage(new Error('boom'))).toBe('Something went wrong. Please try again.');
  });

  it('uses a caller-supplied fallback when given one', () => {
    expect(extractErrorMessage(undefined, 'Could not load the menu.')).toBe(
      'Could not load the menu.',
    );
  });
});
