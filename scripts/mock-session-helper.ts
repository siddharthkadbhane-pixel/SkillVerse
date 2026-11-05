/**
 * TEST INFRASTRUCTURE ONLY — NEVER INCLUDED IN PRODUCTION BUILD
 *
 * Intercepts Next.js next/headers cookies/headers during headless Node.js tests
 * so that getSessionUser() can resolve demo users via its existing test mechanism
 * without requiring any test hooks in production code.
 */

const nextHeaders = require('next/headers');

let currentMockUserId: string | null = null;

// Intercept cookies() and headers() on next/headers for headless test runner
nextHeaders.cookies = async () => ({
  has: (name: string) => Boolean(currentMockUserId && name === 'skillverse_demo_user'),
  get: (name: string) => (currentMockUserId && name === 'skillverse_demo_user' ? { value: currentMockUserId } : undefined),
  getAll: () => (currentMockUserId ? [{ name: 'skillverse_demo_user', value: currentMockUserId }] : []),
});

nextHeaders.headers = async () => new Headers();

export function _setMockUser(user: { id?: string; role?: string } | null) {
  if (!user || !user.id) {
    currentMockUserId = null;
  } else {
    currentMockUserId = user.id;
  }
}
