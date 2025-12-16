import nodemailer from "nodemailer"
export const runtime = "nodejs"

// Validate email format to prevent injection
function isValidEmail(email) {
  if (!email || typeof email !== 'string') return false
  // Basic email validation - prevent header injection
  const emailRegex = /^[^\s@<>\"\n\r]+@[^\s@<>\"\n\r]+\.[^\s@<>\"\n\r]+$/
  // Check for header injection attempts
  if (email.includes('\n') || email.includes('\r') || email.includes('<') || email.includes('>')) {
    return false
  }
  return emailRegex.test(email.trim())
}

// Sanitize email address
function sanitizeEmail(email) {
  if (!email || typeof email !== 'string') return null
  // Remove newlines, carriage returns, and angle brackets to prevent header injection
  return email.replace(/[\n\r<>]/g, '').trim()
}

export async function POST(request) {
  try {
    const body = await request.json()
    const { to, subject, text, html, from, replyTo } = body || {}

    if (!to || !subject || (!text && !html)) {
      return new Response(
        JSON.stringify({ success: false, message: "Missing 'to', 'subject', or content ('text' or 'html')." }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      )
    }

    // Validate and sanitize email addresses to prevent injection
    if (!isValidEmail(to)) {
      return new Response(
        JSON.stringify({ success: false, message: "Invalid recipient email address." }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      )
    }

    // Sanitize from and replyTo if provided
    const sanitizedFrom = from ? sanitizeEmail(from) : null
    const sanitizedReplyTo = replyTo ? sanitizeEmail(replyTo) : null
    
    // Validate replyTo if provided
    if (sanitizedReplyTo && !isValidEmail(sanitizedReplyTo)) {
      return new Response(
        JSON.stringify({ success: false, message: "Invalid reply-to email address." }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      )
    }

    const host = process.env.SMTP_HOST
    const port = Number(process.env.SMTP_PORT || 587)
    const user = process.env.SMTP_USER
    const pass = process.env.SMTP_PASS
    const defaultFromAddress = process.env.FROM_EMAIL || "Smart Care <no-reply@smartcare.app>"
    
    // Use sanitized 'from' address or default, and set reply-to if provided
    // Only use provided 'from' if it's a valid email format (prevent injection)
    const fromAddress = (sanitizedFrom && isValidEmail(sanitizedFrom.split('<')[1]?.split('>')[0] || sanitizedFrom)) 
      ? sanitizedFrom 
      : defaultFromAddress

    if (!host || !user || !pass) {
      // Fallback: log only, but respond OK so app flow doesn't break in dev
      console.log("[EMAIL DEV LOG] SMTP not configured. Logging email instead of sending.")
      console.log({ to, from: fromAddress, replyTo, subject, text: text || null, html: !!html })
      return new Response(JSON.stringify({ success: true, message: "Email logged (SMTP missing)." }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      })
    }

    const secure = port === 465
    const transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: { user, pass },
    })

    // Sanitize subject to prevent header injection
    const sanitizedSubject = subject ? subject.replace(/[\n\r]/g, '').trim().substring(0, 200) : subject
    
    const mailOptions = {
      from: fromAddress,
      to,
      subject: sanitizedSubject,
      text: text ? text.substring(0, 10000) : text, // Limit text length
      html: html ? html.substring(0, 50000) : html, // Limit HTML length
    }

    // Set reply-to header if provided and valid (for contact form - allows admin to reply directly to user)
    if (sanitizedReplyTo && isValidEmail(sanitizedReplyTo)) {
      mailOptions.replyTo = sanitizedReplyTo
    }

    const info = await transporter.sendMail(mailOptions)

    return new Response(JSON.stringify({ success: true, id: info.messageId || null }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    })
  } catch (error) {
    console.error("/api/email/send error:", error)
    return new Response(JSON.stringify({ success: false, message: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    })
  }
}


