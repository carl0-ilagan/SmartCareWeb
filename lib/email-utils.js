// lib/email-utils.js
// Client-side email helpers that call the SMTP API route

/**
 * Retrieves email history from local storage.
 * @returns {Array} An array of email objects.
 */
export const getEmailHistory = () => {
  try {
    const storedEmails = localStorage.getItem("emailHistory")
    return storedEmails ? JSON.parse(storedEmails) : []
  } catch (error) {
    console.error("Error retrieving email history from localStorage:", error)
    return []
  }
}

/**
 * Stores email details in local storage.
 * @param {Object} emailData - The email object to store.
 */
export const storeEmailDetails = (emailData) => {
  try {
    const emailHistory = getEmailHistory()
    const updatedHistory = [...emailHistory, { ...emailData, timestamp: new Date().toISOString() }]
    localStorage.setItem("emailHistory", JSON.stringify(updatedHistory))
  } catch (error) {
    console.error("Error storing email details in localStorage:", error)
  }
}

export async function sendApprovalEmail(userEmail, userName, userRole) {
  try {
    const subject = "SmartCare Account Approved ✅"
    const text = `Hi ${userName || "User"},\n\nYour SmartCare ${userRole || "user"} account has been approved!\n\n— SmartCare`
    const html = `<p>Hi ${userName || "User"},</p><p>Your SmartCare ${userRole || "user"} account has been approved!</p><p>— SmartCare</p>`

    const res = await fetch("/api/email/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ to: userEmail, subject, text, html }),
    })
    if (!res.ok) throw new Error(await res.text())
    return await res.json()
  } catch (error) {
    console.error("sendApprovalEmail error:", error)
    return { success: false, message: error.message }
  }
}

export async function sendRejectionEmail(userEmail, userName, userRole, reason = "") {
  try {
    const subject = "SmartCare Account Rejected ❌"
    const text = `Hi ${userName || "User"},\n\nWe regret to inform you that your ${userRole || "user"} account was rejected.${reason ? `\n\nReason: ${reason}` : ""}\n\n— SmartCare`
    const html = `<p>Hi ${userName || "User"},</p><p>We regret to inform you that your ${userRole || "user"} account was rejected.</p>${reason ? `<p><strong>Reason:</strong> ${reason}</p>` : ""}<p>— SmartCare</p>`

    const res = await fetch("/api/email/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ to: userEmail, subject, text, html }),
    })
    if (!res.ok) throw new Error(await res.text())
    return await res.json()
  } catch (error) {
    console.error("sendRejectionEmail error:", error)
    return { success: false, message: error.message }
  }
}

export async function sendNotificationEmail(userEmail, subject, message) {
  try {
    const text = `${message}\n\n— SmartCare`
    const html = `<p>${message}</p><p>— SmartCare</p>`

    const res = await fetch("/api/email/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ to: userEmail, subject, text, html }),
    })
    if (!res.ok) throw new Error(await res.text())
    return await res.json()
  } catch (error) {
    console.error("sendNotificationEmail error:", error)
    return { success: false, message: error.message }
  }
}
