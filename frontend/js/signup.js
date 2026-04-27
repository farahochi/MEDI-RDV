import { apiRequest } from './api.js';
import { $, $all, showMessage } from './common.js';
import { saveAuth, getCurrentUser } from './storage.js';

document.addEventListener('DOMContentLoaded', () => {
  const currentUser = getCurrentUser();
  if (currentUser) {
    window.location.href = currentUser.role === 'doctor'
      ? 'doctor-dashboard.html'
      : 'patient-dashboard.html';
    return;
  }

  const roleInput = $('#signupRole');
  const specialtyBlock = $('#specialtyBlock');
  const form = $('#signupForm');
  const msg = $('#signupMessage');

  function refreshRoleUI() {
    const role = roleInput.value;
    specialtyBlock.hidden = role !== 'doctor';

    $all('[data-role-tab]').forEach((button) => {
      button.classList.toggle('is-active', button.dataset.roleTab === role);
    });
  }

  $all('[data-role-tab]').forEach((button) => {
    button.addEventListener('click', () => {
      roleInput.value = button.dataset.roleTab;
      refreshRoleUI();
    });
  });

  refreshRoleUI();

  form?.addEventListener('submit', async (event) => {
    event.preventDefault();
    showMessage(msg, 'Création du compte en cours...', 'info');

    const role = roleInput.value;
    const payload = {
      first_name: $('#firstName').value.trim(),
      last_name: $('#lastName').value.trim(),
      email: $('#email').value.trim(),
      password: $('#password').value,
      phone: $('#phone').value.trim(),
      city: $('#city').value.trim()
    };

    if (role === 'doctor') {
      payload.specialty = $('#specialty').value.trim();
    }

    try {
      const response = await apiRequest(`/auth/register/${role}`, {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      saveAuth({
        token: response.token,
        user: response.user
      });

      window.location.href = response.user.role === 'doctor'
        ? 'doctor-dashboard.html'
        : 'patient-dashboard.html';
    } catch (error) {
      showMessage(msg, error.message, 'error');
    }
  });
});
