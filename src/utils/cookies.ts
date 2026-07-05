/**
 * Utility to set a cookie with environment checking for SSR/Node contexts.
 */
export const setCookie = (name: string, value: string, maxAgeSeconds: number) => {
  if (typeof document === 'undefined') return;
  const secure = typeof window !== 'undefined' && window.location.protocol === 'https:' ? 'Secure;' : '';
  document.cookie = `${encodeURIComponent(name)}=${encodeURIComponent(value)}; path=/; max-age=${maxAgeSeconds}; SameSite=Lax; ${secure}`;
};

/**
 * Utility to retrieve a cookie value with environment checking.
 */
export const getCookie = (name: string): string | null => {
  if (typeof document === 'undefined') return null;
  const nameEQ = encodeURIComponent(name) + "=";
  const ca = document.cookie.split(';');
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i].trim();
    if (c.indexOf(nameEQ) === 0) {
      return decodeURIComponent(c.substring(nameEQ.length));
    }
  }
  return null;
};

/**
 * Utility to erase a cookie with environment checking.
 */
export const eraseCookie = (name: string) => {
  if (typeof document === 'undefined') return;
  const secure = typeof window !== 'undefined' && window.location.protocol === 'https:' ? 'Secure;' : '';
  document.cookie = `${encodeURIComponent(name)}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax; ${secure}`;
};
