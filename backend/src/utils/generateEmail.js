// src/utils/generateEmail.js
// Generate email addresses from names

/**
 * Clean and format name for email generation
 * @param {string} name - Full name
 * @returns {string} - Cleaned name
 */
export function cleanName(name) {
  if (!name || typeof name !== 'string') return '';
  
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '') // Remove special characters
    .replace(/\s+/g, '.') // Replace spaces with dots
    .replace(/\.+/g, '.') // Replace multiple dots with single dot
    .replace(/^\.|\.$/g, ''); // Remove leading/trailing dots
}

/**
 * Generate email from name
 * @param {string} name - Full name
 * @param {string} domain - Email domain (default: 'insightly.com')
 * @returns {string} - Generated email
 */
export function generateEmail(name, domain = 'insightly.com') {
  const cleaned = cleanName(name);
  if (!cleaned) {
    // Fallback: use timestamp if name is invalid
    return `user.${Date.now()}@${domain}`;
  }
  return `${cleaned}@${domain}`;
}

/**
 * Generate unique email if email already exists
 * @param {string} baseEmail - Base email
 * @param {Function} checkExists - Async function to check if email exists
 * @returns {Promise<string>} - Unique email
 */
export async function generateUniqueEmail(baseEmail, checkExists) {
  let email = baseEmail;
  let counter = 1;
  
  while (await checkExists(email)) {
    const [localPart, domain] = baseEmail.split('@');
    email = `${localPart}.${counter}@${domain}`;
    counter++;
  }
  
  return email;
}

