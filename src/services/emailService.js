import emailjs from '@emailjs/browser';

// Initialize EmailJS with your public key
const initEmailJS = () => {
  const publicKey = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;
  if (publicKey) {
    emailjs.init(publicKey);
  } else {
    console.warn('EmailJS public key not configured');
  }
};

// Initialize on module load
initEmailJS();

/**
 * Send missed medication alert email to caretaker
 * @param {Object} params - Email parameters
 * @param {string} params.caretakerEmail - Caretaker's email address
 * @param {string} params.patientEmail - Patient's email address
 * @param {string} params.medicineName - Name of the missed medicine
 * @param {string} params.dosage - Dosage information
 * @param {string} params.scheduledTime - Scheduled time for the medicine
 */
export const sendMissedMedicineAlert = async ({
  caretakerEmail,
  patientEmail,
  medicineName,
  dosage,
  scheduledTime
}) => {
  const serviceId = import.meta.env.VITE_EMAILJS_SERVICE_ID;
  const templateId = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;

  if (!serviceId || !templateId) {
    console.warn('EmailJS not configured. Skipping email alert.');
    return { success: false, reason: 'not_configured' };
  }

  try {
    const templateParams = {
      to_email: caretakerEmail,
      patient_email: patientEmail,
      medicine_name: medicineName,
      dosage: dosage,
      scheduled_time: scheduledTime,
      current_date: new Date().toLocaleDateString(),
      current_time: new Date().toLocaleTimeString()
    };

    const response = await emailjs.send(serviceId, templateId, templateParams);
    
    console.log('Alert email sent successfully:', response);
    return { success: true, response };
  } catch (error) {
    console.error('Failed to send alert email:', error);
    return { success: false, error };
  }
};

/**
 * Check if a medicine is overdue (past scheduled time)
 * @param {string} timeStr - Time in "HH:MM" format
 * @returns {boolean} - True if medicine is overdue
 */
export const isMedicineOverdue = (timeStr) => {
  if (!timeStr) return false;
  
  const now = new Date();
  const [hours, minutes] = timeStr.split(':').map(Number);
  const medTime = new Date();
  medTime.setHours(hours, minutes, 0, 0);
  
  return now > medTime;
};

/**
 * Get medicines that are missed (overdue and not taken)
 * @param {Array} medicines - Array of medicine objects
 * @returns {Array} - Array of missed medicines
 */
export const getMissedMedicines = (medicines) => {
  return medicines.filter(med => !med.taken && isMedicineOverdue(med.time));
};

/**
 * Check if alert was already sent today for this medicine
 * @param {Object} med - Medicine object with lastAlertSent timestamp
 * @returns {boolean} - True if alert was already sent today
 */
export const wasAlertSentToday = (med) => {
  if (!med.lastAlertSent) return false;
  
  const today = new Date().toDateString();
  const alertDate = med.lastAlertSent.toDate 
    ? med.lastAlertSent.toDate().toDateString()
    : new Date(med.lastAlertSent).toDateString();
  
  return today === alertDate;
};
