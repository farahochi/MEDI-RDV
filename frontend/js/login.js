import { apiRequest } from './api.js';
import { $, showMessage } from './common.js';
import { saveAuth, getCurrentUser } from './storage.js';

document.addEventListener('DOMContentLoaded', () => {
  const currentUser = getCurrentUser();
  if (currentUser) {
    window.location.href = currentUser.role === 'doctor'
      ? 'doctor-dashboard.html'
      : 'patient-dashboard.html';
    return;
  }

  const form = $('#loginForm');
  const msg = $('#loginMessage');
  const togglePwd = $('#togglePassword');
  const passwordInput = $('#password');
  const fillPatientBtn = $('#fillPatientAccount');
  const fillDoctorBtn = $('#fillDoctorAccount');

  togglePwd?.addEventListener('click', () => {
    passwordInput.type = passwordInput.type === 'password' ? 'text' : 'password';
  });

  fillPatientBtn?.addEventListener('click', () => {
    $('#role').value = 'patient';
    $('#email').value = 'patient@medirdv.tn';
    $('#password').value = 'patient123';
    showMessage(msg, 'Compte patient pré-rempli.', 'success');
  });

  fillDoctorBtn?.addEventListener('click', () => {
    $('#role').value = 'doctor';
    $('#email').value = 'doctor@medirdv.tn';
    $('#password').value = 'doctor123';
    showMessage(msg, 'Compte docteur pré-rempli.', 'success');
  });

  form?.addEventListener('submit', async (event) => {
    event.preventDefault();
    showMessage(msg, 'Connexion en cours...', 'info');

    try {
      const response = await apiRequest('/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          role: $('#role').value,
          email: $('#email').value.trim(),
          password: $('#password').value
        })
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
