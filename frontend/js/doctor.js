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
  appointments: [],
  patients: [],
  editingId: null
};

function renderAppointments() {
  const body = $('#doctorAppointmentsBody');
  if (!body) return;

  if (state.appointments.length === 0) {
    body.innerHTML = `
      <tr>
        <td colspan="9" class="tableEmpty">Aucun rendez-vous trouvé.</td>
      </tr>
    `;
    return;
  }

  body.innerHTML = state.appointments.map((appointment) => `
    <tr>
      <td>${appointment.patient_first_name} ${appointment.patient_last_name}</td>
      <td>${appointment.patient_email}</td>
      <td>${formatDate(appointment.appointment_date)}</td>
      <td>${appointment.appointment_time}</td>
      <td>${appointment.reason}</td>
      <td>${appointment.notes || '—'}</td>
      <td><span class="${statusClass(appointment.status)}">${statusLabel(appointment.status)}</span></td>
      <td>${appointment.patient_phone || '—'}</td>
      <td class="tableActions">
        <button class="btn btn--small" data-action="edit-appointment" data-id="${appointment.id}">
          Modifier
        </button>
        <button class="btn btn--small btn--success" data-action="confirm-appointment" data-id="${appointment.id}" ${appointment.status === 'cancelled' ? 'disabled' : ''}>
          Confirmer
        </button>
        <button class="btn btn--small btn--danger" data-action="reject-appointment" data-id="${appointment.id}" ${appointment.status === 'cancelled' ? 'disabled' : ''}>
          Rejeter
        </button>
      </td>
    </tr>
  `).join('');
}

function renderPatients() {
  const container = $('#patientSearchResults');
  if (!container) return;

  if (state.patients.length === 0) {
    container.innerHTML = '<p class="emptyState">Aucun patient trouvé.</p>';
    return;
  }

  container.innerHTML = state.patients.map((patient) => `
    <article class="resultCard">
      <div>
        <h3>${patient.first_name} ${patient.last_name}</h3>
        <p class="muted">${patient.email}</p>
      </div>
      <div class="resultMeta">
        <span>${patient.city}</span>
        <span>${patient.phone}</span>
      </div>
    </article>
  `).join('');
}

async function loadAppointments(search = '', status = '') {
  const params = new URLSearchParams();
  if (search) params.set('search', search);
  if (status) params.set('status', status);

  const suffix = params.toString() ? `?${params.toString()}` : '';
  const response = await apiRequest(`/appointments${suffix}`);
  state.appointments = response.appointments || [];
  renderAppointments();
}

async function loadPatients(search = '') {
  const suffix = search ? `?search=${encodeURIComponent(search)}` : '';
  const response = await apiRequest(`/patients${suffix}`);
  state.patients = response.patients || [];
  renderPatients();
}

function startEdit(appointmentId) {
  const appointment = state.appointments.find((item) => item.id === appointmentId);
  if (!appointment) return;

  state.editingId = appointmentId;
  $('#doctorFormTitle').textContent = 'Modifier le rendez-vous';
  $('#doctorSubmitBtn').textContent = 'Enregistrer';
  $('#doctorCancelEditBtn').hidden = false;
  $('#editAppointmentDate').value = normalizeDate(appointment.appointment_date);
  $('#editAppointmentTime').value = appointment.appointment_time;
  $('#editReason').value = appointment.reason || '';
  $('#editNotes').value = appointment.notes || '';
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function resetEditForm() {
  $('#doctorEditForm')?.reset();
  $('#doctorFormTitle').textContent = 'Modifier un rendez-vous sélectionné';
  $('#doctorSubmitBtn').textContent = 'Enregistrer';
  $('#doctorCancelEditBtn').hidden = true;
  state.editingId = null;
}

async function updateStatus(id, status) {
  return apiRequest(`/appointments/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status })
  });
}

document.addEventListener('DOMContentLoaded', async () => {
  const user = await protectPage('doctor');
  if (!user) return;

  fillUserCard(user);
  attachLogout();

  const editForm = $('#doctorEditForm');
  const editMessage = $('#doctorEditMessage');
  const filterForm = $('#doctorFilterForm');
  const patientSearchForm = $('#patientSearchForm');
  const patientSearchMessage = $('#patientSearchMessage');

  $('#doctorWelcomeText').textContent = `Bonjour Dr ${fullName(user)}`;

  await loadAppointments();
  await loadPatients();

  editForm?.addEventListener('submit', async (event) => {
    event.preventDefault();

    if (!state.editingId) {
      showMessage(editMessage, 'Sélectionnez d’abord un rendez-vous à modifier.', 'error');
      return;
    }

    showMessage(editMessage, 'Mise à jour du rendez-vous...', 'info');

    try {
      const response = await apiRequest(`/appointments/${state.editingId}`, {
        method: 'PATCH',
        body: JSON.stringify({
          appointment_date: $('#editAppointmentDate').value,
          appointment_time: $('#editAppointmentTime').value,
          reason: $('#editReason').value.trim(),
          notes: $('#editNotes').value.trim()
        })
      });

      showMessage(editMessage, response.message, 'success');
      resetEditForm();
      await loadAppointments($('#doctorSearchInput').value.trim(), $('#statusFilter').value);
    } catch (error) {
      showMessage(editMessage, error.message, 'error');
    }
  });

  $('#doctorCancelEditBtn')?.addEventListener('click', () => {
    resetEditForm();
    showMessage(editMessage, 'Modification annulée.', 'info');
  });

  filterForm?.addEventListener('submit', async (event) => {
    event.preventDefault();
    await loadAppointments($('#doctorSearchInput').value.trim(), $('#statusFilter').value);
  });

  patientSearchForm?.addEventListener('submit', async (event) => {
    event.preventDefault();
    showMessage(patientSearchMessage, 'Recherche de patients...', 'info');

    try {
      await loadPatients($('#patientSearchInput').value.trim());
      showMessage(patientSearchMessage, `${state.patients.length} résultat(s) trouvé(s).`, 'success');
    } catch (error) {
      showMessage(patientSearchMessage, error.message, 'error');
    }
  });

  $('#doctorAppointmentsBody')?.addEventListener('click', async (event) => {
    const button = event.target.closest('button[data-action]');
    if (!button) return;

    const appointmentId = Number(button.dataset.id);

    if (button.dataset.action === 'edit-appointment') {
      startEdit(appointmentId);
      return;
    }

    try {
      let response;

      if (button.dataset.action === 'confirm-appointment') {
        response = await updateStatus(appointmentId, 'confirmed');
      }

      if (button.dataset.action === 'reject-appointment') {
        response = await updateStatus(appointmentId, 'rejected');
      }

      if (response) {
        showMessage(editMessage, response.message, 'success');
        await loadAppointments($('#doctorSearchInput').value.trim(), $('#statusFilter').value);
      }
    } catch (error) {
      showMessage(editMessage, error.message, 'error');
    }
  });
});
