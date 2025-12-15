import { NextResponse } from "next/server"

export const runtime = "nodejs"

/**
 * Gmail API Integration
 * 
 * To use this endpoint, you need to:
 * 1. Set up Google Cloud Project
 * 2. Enable Gmail API
 * 3. Create OAuth 2.0 credentials
 * 4. Set environment variables:
 *    - GMAIL_CLIENT_ID
 *    - GMAIL_CLIENT_SECRET
 *    - GMAIL_REFRESH_TOKEN
 *    - GMAIL_ADMIN_EMAIL (admin's Gmail address)
 */

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const maxResults = parseInt(searchParams.get("maxResults") || "50")
    const pageToken = searchParams.get("pageToken") || null

    // Check if Gmail API is configured
    const clientId = process.env.GMAIL_CLIENT_ID
    const clientSecret = process.env.GMAIL_CLIENT_SECRET
    const refreshToken = process.env.GMAIL_REFRESH_TOKEN
    const adminEmail = process.env.GMAIL_ADMIN_EMAIL || "smartcarefamily@gmail.com"

    if (!clientId || !clientSecret || !refreshToken) {
      return NextResponse.json(
        {
          success: false,
          message: "Gmail API not configured. Please set up Gmail API credentials in environment variables.",
          emails: [],
        },
        { status: 200 } // Return 200 so UI doesn't break
      )
    }

    // Get access token using refresh token
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: refreshToken,
        grant_type: "refresh_token",
      }),
    })

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.text()
      console.error("Gmail OAuth error:", errorData)
      return NextResponse.json(
        {
          success: false,
          message: "Failed to authenticate with Gmail API. Please check your credentials.",
          emails: [],
        },
        { status: 200 }
      )
    }

    const tokenData = await tokenResponse.json()
    const accessToken = tokenData.access_token

    // Fetch emails from Gmail API
    let gmailUrl = `https://gmail.googleapis.com/gmail/v1/users/${encodeURIComponent(adminEmail)}/messages?maxResults=${maxResults}`
    if (pageToken) {
      gmailUrl += `&pageToken=${pageToken}`
    }

    const messagesResponse = await fetch(gmailUrl, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })

    if (!messagesResponse.ok) {
      const errorData = await messagesResponse.text()
      console.error("Gmail API error:", errorData)
      return NextResponse.json(
        {
          success: false,
          message: "Failed to fetch emails from Gmail API.",
          emails: [],
        },
        { status: 200 }
      )
    }

    const messagesData = await messagesResponse.json()
    const messageIds = messagesData.messages || []

    // Fetch full message details for each email
    const emailPromises = messageIds.map(async (msg) => {
      try {
        const messageResponse = await fetch(
          `https://gmail.googleapis.com/gmail/v1/users/${encodeURIComponent(adminEmail)}/messages/${msg.id}`,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          }
        )

        if (!messageResponse.ok) {
          return null
        }

        const messageData = await messageResponse.json()

        // Parse email headers
        const headers = messageData.payload?.headers || []
        const getHeader = (name) => headers.find((h) => h.name.toLowerCase() === name.toLowerCase())?.value || ""

        // Parse email body
        let body = ""
        if (messageData.payload?.body?.data) {
          body = Buffer.from(messageData.payload.body.data, "base64").toString("utf-8")
        } else if (messageData.payload?.parts) {
          // Try to get text/plain or text/html
          const textPart = messageData.payload.parts.find((p) => p.mimeType === "text/plain")
          const htmlPart = messageData.payload.parts.find((p) => p.mimeType === "text/html")
          const part = textPart || htmlPart
          if (part?.body?.data) {
            body = Buffer.from(part.body.data, "base64").toString("utf-8")
          }
        }

        // Extract date
        const date = getHeader("date")
        const timestamp = date ? new Date(date).getTime() : messageData.internalDate || Date.now()

        return {
          id: msg.id,
          threadId: messageData.threadId,
          from: getHeader("from"),
          to: getHeader("to"),
          subject: getHeader("subject"),
          date: getHeader("date"),
          timestamp: timestamp,
          snippet: messageData.snippet || "",
          body: body,
          read: messageData.labelIds?.includes("UNREAD") === false,
          starred: messageData.labelIds?.includes("STARRED") === true,
          labels: messageData.labelIds || [],
        }
      } catch (error) {
        console.error(`Error fetching message ${msg.id}:`, error)
        return null
      }
    })

    const emails = (await Promise.all(emailPromises)).filter(Boolean)

    return NextResponse.json({
      success: true,
      emails: emails,
      nextPageToken: messagesData.nextPageToken || null,
      resultSizeEstimate: messagesData.resultSizeEstimate || emails.length,
    })
  } catch (error) {
    console.error("Gmail fetch error:", error)
    return NextResponse.json(
      {
        success: false,
        message: error.message || "Failed to fetch emails from Gmail",
        emails: [],
      },
      { status: 200 }
    )
  }
}

