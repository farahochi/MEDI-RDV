import { apiRequest } from './api.js';
import {
  $,
  attachLogout,
  fillUserCard,
  formatDate,
  fullName,
  protectPage,
  showMessage,
  statusClass,
  statusLabel,
  normalizeDate
} from './common.js';

const state = {
  doctors: [],
  appointments: [],
  editingId: null
};

function fillDoctorSelect(doctors) {
  const select = $('#doctorId');
  if (!select) return;

  select.innerHTML = `
    <option value="">-- Choisir un docteur --</option>
    ${doctors.map((doctor) => `
      <option value="${doctor.id}">
        Dr ${doctor.first_name} ${doctor.last_name} — ${doctor.specialty || 'Spécialité'}
      </option>
    `).join('')}
  `;
}

function renderDoctorSearch(doctors) {
  const container = $('#doctorSearchResults');
  if (!container) return;

  if (doctors.length === 0) {
    container.innerHTML = '<p class="emptyState">Aucun docteur trouvé.</p>';
    return;
  }

  container.innerHTML = doctors.map((doctor) => `
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
}

function renderAppointments() {
  const body = $('#appointmentsBody');
  if (!body) return;

  if (state.appointments.length === 0) {
    body.innerHTML = `
      <tr>
        <td colspan="8" class="tableEmpty">Aucun rendez-vous pour le moment.</td>
      </tr>
    `;
    return;
  }

  body.innerHTML = state.appointments.map((appointment) => `
    <tr>
      <td>Dr ${appointment.doctor_first_name} ${appointment.doctor_last_name}</td>
      <td>${appointment.doctor_specialty || '—'}</td>
      <td>${formatDate(appointment.appointment_date)}</td>
      <td>${appointment.appointment_time}</td>
      <td>${appointment.reason}</td>
      <td>${appointment.notes || '—'}</td>
      <td><span class="${statusClass(appointment.status)}">${statusLabel(appointment.status)}</span></td>
      <td class="tableActions">
        <button class="btn btn--small" data-action="edit-appointment" data-id="${appointment.id}" ${appointment.can_patient_edit ? '' : 'disabled'}>
          Modifier
        </button>
        <button class="btn btn--small btn--danger" data-action="cancel-appointment" data-id="${appointment.id}" ${appointment.can_patient_cancel ? '' : 'disabled'}>
          Annuler
        </button>
      </td>
    </tr>
  `).join('');
}

async function loadAppointments() {
  const response = await apiRequest('/appointments');
  state.appointments = response.appointments || [];
  renderAppointments();
}

async function loadDoctors(search = '') {
  const response = await apiRequest(`/doctors${search ? `?search=${encodeURIComponent(search)}` : ''}`);
  state.doctors = response.doctors || [];
  fillDoctorSelect(state.doctors);
  renderDoctorSearch(state.doctors);
}

function resetAppointmentForm() {
  const form = $('#appointmentForm');
  form?.reset();
  state.editingId = null;
  $('#formTitle').textContent = 'Nouveau rendez-vous';
  $('#submitAppointmentBtn').textContent = 'Ajouter le rendez-vous';
  $('#cancelEditBtn').hidden = true;
}

function startEdit(appointmentId) {
  const appointment = state.appointments.find((item) => item.id === appointmentId);
  if (!appointment) return;

  state.editingId = appointmentId;
  $('#formTitle').textContent = 'Modifier le rendez-vous';
  $('#submitAppointmentBtn').textContent = 'Enregistrer les modifications';
  $('#cancelEditBtn').hidden = false;
  $('#doctorId').value = appointment.doctor_id;
  $('#appointmentDate').value = normalizeDate(appointment.appointment_date);
  $('#appointmentTime').value = appointment.appointment_time;
  $('#reason').value = appointment.reason || '';
  $('#notes').value = appointment.notes || '';
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

async function submitAppointmentForm() {
  const payload = {
    doctor_id: Number($('#doctorId').value),
    appointment_date: $('#appointmentDate').value,
    appointment_time: $('#appointmentTime').value,
    reason: $('#reason').value.trim(),
    notes: $('#notes').value.trim()
  };

  if (state.editingId) {
    return apiRequest(`/appointments/${state.editingId}`, {
      method: 'PATCH',
      body: JSON.stringify(payload)
    });
  }

  return apiRequest('/appointments', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}

document.addEventListener('DOMContentLoaded', async () => {
  const user = await protectPage('patient');
  if (!user) return;

  fillUserCard(user);
  attachLogout();

  const appointmentForm = $('#appointmentForm');
  const appointmentMessage = $('#appointmentMessage');
  const searchForm = $('#doctorSearchForm');
  const searchMessage = $('#doctorSearchMsg');
  const table = $('#appointmentsBody');

  await loadDoctors();
  await loadAppointments();

  appointmentForm?.addEventListener('submit', async (event) => {
    event.preventDefault();
    showMessage(appointmentMessage, 'Enregistrement...', 'info');

    try {
      const response = await submitAppointmentForm();
      showMessage(appointmentMessage, response.message, 'success');
      resetAppointmentForm();
      await loadAppointments();
      await loadDoctors($('#doctorSearchInput').value.trim());
    } catch (error) {
      showMessage(appointmentMessage, error.message, 'error');
    }
  });

  $('#cancelEditBtn')?.addEventListener('click', () => {
    resetAppointmentForm();
    showMessage(appointmentMessage, 'Modification annulée.', 'info');
  });

  searchForm?.addEventListener('submit', async (event) => {
    event.preventDefault();
    showMessage(searchMessage, 'Recherche de docteurs...', 'info');

    try {
      await loadDoctors($('#doctorSearchInput').value.trim());
      showMessage(searchMessage, `${state.doctors.length} résultat(s) trouvé(s).`, 'success');
    } catch (error) {
      showMessage(searchMessage, error.message, 'error');
    }
  });

  table?.addEventListener('click', async (event) => {
    const button = event.target.closest('button[data-action]');
    if (!button) return;

    const appointmentId = Number(button.dataset.id);

    if (button.dataset.action === 'edit-appointment') {
      startEdit(appointmentId);
      return;
    }

    if (button.dataset.action === 'cancel-appointment') {
      if (!window.confirm('Voulez-vous vraiment annuler ce rendez-vous ?')) return;

      try {
        const response = await apiRequest(`/appointments/${appointmentId}`, {
          method: 'DELETE'
        });
        showMessage(appointmentMessage, response.message, 'success');
        await loadAppointments();
      } catch (error) {
        showMessage(appointmentMessage, error.message, 'error');
      }
    }
  });

  $('#welcomeText').textContent = `Bienvenue ${fullName(user)}`;
});
