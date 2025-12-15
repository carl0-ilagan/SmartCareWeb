import { NextResponse } from "next/server"
import { approveLoginRequestServer } from "@/lib/device-auth-server"

export const runtime = "nodejs"

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const uid = searchParams.get("uid")
    const deviceId = searchParams.get("deviceId")
    const requestId = searchParams.get("requestId")

    if (!uid || !deviceId || !requestId) {
      const html = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Approval Failed - Smart Care</title>
          </head>
          <body style="font-family: Arial, sans-serif; display: flex; justify-content: center; align-items: center; min-height: 100vh; margin: 0; background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);">
            <div style="background: white; padding: 40px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); text-align: center; max-width: 500px;">
              <div style="font-size: 48px; margin-bottom: 20px;">❌</div>
              <h1 style="color: #ef4444; margin: 0 0 10px 0;">Approval Failed</h1>
              <p style="color: #6b7280; margin: 0;">Missing required parameters. Please try again.</p>
            </div>
          </body>
        </html>
      `
      return new NextResponse(html, {
        headers: { "Content-Type": "text/html" },
      })
    }

    // Approve the login request
    const result = await approveLoginRequestServer(requestId)

    if (!result.success) {
      const html = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Approval Failed - Smart Care</title>
          </head>
          <body style="font-family: Arial, sans-serif; display: flex; justify-content: center; align-items: center; min-height: 100vh; margin: 0; background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);">
            <div style="background: white; padding: 40px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); text-align: center; max-width: 500px;">
              <div style="font-size: 48px; margin-bottom: 20px;">❌</div>
              <h1 style="color: #ef4444; margin: 0 0 10px 0;">Approval Failed</h1>
              <p style="color: #6b7280; margin: 0;">${result.error || "Unable to approve login request."}</p>
            </div>
          </body>
        </html>
      `
      return new NextResponse(html, {
        headers: { "Content-Type": "text/html" },
      })
    }

    // Get app URL for optional redirect
    const requestUrl = new URL(request.url)
    const baseUrl = requestUrl.origin
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || baseUrl || "http://localhost:3000"

    // Return success page directly
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Login Approved - Smart Care</title>
        </head>
        <body style="font-family: Arial, sans-serif; display: flex; justify-content: center; align-items: center; min-height: 100vh; margin: 0; background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%);">
          <div style="background: white; padding: 50px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); text-align: center; max-width: 500px;">
            <div style="font-size: 64px; margin-bottom: 20px;">✅</div>
            <h1 style="color: #10b981; margin: 0 0 10px 0; font-size: 28px;">Login Approved!</h1>
            <p style="color: #6b7280; margin: 0 0 30px 0; font-size: 16px;">The device has been approved and can now access your Smart Care account.</p>
            <p style="color: #9ca3af; font-size: 14px; margin: 0;">You can close this page. The user can now proceed with login.</p>
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
              <a href="${appUrl}/login" style="display: inline-block; background: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; margin-top: 10px;">Go to Login</a>
            </div>
          </div>
        </body>
      </html>
    `

    return new NextResponse(html, {
      headers: { "Content-Type": "text/html" },
    })
  } catch (error) {
    console.error("Error approving login:", error)
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Approval Failed - Smart Care</title>
        </head>
        <body style="font-family: Arial, sans-serif; display: flex; justify-content: center; align-items: center; min-height: 100vh; margin: 0; background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);">
          <div style="background: white; padding: 40px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); text-align: center; max-width: 500px;">
            <div style="font-size: 48px; margin-bottom: 20px;">❌</div>
            <h1 style="color: #ef4444; margin: 0 0 10px 0;">Approval Failed</h1>
            <p style="color: #6b7280; margin: 0;">An error occurred while processing your approval. Please try again.</p>
          </div>
        </body>
      </html>
    `
    return new NextResponse(html, {
      headers: { "Content-Type": "text/html" },
    })
  }
}

