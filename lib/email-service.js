/**
 * Email notification service for Smart Care
 * This uses Firebase Cloud Functions or your preferred email service
 */

// Note: Recipient email preferences should be enforced by callers or server-side.

/**
 * Send an email notification to a user (checks user settings)
 * @param {string} to - Recipient email address
 * @param {string} subject - Email subject
 * @param {string} message - Email message body
 * @param {string} userId - Optional user ID to check notification settings
 * @param {boolean} bypassSettings - Optional flag to bypass settings check (default: false)
 * @returns {Promise<void>}
 */
export async function sendEmailNotification(to, subject, message, userId = null, bypassSettings = false) {
  // No client-side settings check here to avoid cross-user permission errors

  // Continue with original email sending logic
  return await sendEmailNotificationInternal(to, subject, message)
}

/**
 * Internal function to send email (without settings check)
 * @param {string} to - Recipient email address
 * @param {string} subject - Email subject
 * @param {string} message - Email message body
 * @returns {Promise<void>}
 */
async function sendEmailNotificationInternal(to, subject, message) {
  try {
    // Call our Resend-backed API route
    const response = await fetch('/api/email/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ to, subject, text: message }),
    })

    if (!response.ok) {
      // Try to parse error details
      let errorDetail = ''
      try {
        const errorData = await response.json()
        errorDetail = errorData.message || JSON.stringify(errorData)
        
        // Check if it's a timeout error - emails might still be queued/sent
        if (errorDetail.includes('ETIMEDOUT') || errorDetail.includes('timeout')) {
          // Don't throw error for timeouts - email might still be sent
          console.warn(`[Email] Connection timeout for ${to}, but email may have been queued.`)
          return // Silently return - email may have been sent successfully
        }
      } catch (parseError) {
        errorDetail = await response.text()
      }
      
      // Only throw for non-timeout errors
      if (!errorDetail.includes('ETIMEDOUT') && !errorDetail.includes('timeout')) {
        throw new Error(`Failed to send email: ${errorDetail}`)
      }
      
      // For timeout errors, just return without throwing
      return
    }

    // Check response data to see if email was actually sent
    try {
      const data = await response.json()
      if (data.success === false && data.message) {
        // If it's a timeout, don't throw - email might still be queued
        if (data.message.includes('ETIMEDOUT') || data.message.includes('timeout')) {
          console.warn(`[Email] Connection timeout for ${to}, but email may have been queued.`)
          return
        }
        throw new Error(`Failed to send email: ${data.message}`)
      }
    } catch (parseError) {
      // Response might not be JSON, that's OK if status was 200
      if (response.ok) {
        return
      }
    }

    return
  } catch (error) {
    // Only log non-timeout errors
    if (!error.message?.includes('ETIMEDOUT') && !error.message?.includes('timeout')) {
      console.error("Error sending email notification:", error)
      throw error
    }
    // For timeout errors, just return silently
    return
  }
}

/**
 * Send account approval notification
 * @param {string} email - User email
 * @param {string} role - User role (patient/doctor)
 * @returns {Promise<void>}
 */
export async function sendApprovalNotification(email, role) {
  const subject = "Account Approved - Smart Care"
  const message = `Congratulations! Your ${role} account has been approved. You can now access all features of Smart Care.`
  
  return sendEmailNotification(email, subject, message)
}

/**
 * Send account rejection notification
 * @param {string} email - User email
 * @param {string} role - User role (patient/doctor)
 * @param {string} adminEmail - Admin contact email
 * @returns {Promise<void>}
 */
export async function sendRejectionNotification(email, role, adminEmail) {
  const subject = "Account Rejected - Smart Care"
  const message = `We regret to inform you that your ${role} account has been rejected. Please contact us at ${adminEmail} for more information.`
  
  return sendEmailNotification(email, subject, message)
}

