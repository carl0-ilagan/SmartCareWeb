/**
 * Script to add doctor data to Firebase Firestore
 * These are data-only accounts (no login required)
 * 
 * Run this script using: node scripts/add-doctors-data.js
 * Make sure you have Firebase credentials configured
 */

import { initializeApp, cert } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'
import { readFileSync } from 'fs'
import { join } from 'path'

// Initialize Firebase Admin (you'll need to set up service account)
// For now, we'll use a client-side approach that can be run from browser console

// Doctor data from the images
const doctorsData = [
  {
    // Dr. Miguel Marcos M. Soller - General Practitioner
    displayName: "Dr. Miguel Marcos M. Soller",
    firstName: "Miguel Marcos",
    middleName: "M.",
    lastName: "Soller",
    role: "doctor",
    specialty: "General Practitioner",
    email: "dr.soller@somoshospital.com", // Generated email
    phone: "+639177094452",
    officeAddress: "Strong Republic Nautical Highway, Poblacion, Bansud, Oriental Mindoro",
    officeHours: "Monday, Tuesday, Wednesday, Thursday & Saturday: 9:00 AM - 12:00 NN",
    schedule: [
      {
        day: "Monday",
        startTime: "09:00",
        endTime: "12:00",
        available: true
      },
      {
        day: "Tuesday",
        startTime: "09:00",
        endTime: "12:00",
        available: true
      },
      {
        day: "Wednesday",
        startTime: "09:00",
        endTime: "12:00",
        available: true
      },
      {
        day: "Thursday",
        startTime: "09:00",
        endTime: "12:00",
        available: true
      },
      {
        day: "Saturday",
        startTime: "09:00",
        endTime: "12:00",
        available: true
      }
    ],
    status: "active",
    bio: "Experienced General Practitioner dedicated to providing comprehensive primary healthcare services.",
    experience: "10+ years",
    languages: ["English", "Tagalog"],
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    // Dr. Joanne Fesalbon-See - IM-Pulmonology
    displayName: "Dr. Joanne Fesalbon-See",
    firstName: "Joanne",
    lastName: "Fesalbon-See",
    role: "doctor",
    specialty: "IM-Pulmonology",
    email: "dr.fesalbonsee@somoshospital.com", // Generated email
    phone: "+639177094452",
    officeAddress: "Strong Republic Nautical Highway, Poblacion, Bansud, Oriental Mindoro",
    officeHours: "Saturday: 9:00 AM - 12:00 NN",
    schedule: [
      {
        day: "Saturday",
        startTime: "09:00",
        endTime: "12:00",
        available: true
      }
    ],
    status: "active",
    bio: "Specialist in Internal Medicine - Pulmonology, focusing on respiratory health and lung diseases.",
    experience: "8+ years",
    languages: ["English", "Tagalog"],
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    // Dr. Mark Leo L. Geronimo - Orthopedic Surgery
    displayName: "Dr. Mark Leo L. Geronimo",
    firstName: "Mark Leo",
    middleName: "L.",
    lastName: "Geronimo",
    role: "doctor",
    specialty: "Orthopedic Surgery",
    email: "dr.geronimo@somoshospital.com", // Generated email
    phone: "+639177094452",
    officeAddress: "Strong Republic Nautical Highway, Poblacion, Bansud, Oriental Mindoro",
    officeHours: "Saturday: 1:00 PM - 4:00 PM",
    schedule: [
      {
        day: "Saturday",
        startTime: "13:00",
        endTime: "16:00",
        available: true
      }
    ],
    status: "active",
    bio: "Orthopedic Surgeon specializing in bone, joint, and musculoskeletal system treatments.",
    experience: "12+ years",
    languages: ["English", "Tagalog"],
    createdAt: new Date(),
    updatedAt: new Date()
  }
]

// Function to generate a simple ID from name
function generateId(name) {
  return name
    .toLowerCase()
    .replace(/dr\.?\s+/g, '')
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .substring(0, 50)
}

// Export for use in browser console or Node.js
export const addDoctorsToFirebase = async () => {
  // This will be used in browser console with Firebase client SDK
  const { db } = await import('../lib/firebase.js')
  const { collection, doc, setDoc, serverTimestamp } = await import('firebase/firestore')
  
  const results = []
  
  for (const doctorData of doctorsData) {
    try {
      const doctorId = generateId(doctorData.displayName)
      const doctorRef = doc(db, "users", doctorId)
      
      const dataToSave = {
        ...doctorData,
        uid: doctorId,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        lastLogin: null, // No login, so no lastLogin
        status: doctorData.status || "active"
      }
      
      await setDoc(doctorRef, dataToSave)
      
      console.log(`✅ Added: ${doctorData.displayName} (${doctorData.specialty})`)
      results.push({ success: true, doctor: doctorData.displayName, id: doctorId })
    } catch (error) {
      console.error(`❌ Error adding ${doctorData.displayName}:`, error)
      results.push({ success: false, doctor: doctorData.displayName, error: error.message })
    }
  }
  
  return results
}

// For Node.js execution (if using Firebase Admin SDK)
if (typeof window === 'undefined') {
  console.log('This script is designed to run in browser console.')
  console.log('Copy the code below and run it in your browser console while logged into the app:')
  console.log('\n--- Copy below ---\n')
  console.log(`
// Run this in browser console
(async () => {
  const { db } = await import('/lib/firebase.js')
  const { collection, doc, setDoc, serverTimestamp } = await import('firebase/firestore')
  
  const doctorsData = ${JSON.stringify(doctorsData, null, 2)}
  
  function generateId(name) {
    return name.toLowerCase().replace(/dr\\.?\\s+/g, '').replace(/\\s+/g, '-').replace(/[^a-z0-9-]/g, '').substring(0, 50)
  }
  
  for (const doctorData of doctorsData) {
    try {
      const doctorId = generateId(doctorData.displayName)
      const doctorRef = doc(db, "users", doctorId)
      
      await setDoc(doctorRef, {
        ...doctorData,
        uid: doctorId,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        lastLogin: null,
        status: doctorData.status || "active"
      })
      
      console.log('✅ Added:', doctorData.displayName)
    } catch (error) {
      console.error('❌ Error:', doctorData.displayName, error)
    }
  }
  
  console.log('Done!')
})()
  `)
}
