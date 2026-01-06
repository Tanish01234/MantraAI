/**
 * Extract first name and last name from email address
 * Example: tanis.bedia@gmail.com -> { firstName: 'Tanis', lastName: 'Bedia' }
 */
export function extractNameFromEmail(email: string): { firstName: string; lastName: string } {
  if (!email) {
    return { firstName: 'User', lastName: '' }
  }

  // Extract the part before @
  const localPart = email.split('@')[0]
  
  // Split by common separators (. _ -)
  const parts = localPart.split(/[._-]/)
  
  // Capitalize first letter of each part
  const capitalized = parts.map(part => 
    part.charAt(0).toUpperCase() + part.slice(1).toLowerCase()
  )
  
  // First part is first name, rest is last name
  const firstName = capitalized[0] || 'User'
  const lastName = capitalized.slice(1).join(' ') || ''
  
  return { firstName, lastName }
}

/**
 * Get user initials from email
 * Example: tanis.bedia@gmail.com -> 'TB'
 */
export function getInitialsFromEmail(email: string): string {
  const { firstName, lastName } = extractNameFromEmail(email)
  
  if (lastName) {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase()
  }
  
  return firstName.substring(0, 2).toUpperCase()
}
