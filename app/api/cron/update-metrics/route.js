import { NextResponse } from "next/server"

// This route is meant to be called by a cron job to update metrics regularly
export async function GET(request) {
  try {
    // Call the metrics API to collect and store current metrics
    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/system-metrics`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    })

    const data = await response.json()

    return NextResponse.json({
      success: true,
      message: "Metrics updated successfully",
      data,
    })
  } catch (error) {
    console.error("Error in cron job:", error)
    return NextResponse.json(
      {
        success: false,
        error: error.message,
      },
      { status: 500 },
    )
  }
}
