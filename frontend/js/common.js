import { clearAuth, getCurrentUser } from './storage.js';

export function $(selector) {
  return document.querySelector(selector);
}

export function $all(selector) {
  return [...document.querySelectorAll(selector)];
}

export function showMessage(target, message, type = 'info') {
  if (!target) return;
  target.textContent = message || '';
  target.className = `message message--${type}`;
}

export function normalizeDate(value) {
  if (!value) return '';

  if (typeof value === 'string') {
    if (value.includes('T')) {
      return value.split('T')[0];
    }
    return value.slice(0, 10);
  }

  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  return d.toISOString().slice(0, 10);
}

export function formatDate(dateValue) {
  const normalized = normalizeDate(dateValue);
  if (!normalized) return '—';

  const [year, month, day] = normalized.split('-');
  return `${day}/${month}/${year}`;
}

export function formatRole(role) {
  return role === 'doctor' ? 'Docteur' : 'Patient';
}

export function fullName(user) {
  return `${user.first_name || ''} ${user.last_name || ''}`.trim();
}

export function isToday(dateValue) {
  const normalized = normalizeDate(dateValue);

  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');

  return normalized === `${yyyy}-${mm}-${dd}`;
}

export function statusLabel(status) {
  const labels = {
    pending: 'En attente',
    confirmed: 'Confirmé',
    rejected: 'Rejeté',
    cancelled: 'Annulé'
  };
  return labels[status] || status;
}

export function statusClass(status) {
  return `badge badge--${status || 'default'}`;
}

export function logout() {
  clearAuth();
  window.location.href = 'login.html';
}

export function attachLogout() {
  const button = document.querySelector('[data-action="logout"]');
  if (button) {
    button.addEventListener('click', logout);
  }
}

export async function protectPage(expectedRole) {
  const authUser = getCurrentUser();

  if (!authUser) {
    window.location.href = 'login.html';
    return null;
  }

  if (expectedRole && authUser.role !== expectedRole) {
    window.location.href = authUser.role === 'doctor'
      ? 'doctor-dashboard.html'
      : 'patient-dashboard.html';
    return null;
  }

  return authUser;
}

export function fillUserCard(user) {
  const nameTarget = document.querySelector('[data-user-name]');
  const emailTarget = document.querySelector('[data-user-email]');
  const roleTarget = document.querySelector('[data-user-role]');
  const cityTarget = document.querySelector('[data-user-city]');
  const specialtyTarget = document.querySelector('[data-user-specialty]');

  if (nameTarget) nameTarget.textContent = fullName(user);
  if (emailTarget) emailTarget.textContent = user.email || '';
  if (roleTarget) roleTarget.textContent = formatRole(user.role);
  if (cityTarget) cityTarget.textContent = user.city || '—';
  if (specialtyTarget) {
    specialtyTarget.textContent = user.specialty || '—';
  }
}
