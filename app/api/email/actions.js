"use server"

// Server-side email functionality
// This file contains server actions for sending emails

const FROM_EMAIL = "admin@smartcare.com"
const APP_NAME = "Smart Care"

// Helper function to log email details
function logEmailDetails(emailData) {
  console.log("========== EMAIL DETAILS (SERVER) ==========")
  console.log(`To: ${emailData.to}`)
  console.log(`From: ${emailData.from}`)
  console.log(`Subject: ${emailData.subject}`)
  console.log(`Text content: ${emailData.text}`)
  console.log(`HTML content: ${emailData.html ? "HTML email content included" : "No HTML content"}`)
  console.log("============================================")
}

export async function sendApprovalEmail(userEmail, userName, userRole) {
  try {
    console.log(`[SERVER ACTION] Sending approval email to ${userEmail}`)

    // Create the email content
    const emailData = {
      to: userEmail,
      from: FROM_EMAIL,
      subject: `${APP_NAME} - Your Account Has Been Approved`,
      text: `Hello ${userName},\n\nYour ${userRole} account for ${APP_NAME} has been approved. You can now log in and access all features.\n\nThank you,\n${APP_NAME} Team`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #4a5568;">Your Account Has Been Approved</h2>
          <p>Hello ${userName},</p>
          <p>Your ${userRole} account for ${APP_NAME} has been approved. You can now log in and access all features.</p>
          <div style="margin: 30px 0;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL || "https://smartcare.app"}/login" 
               style="background-color: #e6a45a; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px;">
              Log In Now
            </a>
          </div>
          <p>Thank you,<br>${APP_NAME} Team</p>
        </div>
      `,
    }

    // Try to actually send via SMTP API route
    const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || ""}/api/email/send`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ to: emailData.to, subject: emailData.subject, text: emailData.text, html: emailData.html }),
    })

    if (!res.ok) {
      // Fallback: log details if API route is unavailable
      logEmailDetails(emailData)
      console.warn("/api/email/send failed, logged instead.")
      return { success: false, message: "Failed to send via API route; logged instead." }
    }

    const data = await res.json()
    return { success: true, message: `Approval email sent to ${userEmail}`, id: data?.id || null }
  } catch (error) {
    console.error("Error sending approval email:", error)
    return {
      success: false,
      message: error.message,
    }
  }
}

export async function sendRejectionEmail(userEmail, userName, userRole, reason = "") {
  try {
    console.log(`[SERVER ACTION] Sending rejection email to ${userEmail}`)

    // Create the email content
    const emailData = {
      to: userEmail,
      from: FROM_EMAIL,
      subject: `${APP_NAME} - Account Request Status`,
      text: `Hello ${userName},\n\nWe regret to inform you that your ${userRole} account request for ${APP_NAME} has been rejected.\n\n${reason ? `Reason: ${reason}\n\n` : ""}If you believe this is an error or have questions, please contact our support team.\n\nThank you,\n${APP_NAME} Team`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #4a5568;">Account Request Status</h2>
          <p>Hello ${userName},</p>
          <p>We regret to inform you that your ${userRole} account request for ${APP_NAME} has been rejected.</p>
          ${reason ? `<p><strong>Reason:</strong> ${reason}</p>` : ""}
          <p>If you believe this is an error or have questions, please contact our support team.</p>
          <p>Thank you,<br>${APP_NAME} Team</p>
        </div>
      `,
    }

    // Try to actually send via SMTP API route
    const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || ""}/api/email/send`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ to: emailData.to, subject: emailData.subject, text: emailData.text, html: emailData.html }),
    })

    if (!res.ok) {
      logEmailDetails(emailData)
      console.warn("/api/email/send failed, logged instead.")
      return { success: false, message: "Failed to send via API route; logged instead." }
    }

    const data = await res.json()
    return { success: true, message: `Rejection email sent to ${userEmail}`, id: data?.id || null }
  } catch (error) {
    console.error("Error sending rejection email:", error)
    return {
      success: false,
      message: error.message,
    }
  }
}

export async function sendNotificationEmail(userEmail, subject, message) {
  try {
    console.log(`[SERVER ACTION] Sending notification email to ${userEmail}`)

    // Create the email content
    const emailData = {
      to: userEmail,
      from: FROM_EMAIL,
      subject: `${APP_NAME} - ${subject}`,
      text: `${message}\n\nThank you,\n${APP_NAME} Team`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #4a5568;">${subject}</h2>
          <p>${message}</p>
          <p>Thank you,<br>${APP_NAME} Team</p>
        </div>
      `,
    }

    const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || ""}/api/email/send`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ to: emailData.to, subject: emailData.subject, text: emailData.text, html: emailData.html }),
    })

    if (!res.ok) {
      logEmailDetails(emailData)
      console.warn("/api/email/send failed, logged instead.")
      return { success: false, message: "Failed to send via API route; logged instead." }
    }

    const data = await res.json()
    return { success: true, message: `Notification email sent to ${userEmail}`, id: data?.id || null }
  } catch (error) {
    console.error("Error sending notification email:", error)
    return {
      success: false,
      message: error.message,
    }
  }
}
