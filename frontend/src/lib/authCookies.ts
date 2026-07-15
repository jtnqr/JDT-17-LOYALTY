const COOKIE_OPTIONS = "; path=/; SameSite=Lax";

export function setAuthCookies(token: string, role: string) {
  document.cookie = `token=${encodeURIComponent(token)}${COOKIE_OPTIONS}`;
  document.cookie = `role=${encodeURIComponent(role)}${COOKIE_OPTIONS}`;
}

export function clearAuthCookies() {
  document.cookie = "token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
  document.cookie = "role=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
}
