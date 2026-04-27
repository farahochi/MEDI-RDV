import { apiRequest } from './api.js';
import { $, attachLogout, fillUserCard, protectPage, showMessage } from './common.js';

document.addEventListener('DOMContentLoaded', async () => {
  const user = await protectPage();
  if (!user) return;

  fillUserCard(user);
  attachLogout();

  const form = $('#resetPasswordForm');
  const msg = $('#resetPasswordMessage');

  form?.addEventListener('submit', async (event) => {
    event.preventDefault();
    showMessage(msg, 'Mise à jour du mot de passe...', 'info');

    const currentPassword = $('#currentPassword').value;
    const newPassword = $('#newPassword').value;
    const confirmPassword = $('#confirmPassword').value;

    if (newPassword !== confirmPassword) {
      showMessage(msg, 'La confirmation ne correspond pas au nouveau mot de passe.', 'error');
      return;
    }

    try {
      const response = await apiRequest('/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({
          currentPassword,
          newPassword
        })
      });

      form.reset();
      showMessage(msg, response.message, 'success');
    } catch (error) {
      showMessage(msg, error.message, 'error');
    }
  });
});
