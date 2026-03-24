const TOKEN = 'lumin_token';
const USER = 'lumin_user';

export type StoredUser = {
  id: number;
  email: string;
  default_youtube_url?: string | null;
};

export function getAuthToken(): string | null {
  try {
    return localStorage.getItem(TOKEN);
  } catch {
    return null;
  }
}

export function getStoredUser(): StoredUser | null {
  try {
    const raw = localStorage.getItem(USER);
    if (!raw) return null;
    return JSON.parse(raw) as StoredUser;
  } catch {
    return null;
  }
}

export function setAuthSession(token: string, user: StoredUser) {
  localStorage.setItem(TOKEN, token);
  localStorage.setItem(USER, JSON.stringify(user));
}

export function clearAuthSession() {
  localStorage.removeItem(TOKEN);
  localStorage.removeItem(USER);
}

export function authHeaders(): Record<string, string> {
  const t = getAuthToken();
  return t ? { Authorization: `Bearer ${t}` } : {};
}
