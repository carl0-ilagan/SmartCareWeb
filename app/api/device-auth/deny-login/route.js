import { NextResponse } from "next/server"
import { denyLoginRequestServer } from "@/lib/device-auth-server"

export const runtime = "nodejs"

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const requestId = searchParams.get("requestId")

    if (!requestId) {
      const html = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Denial Failed - Smart Care</title>
          </head>
          <body style="font-family: Arial, sans-serif; display: flex; justify-content: center; align-items: center; min-height: 100vh; margin: 0; background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%);">
            <div style="background: white; padding: 40px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); text-align: center; max-width: 500px;">
              <div style="font-size: 48px; margin-bottom: 20px;">❌</div>
              <h1 style="color: #ef4444; margin: 0 0 10px 0;">Denial Failed</h1>
              <p style="color: #6b7280; margin: 0;">Missing required parameters. Please try again.</p>
            </div>
          </body>
        </html>
      `
      return new NextResponse(html, {
        headers: { "Content-Type": "text/html" },
      })
    }

    // Deny the login request
    const result = await denyLoginRequestServer(requestId)

    if (!result.success) {
      const html = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Denial Failed - Smart Care</title>
          </head>
          <body style="font-family: Arial, sans-serif; display: flex; justify-content: center; align-items: center; min-height: 100vh; margin: 0; background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%);">
            <div style="background: white; padding: 40px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); text-align: center; max-width: 500px;">
              <div style="font-size: 48px; margin-bottom: 20px;">❌</div>
              <h1 style="color: #ef4444; margin: 0 0 10px 0;">Denial Failed</h1>
              <p style="color: #6b7280; margin: 0;">${result.error || "Unable to deny login request."}</p>
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
          <title>Login Denied - Smart Care</title>
        </head>
        <body style="font-family: Arial, sans-serif; display: flex; justify-content: center; align-items: center; min-height: 100vh; margin: 0; background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%);">
          <div style="background: white; padding: 50px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); text-align: center; max-width: 500px;">
            <div style="font-size: 64px; margin-bottom: 20px;">🚫</div>
            <h1 style="color: #ef4444; margin: 0 0 10px 0; font-size: 28px;">Login Denied</h1>
            <p style="color: #6b7280; margin: 0 0 30px 0; font-size: 16px;">The login attempt has been denied and the session has been revoked.</p>
            <p style="color: #9ca3af; font-size: 14px; margin: 0;">You can close this page. The unauthorized login has been blocked.</p>
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
              <p style="color: #6b7280; font-size: 14px; margin: 0 0 10px 0;">If this was you, please contact support.</p>
              <a href="${appUrl}/login" style="display: inline-block; background: #ef4444; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; margin-top: 10px;">Go to Login</a>
            </div>
          </div>
        </body>
      </html>
    `

    return new NextResponse(html, {
      headers: { "Content-Type": "text/html" },
    })
  } catch (error) {
    console.error("Error denying login:", error)
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Denial Failed - Smart Care</title>
        </head>
        <body style="font-family: Arial, sans-serif; display: flex; justify-content: center; align-items: center; min-height: 100vh; margin: 0; background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%);">
          <div style="background: white; padding: 40px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); text-align: center; max-width: 500px;">
            <div style="font-size: 48px; margin-bottom: 20px;">❌</div>
            <h1 style="color: #ef4444; margin: 0 0 10px 0;">Denial Failed</h1>
            <p style="color: #6b7280; margin: 0;">An error occurred while processing your denial. Please try again.</p>
          </div>
        </body>
      </html>
    `
    return new NextResponse(html, {
      headers: { "Content-Type": "text/html" },
    })
  }
}

