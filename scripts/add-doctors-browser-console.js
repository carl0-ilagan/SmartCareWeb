/**
 * COPY THIS CODE AND RUN IT IN YOUR BROWSER CONSOLE
 * (While logged into the SmartCare app as admin)
 * 
 * This will add 3 doctors to Firebase Firestore
 */

(async () => {
  // Import Firebase functions
  const { db } = await import('/lib/firebase.js')
  const { doc, setDoc, serverTimestamp } = await import('firebase/firestore')
  
  // Doctor data from the promotional images
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
  
  console.log('🚀 Starting to add doctors to Firebase...\n')
  
  const results = []
  
  for (const doctorData of doctorsData) {
    try {
      const doctorId = generateId(doctorData.displayName)
      const doctorRef = doc(db, "users", doctorId)
      
      // Check if already exists
      const { getDoc } = await import('firebase/firestore')
      const existing = await getDoc(doctorRef)
      
      if (existing.exists()) {
        console.log(`⚠️  Already exists: ${doctorData.displayName} (ID: ${doctorId})`)
        results.push({ success: true, doctor: doctorData.displayName, id: doctorId, action: 'skipped' })
        continue
      }
      
      // Add doctor data
      await setDoc(doctorRef, {
        ...doctorData,
        uid: doctorId,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        lastLogin: null, // No login, so no lastLogin
        status: doctorData.status || "active"
      })
      
      console.log(`✅ Added: ${doctorData.displayName} (${doctorData.specialty}) - ID: ${doctorId}`)
      results.push({ success: true, doctor: doctorData.displayName, id: doctorId, action: 'created' })
    } catch (error) {
      console.error(`❌ Error adding ${doctorData.displayName}:`, error)
      results.push({ success: false, doctor: doctorData.displayName, error: error.message })
    }
  }
  
  console.log('\n📊 Summary:')
  console.log(`✅ Successfully added: ${results.filter(r => r.success && r.action === 'created').length}`)
  console.log(`⚠️  Already existed: ${results.filter(r => r.success && r.action === 'skipped').length}`)
  console.log(`❌ Errors: ${results.filter(r => !r.success).length}`)
  console.log('\n✨ Done! Doctors are now in Firebase.')
  
  return results
})()
