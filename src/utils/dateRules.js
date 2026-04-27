function toLocalDateString(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function isToday(dateString) {
  return dateString === toLocalDateString();
}

function isPastDate(dateString) {
  return dateString < toLocalDateString();
}

function canPatientEdit(dateString) {
  return !isToday(dateString);
}

function canPatientCancel(dateString, status) {
  return !(isToday(dateString) && status === 'confirmed');
}

module.exports = {
  toLocalDateString,
  isToday,
  isPastDate,
  canPatientEdit,
  canPatientCancel
};
