export function getAuthToken(): string | null {
  return localStorage.getItem("kta_admin_token");
}

export function setAuthToken(token: string) {
  localStorage.setItem("kta_admin_token", token);
}

export function removeAuthToken() {
  localStorage.removeItem("kta_admin_token");
}
