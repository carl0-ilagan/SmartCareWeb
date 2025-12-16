import { NextResponse } from "next/server"
import { doc, getDoc } from "firebase/firestore"
import { serverDb } from "@/lib/firebase-server"

export const runtime = "nodejs"

export async function GET() {
  try {
    // Try to get the maintenance settings document
    const settingsDoc = await getDoc(doc(serverDb, "settings", "maintenance"))
    
    if (settingsDoc.exists()) {
      const data = settingsDoc.data()
      return NextResponse.json({
        success: true,
        enabled: data.enabled || false,
        updatedAt: data.updatedAt?.toDate?.()?.toISOString() || null,
        updatedBy: data.updatedBy || null,
        updatedByName: data.updatedByName || null,
      })
    }
    
    // If document doesn't exist, maintenance is disabled
    return NextResponse.json({
      success: true,
      enabled: false,
      updatedAt: null,
      updatedBy: null,
      updatedByName: null,
    })
  } catch (error) {
    // Log the error for debugging
    console.error("Error checking maintenance status:", error)
    
    // On permission errors or any other errors, default to disabled
    // This ensures users aren't blocked if there's a configuration issue
    return NextResponse.json(
      {
        success: true, // Return success: true so the client doesn't treat it as an error
        enabled: false, // Default to false on error so users aren't blocked
        error: process.env.NODE_ENV === "development" ? error.message : undefined,
      },
      { status: 200 } // Return 200 instead of 500 so client treats it as success
    )
  }
}
