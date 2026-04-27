const AUTH_STORAGE_KEY = 'medirdv_auth';

export function saveAuth(payload) {
  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(payload));
}

export function getAuth() {
  try {
    return JSON.parse(localStorage.getItem(AUTH_STORAGE_KEY) || 'null');
  } catch {
    return null;
  }
}

export function getToken() {
  return getAuth()?.token || '';
}

export function getCurrentUser() {
  return getAuth()?.user || null;
}

export function clearAuth() {
  localStorage.removeItem(AUTH_STORAGE_KEY);
}
