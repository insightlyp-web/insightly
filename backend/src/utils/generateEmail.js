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
 * Generate email from name (short format: first_name.last_initial)
 * @param {string} name - Full name
 * @param {string} domain - Email domain (default: 'insightly.com')
 * @returns {string} - Generated email
 */
export function generateEmail(name, domain = 'insightly.com') {
  if (!name || typeof name !== 'string') {
    // Fallback: use timestamp if name is invalid
    return `user.${Date.now()}@${domain}`;
  }
  
  const parts = name.trim().toLowerCase().split(/\s+/).filter(p => p.length > 0);
  
  if (parts.length === 0) {
    return `user.${Date.now()}@${domain}`;
  }
  
  // Get first name
  const firstName = parts[0].replace(/[^a-z0-9]/g, '');
  
  // Get first letter of last name (or first name if only one part)
  let lastInitial = '';
  if (parts.length > 1) {
    const lastName = parts[parts.length - 1].replace(/[^a-z0-9]/g, '');
    lastInitial = lastName.charAt(0);
  } else {
    // If only one name, use first letter of first name
    lastInitial = firstName.charAt(0);
  }
  
  if (!firstName || !lastInitial) {
    return `user.${Date.now()}@${domain}`;
  }
  
  return `${firstName}.${lastInitial}@${domain}`;
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

