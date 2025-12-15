import { NextResponse } from "next/server"

export async function GET(request) {
  // Get the IP address from the request headers
  const forwardedFor = request.headers.get("x-forwarded-for")
  const realIp = request.headers.get("x-real-ip")

  // Use the first IP from x-forwarded-for, or x-real-ip, or a fallback
  const ip = forwardedFor ? forwardedFor.split(",")[0].trim() : realIp ? realIp : "127.0.0.1"

  return NextResponse.json({ ip })
}
