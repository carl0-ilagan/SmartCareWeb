/**
 * XSS Protection Utilities
 * Provides sanitization functions to prevent XSS attacks
 */

/**
 * Sanitize a string to prevent XSS in HTML attributes
 * Removes dangerous characters that could be used for injection
 */
export function sanitizeForAttribute(value) {
  if (!value || typeof value !== 'string') return ''
  
  // Remove characters that could break out of attributes
  return value
    .replace(/[<>"']/g, '') // Remove < > " '
    .replace(/[\n\r]/g, '') // Remove newlines
    .trim()
    .substring(0, 100) // Limit length
}

/**
 * Sanitize CSS value to prevent injection
 * Only allows safe CSS characters
 */
export function sanitizeCSSValue(value) {
  if (!value || typeof value !== 'string') return ''
  
  // Only allow alphanumeric, spaces, #, rgb, rgba, hsl, hsla, and basic CSS units
  const safeCSSRegex = /^[a-zA-Z0-9\s#().,%\-]+$/
  
  // Check if it's a valid CSS color format
  const colorFormats = [
    /^#[0-9A-Fa-f]{3,6}$/, // Hex colors
    /^rgb\([0-9,\s]+\)$/, // RGB
    /^rgba\([0-9.,\s]+\)$/, // RGBA
    /^hsl\([0-9.,\s%]+\)$/, // HSL
    /^hsla\([0-9.,\s%]+\)$/, // HSLA
    /^[a-z]+$/, // Named colors (red, blue, etc.)
  ]
  
  const trimmed = value.trim()
  
  // Check if it matches any safe color format
  const isSafeColor = colorFormats.some(regex => regex.test(trimmed))
  
  // Or if it matches general safe CSS pattern
  if (isSafeColor || safeCSSRegex.test(trimmed)) {
    // Remove any remaining dangerous characters
    return trimmed
      .replace(/[<>"']/g, '')
      .replace(/[\n\r]/g, '')
      .substring(0, 50) // Limit length
  }
  
  // If not safe, return empty string
  return ''
}

/**
 * Sanitize HTML content (basic - for simple cases)
 * For complex HTML, use DOMPurify library
 */
export function sanitizeHTML(html) {
  if (!html || typeof html !== 'string') return ''
  
  // Basic HTML escaping
  return html
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;')
}

/**
 * Sanitize ID for use in HTML/CSS
 * Only allows alphanumeric, hyphens, and underscores
 */
export function sanitizeID(id) {
  if (!id || typeof id !== 'string') return ''
  
  // Only allow safe characters for IDs
  return id
    .replace(/[^a-zA-Z0-9\-_]/g, '') // Remove anything that's not alphanumeric, hyphen, or underscore
    .substring(0, 50) // Limit length
}

/**
 * Verify if content is safe for dangerouslySetInnerHTML
 * Returns true if content appears safe (basic check)
 */
export function isSafeForInnerHTML(content) {
  if (!content || typeof content !== 'string') return false
  
  // Check for script tags
  if (/<script/i.test(content)) return false
  
  // Check for event handlers
  if (/on\w+\s*=/i.test(content)) return false
  
  // Check for javascript: protocol
  if (/javascript:/i.test(content)) return false
  
  // Check for data: URLs with scripts
  if (/data:text\/html/i.test(content)) return false
  
  return true
}
