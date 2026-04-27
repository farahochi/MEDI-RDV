import { apiRequest } from './api.js';
import { $, showMessage } from './common.js';

document.addEventListener('DOMContentLoaded', () => {
  const form = $('#publicDoctorSearchForm');
  const results = $('#doctorResults');
  const msg = $('#doctorSearchMessage');

  async function loadDoctors(search = '') {
    try {
      const response = await apiRequest(`/public/doctors${search ? `?search=${encodeURIComponent(search)}` : ''}`);
      const doctors = response.doctors || [];

      if (doctors.length === 0) {
        results.innerHTML = '<p class="emptyState">Aucun docteur trouvé.</p>';
        return;
      }

      results.innerHTML = doctors.map((doctor) => `
        <article class="resultCard">
          <div>
            <h3>Dr ${doctor.first_name} ${doctor.last_name}</h3>
            <p class="muted">${doctor.specialty || 'Spécialité non renseignée'}</p>
          </div>
          <div class="resultMeta">
            <span>${doctor.city}</span>
            <span>${doctor.email}</span>
            <span>${doctor.phone}</span>
          </div>
        </article>
      `).join('');
    } catch (error) {
      results.innerHTML = '';
      showMessage(msg, error.message, 'error');
    }
  }

  loadDoctors();

  form?.addEventListener('submit', async (event) => {
    event.preventDefault();
    showMessage(msg, 'Recherche...', 'info');
    await loadDoctors($('#doctorSearchInput').value.trim());
    showMessage(msg, '', 'info');
  });
});
