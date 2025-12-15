import { db } from "@/lib/firebase"
import { collection, query, where, getDocs, limit, startAfter } from "firebase/firestore"

// Update the searchDoctors function to properly handle partial matches
export async function searchDoctors(searchTerm = "", filters = {}, lastDoc = null, resultsLimit = 10) {
  try {
    console.log("Searching for doctors with term:", searchTerm)

    // Base query - get all doctors
    let doctorsQuery = query(collection(db, "users"), where("role", "==", "doctor"))

    // Apply pagination if needed
    if (lastDoc) {
      doctorsQuery = query(doctorsQuery, startAfter(lastDoc), limit(resultsLimit))
    } else {
      doctorsQuery = query(doctorsQuery, limit(resultsLimit))
    }

    // Execute the query
    console.log("Executing Firestore query for doctors")
    const doctorsSnapshot = await getDocs(doctorsQuery)
    console.log(`Found ${doctorsSnapshot.size} doctors in Firestore`)

    if (doctorsSnapshot.empty) {
      console.log("No doctors found in Firestore")
      return { doctors: [], lastDoc: null, hasMore: false }
    }

    // Set the last document for pagination
    const newLastDoc = doctorsSnapshot.docs[doctorsSnapshot.docs.length - 1]

    // Process results and apply client-side filtering
    const doctorsData = []
    const searchTermLower = searchTerm.toLowerCase()

    doctorsSnapshot.forEach((doc) => {
      const data = doc.data()

      // Extract all searchable fields
      const displayName = data.displayName || `Dr. ${data.lastName || "Unknown"}`
      const firstName = data.firstName || ""
      const lastName = data.lastName || ""
      const specialty = data.specialty || "General Practitioner"
      const location = data.address || "Medical Center"

      // For debugging
      console.log(`Doctor: ${displayName}, Specialty: ${specialty}`)

      // Check if the doctor matches the search term
      const matchesSearch =
        !searchTermLower ||
        displayName.toLowerCase().includes(searchTermLower) ||
        firstName.toLowerCase().includes(searchTermLower) ||
        lastName.toLowerCase().includes(searchTermLower) ||
        specialty.toLowerCase().includes(searchTermLower) ||
        location.toLowerCase().includes(searchTermLower)

      // Check if the doctor matches the specialty filter
      const matchesSpecialty = !filters.specialty || specialty.toLowerCase() === filters.specialty.toLowerCase()

      // Add to results if matches all filters
      if (matchesSearch && matchesSpecialty) {
        doctorsData.push({
          id: doc.id,
          displayName,
          firstName,
          lastName,
          specialty,
          location,
          photoURL: data.photoURL || null,
          experience: data.experience || `${Math.floor(Math.random() * 15) + 3} years`,
          isOnline: data.isOnline || false,
        })
      }
    })

    console.log(`After filtering, found ${doctorsData.length} matching doctors`)

    return {
      doctors: doctorsData,
      lastDoc: newLastDoc,
      hasMore: doctorsSnapshot.size === resultsLimit,
    }
  } catch (error) {
    console.error("Error searching doctors:", error)
    return { doctors: [], lastDoc: null, hasMore: false }
  }
}

// Get all available specialties
export async function getSpecialties() {
  try {
    const doctorsQuery = query(collection(db, "users"), where("role", "==", "doctor"))

    const doctorsSnapshot = await getDocs(doctorsQuery)
    const specialties = new Set()

    doctorsSnapshot.forEach((doc) => {
      const data = doc.data()
      if (data.specialty) {
        specialties.add(data.specialty)
      }
    })

    return Array.from(specialties).sort()
  } catch (error) {
    console.error("Error fetching specialties:", error)
    return []
  }
}

// Format doctor search results for display
export function formatDoctorSearchResult(doctor) {
  return {
    ...doctor,
    displayName: doctor.displayName || `Dr. ${doctor.lastName || "Unknown"}`,
    specialty: doctor.specialty || "General Practitioner",
    location: doctor.address || "Medical Center",
  }
}
