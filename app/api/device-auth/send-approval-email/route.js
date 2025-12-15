import { NextResponse } from "next/server"

export const runtime = "nodejs"

export async function POST(request) {
  try {
    const body = await request.json()
    const { userId, email, deviceId, requestId, deviceMetadata, ipAddress } = body

    if (!userId || !email || !deviceId || !requestId) {
      return NextResponse.json(
        { success: false, message: "Missing required fields" },
        { status: 400 }
      )
    }

    // Get app URL from environment or use default
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.VERCEL_URL 
      ? `https://${process.env.VERCEL_URL}` 
      : "http://localhost:3000"

    // Create approval and deny links
    const approvalLink = `${appUrl}/api/device-auth/approve-login?uid=${encodeURIComponent(userId)}&deviceId=${encodeURIComponent(deviceId)}&requestId=${encodeURIComponent(requestId)}`
    const denyLink = `${appUrl}/api/device-auth/deny-login?requestId=${encodeURIComponent(requestId)}`

    // Format device information
    const deviceInfo = deviceMetadata || {}
    const browser = deviceInfo.browser || "Unknown"
    const os = deviceInfo.os || "Unknown"
    const location = ipAddress || "Unknown"

    // Create email content
    const subject = "New Login Attempt Detected - Smart Care"
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>New Login Attempt</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0;">🔐 New Login Attempt</h1>
          </div>
          
          <div style="background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px;">
            <p style="font-size: 16px; margin-bottom: 20px;">
              Hello,
            </p>
            
            <p style="font-size: 16px; margin-bottom: 20px;">
              We detected a new login attempt to your Smart Care account from a device we don't recognize.
            </p>
            
            <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b;">
              <h3 style="margin-top: 0; color: #1f2937;">Device Information:</h3>
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px 0; font-weight: bold; color: #6b7280;">Browser:</td>
                  <td style="padding: 8px 0; color: #1f2937;">${browser}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; font-weight: bold; color: #6b7280;">Operating System:</td>
                  <td style="padding: 8px 0; color: #1f2937;">${os}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; font-weight: bold; color: #6b7280;">Location (IP):</td>
                  <td style="padding: 8px 0; color: #1f2937;">${location}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; font-weight: bold; color: #6b7280;">Time:</td>
                  <td style="padding: 8px 0; color: #1f2937;">${new Date().toLocaleString()}</td>
                </tr>
              </table>
            </div>
            
            <p style="font-size: 16px; margin-bottom: 30px;">
              If this was you, please approve this login attempt. If not, please deny it immediately.
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${approvalLink}" 
                 style="display: inline-block; background: #10b981; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; margin-right: 10px; margin-bottom: 10px;">
                ✅ Approve Login
              </a>
              <a href="${denyLink}" 
                 style="display: inline-block; background: #ef4444; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; margin-bottom: 10px;">
                ❌ Deny Login
              </a>
            </div>
            
            <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 4px;">
              <p style="margin: 0; font-size: 14px; color: #92400e;">
                <strong>⚠️ Security Notice:</strong> This approval link will expire in 10 minutes. If you didn't attempt to log in, please deny this request immediately.
              </p>
            </div>
            
            <p style="font-size: 14px; color: #6b7280; margin-top: 30px; border-top: 1px solid #e5e7eb; padding-top: 20px;">
              If you have any concerns about your account security, please contact our support team immediately.
            </p>
            
            <p style="font-size: 14px; color: #6b7280; margin-top: 10px;">
              Best regards,<br>
              <strong>Smart Care Security Team</strong>
            </p>
          </div>
        </body>
      </html>
    `

    const text = `
New Login Attempt Detected - Smart Care

Hello,

We detected a new login attempt to your Smart Care account from a device we don't recognize.

Device Information:
- Browser: ${browser}
- Operating System: ${os}
- Location (IP): ${location}
- Time: ${new Date().toLocaleString()}

If this was you, please approve this login attempt by clicking the link below:
${approvalLink}

If this was NOT you, please deny it immediately:
${denyLink}

This approval link will expire in 10 minutes.

Best regards,
Smart Care Security Team
    `

    // Send email using existing email API
    const emailResponse = await fetch(`${appUrl}/api/email/send`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        to: email,
        subject: subject,
        text: text,
        html: html,
      }),
    })

    if (!emailResponse.ok) {
      const errorData = await emailResponse.json().catch(() => ({}))
      throw new Error(errorData.message || "Failed to send email")
    }

    return NextResponse.json({
      success: true,
      message: "Approval email sent successfully",
    })
  } catch (error) {
    console.error("Error sending approval email:", error)
    return NextResponse.json(
      {
        success: false,
        message: error.message || "Failed to send approval email",
      },
      { status: 500 }
    )
  }
}

