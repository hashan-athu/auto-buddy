import axios from 'axios';

// Single axios instance for the whole app.
// - baseURL '/api' is proxied to Django by Vite in dev (see vite.config.js).
// - withCredentials sends the session cookie.
// - xsrf* map Django's CSRF cookie/header names so axios attaches the token
//   automatically on mutating requests.
export const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
  xsrfCookieName: 'csrftoken',
  xsrfHeaderName: 'X-CSRFToken',
});

// Call once on app load so the browser holds a CSRF cookie before the first POST.
export async function ensureCsrf() {
  await api.get('/auth/csrf/');
}
