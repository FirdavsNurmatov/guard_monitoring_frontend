/**
 * Format date to DD/MM/YYYY format
 * @param {Date|string} date - Date object or date string
 * @param {boolean} includeTime - Whether to include time (HH:MM)
 * @returns {string} Formatted date string
 */
export const formatDate = (date, includeTime = false) => {
  const d = new Date(date);
  
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  
  if (includeTime) {
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `${day}/${month}/${year} ${hours}:${minutes}`;
  }
  
  return `${day}/${month}/${year}`;
};

/**
 * Format time only (HH:MM)
 * @param {Date|string} date - Date object or date string
 * @returns {string} Formatted time string
 */
export const formatTime = (date) => {
  const d = new Date(date);
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
};
