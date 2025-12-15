import { NextResponse } from "next/server"

export const runtime = "nodejs"

/**
 * Gmail OAuth Authorization Endpoint
 * This initiates the OAuth flow
 */
export async function GET(request) {
  try {
    const clientId = process.env.GMAIL_CLIENT_ID
    const { searchParams } = new URL(request.url)
    const redirectUri = searchParams.get("redirect_uri") || `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/gmail/callback`

    if (!clientId) {
      return NextResponse.json(
        { success: false, message: "Gmail Client ID not configured" },
        { status: 400 }
      )
    }

    // Build Google OAuth URL
    const authUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth")
    authUrl.searchParams.set("client_id", clientId)
    authUrl.searchParams.set("redirect_uri", redirectUri)
    authUrl.searchParams.set("response_type", "code")
    authUrl.searchParams.set("scope", "https://www.googleapis.com/auth/gmail.readonly")
    authUrl.searchParams.set("access_type", "offline")
    authUrl.searchParams.set("prompt", "consent")

    // Redirect to Google OAuth
    return NextResponse.redirect(authUrl.toString())
  } catch (error) {
    console.error("Gmail OAuth error:", error)
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    )
  }
}

