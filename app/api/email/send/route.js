import nodemailer from "nodemailer"
export const runtime = "nodejs"

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

    const host = process.env.SMTP_HOST
    const port = Number(process.env.SMTP_PORT || 587)
    const user = process.env.SMTP_USER
    const pass = process.env.SMTP_PASS
    const defaultFromAddress = process.env.FROM_EMAIL || "Smart Care <no-reply@smartcare.app>"
    
    // Use provided 'from' address or default, and set reply-to if provided
    const fromAddress = from || defaultFromAddress

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

    const mailOptions = {
      from: fromAddress,
      to,
      subject,
      text,
      html,
    }

    // Set reply-to header if provided (for contact form - allows admin to reply directly to user)
    if (replyTo) {
      mailOptions.replyTo = replyTo
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


