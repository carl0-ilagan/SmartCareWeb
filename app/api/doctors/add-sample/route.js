import { NextResponse } from "next/server"
import { doc, setDoc, getDoc, Timestamp } from "firebase/firestore"
import { serverDb } from "@/lib/firebase-server"

export const runtime = "nodejs"

// Doctor data from promotional images
const doctorsData = [
  {
    // Dr. Miguel Marcos M. Soller - General Practitioner
    displayName: "Dr. Miguel Marcos M. Soller",
    firstName: "Miguel Marcos",
    middleName: "M.",
    lastName: "Soller",
    role: "doctor",
    specialty: "General Practitioner",
    email: "dr.soller@somoshospital.com",
    phone: "+639177094452",
    officeAddress: "Strong Republic Nautical Highway, Poblacion, Bansud, Oriental Mindoro",
    officeHours: "Monday, Tuesday, Wednesday, Thursday & Saturday: 9:00 AM - 12:00 NN",
    schedule: [
      { day: "Monday", startTime: "09:00", endTime: "12:00", available: true },
      { day: "Tuesday", startTime: "09:00", endTime: "12:00", available: true },
      { day: "Wednesday", startTime: "09:00", endTime: "12:00", available: true },
      { day: "Thursday", startTime: "09:00", endTime: "12:00", available: true },
      { day: "Saturday", startTime: "09:00", endTime: "12:00", available: true }
    ],
    status: "active",
    bio: "Experienced General Practitioner dedicated to providing comprehensive primary healthcare services.",
    experience: "10+ years",
    languages: ["English", "Tagalog"]
  },
  {
    // Dr. Joanne Fesalbon-See - IM-Pulmonology
    displayName: "Dr. Joanne Fesalbon-See",
    firstName: "Joanne",
    lastName: "Fesalbon-See",
    role: "doctor",
    specialty: "IM-Pulmonology",
    email: "dr.fesalbonsee@somoshospital.com",
    phone: "+639177094452",
    officeAddress: "Strong Republic Nautical Highway, Poblacion, Bansud, Oriental Mindoro",
    officeHours: "Saturday: 9:00 AM - 12:00 NN",
    schedule: [
      { day: "Saturday", startTime: "09:00", endTime: "12:00", available: true }
    ],
    status: "active",
    bio: "Specialist in Internal Medicine - Pulmonology, focusing on respiratory health and lung diseases.",
    experience: "8+ years",
    languages: ["English", "Tagalog"]
  },
  {
    // Dr. Mark Leo L. Geronimo - Orthopedic Surgery
    displayName: "Dr. Mark Leo L. Geronimo",
    firstName: "Mark Leo",
    middleName: "L.",
    lastName: "Geronimo",
    role: "doctor",
    specialty: "Orthopedic Surgery",
    email: "dr.geronimo@somoshospital.com",
    phone: "+639177094452",
    officeAddress: "Strong Republic Nautical Highway, Poblacion, Bansud, Oriental Mindoro",
    officeHours: "Saturday: 1:00 PM - 4:00 PM",
    schedule: [
      { day: "Saturday", startTime: "13:00", endTime: "16:00", available: true }
    ],
    status: "active",
    bio: "Orthopedic Surgeon specializing in bone, joint, and musculoskeletal system treatments.",
    experience: "12+ years",
    languages: ["English", "Tagalog"]
  }
]

// Function to generate ID from name
function generateId(name) {
  return name
    .toLowerCase()
    .replace(/dr\.?\s+/g, '')
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .substring(0, 50)
}

export async function POST(request) {
  try {
    const results = []
    const timestamp = new Date()

    for (const doctorData of doctorsData) {
      try {
        const doctorId = generateId(doctorData.displayName)
        const doctorRef = doc(serverDb, "users", doctorId)

        // Check if already exists
        const existing = await getDoc(doctorRef)

        if (existing.exists()) {
          results.push({
            success: true,
            doctor: doctorData.displayName,
            id: doctorId,
            action: "skipped",
            message: "Doctor already exists"
          })
          continue
        }

        // Add doctor data
        await setDoc(doctorRef, {
          ...doctorData,
          uid: doctorId,
          createdAt: Timestamp.fromDate(timestamp),
          updatedAt: Timestamp.fromDate(timestamp),
          lastLogin: null, // No login, so no lastLogin
          status: doctorData.status || "active"
        })

        results.push({
          success: true,
          doctor: doctorData.displayName,
          id: doctorId,
          specialty: doctorData.specialty,
          action: "created",
          message: "Doctor added successfully"
        })
      } catch (error) {
        console.error(`Error adding ${doctorData.displayName}:`, error)
        results.push({
          success: false,
          doctor: doctorData.displayName,
          error: error.message,
          message: "Failed to add doctor"
        })
      }
    }

    const successCount = results.filter(r => r.success && r.action === "created").length
    const skippedCount = results.filter(r => r.success && r.action === "skipped").length
    const errorCount = results.filter(r => !r.success).length

    return NextResponse.json({
      success: true,
      message: `Added ${successCount} doctors, ${skippedCount} already existed, ${errorCount} errors`,
      results,
      summary: {
        total: doctorsData.length,
        created: successCount,
        skipped: skippedCount,
        errors: errorCount
      }
    }, { status: 200 })

  } catch (error) {
    console.error("Error in add-sample-doctors API:", error)
    return NextResponse.json({
      success: false,
      message: "Failed to add doctors",
      error: error.message
    }, { status: 500 })
  }
}

// GET endpoint to check status
export async function GET(request) {
  try {
    const results = []

    for (const doctorData of doctorsData) {
      const doctorId = generateId(doctorData.displayName)
      const doctorRef = doc(serverDb, "users", doctorId)
      const existing = await getDoc(doctorRef)

      results.push({
        doctor: doctorData.displayName,
        id: doctorId,
        specialty: doctorData.specialty,
        exists: existing.exists()
      })
    }

    return NextResponse.json({
      success: true,
      message: "Doctor status check",
      results
    }, { status: 200 })

  } catch (error) {
    console.error("Error checking doctors:", error)
    return NextResponse.json({
      success: false,
      message: "Failed to check doctors",
      error: error.message
    }, { status: 500 })
  }
}
