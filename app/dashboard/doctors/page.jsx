"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Search, Filter, Star, MapPin, Calendar, User, ChevronDown } from "lucide-react"
import { searchDoctors, getSpecialties } from "@/lib/search-utils"
import { AppointmentModal } from "@/components/appointment-modal"

export default function DoctorsDirectory() {
  const [doctors, setDoctors] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedSpecialty, setSelectedSpecialty] = useState("")
  const [specialties, setSpecialties] = useState([])
  const [lastDoc, setLastDoc] = useState(null)
  const [hasMore, setHasMore] = useState(true)
  const [isAppointmentModalOpen, setIsAppointmentModalOpen] = useState(false)
  const [selectedDoctor, setSelectedDoctor] = useState(null)
  const [error, setError] = useState(null)

  // Fetch doctors on initial load
  useEffect(() => {
    fetchDoctors()
    fetchSpecialties()
  }, [])

  const fetchSpecialties = async () => {
    try {
      const specialtiesList = await getSpecialties()
      setSpecialties(specialtiesList)
    } catch (err) {
      console.error("Error fetching specialties:", err)
      setError("Failed to load specialties")
    }
  }

  const fetchDoctors = async (loadMore = false) => {
    try {
      setIsLoading(true)
      setError(null)

      const filters = {
        specialty: selectedSpecialty,
      }

      // If loading more, use the last document for pagination
      const paginationDoc = loadMore ? lastDoc : null

      console.log("Fetching doctors with term:", searchTerm, "Specialty:", selectedSpecialty)

      const {
        doctors: doctorsData,
        lastDoc: newLastDoc,
        hasMore: moreResults,
      } = await searchDoctors(searchTerm, filters, paginationDoc)

      console.log(`Fetched ${doctorsData.length} doctors`)

      if (loadMore) {
        setDoctors((prev) => [...prev, ...doctorsData])
      } else {
        setDoctors(doctorsData)
      }

      setLastDoc(newLastDoc)
      setHasMore(moreResults)
    } catch (err) {
      console.error("Error fetching doctors:", err)
      setError("Failed to load doctors")
    } finally {
      setIsLoading(false)
    }
  }

  const handleSearch = (e) => {
    e.preventDefault()
    fetchDoctors(false)
  }

  const handleLoadMore = () => {
    fetchDoctors(true)
  }

  const handleBookAppointment = (doctor) => {
    setSelectedDoctor(doctor)
    setIsAppointmentModalOpen(true)
  }

  // Generate star rating display
  const renderStarRating = (rating) => {
    const fullStars = Math.floor(rating)
    const hasHalfStar = rating % 1 >= 0.5
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0)

    return (
      <div className="flex">
        {[...Array(fullStars)].map((_, i) => (
          <Star key={`full-${i}`} className="h-4 w-4 fill-amber-500 text-amber-500" />
        ))}
        {hasHalfStar && (
          <div className="relative">
            <Star className="h-4 w-4 text-amber-500" />
            <div className="absolute inset-0 overflow-hidden w-1/2">
              <Star className="h-4 w-4 fill-amber-500 text-amber-500" />
            </div>
          </div>
        )}
        {[...Array(emptyStars)].map((_, i) => (
          <Star key={`empty-${i}`} className="h-4 w-4 text-amber-500" />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-graphite md:text-3xl">Find a Doctor</h1>

      {/* Search and filters */}
      <div className="space-y-4">
        <form onSubmit={handleSearch} className="flex flex-col space-y-4 w-full">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-drift-gray" />
            <input
              type="text"
              placeholder="Search by name, specialty, or location"
              className="w-full rounded-md border border-pale-stone py-2 pl-10 pr-4 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 space-y-4 sm:space-y-0">
            <div className="relative flex-1 sm:max-w-[250px]">
              <div className="flex items-center">
                <Filter className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-drift-gray" />
                <select
                  className="w-full appearance-none rounded-md border border-pale-stone py-2 pl-10 pr-8 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                  value={selectedSpecialty}
                  onChange={(e) => setSelectedSpecialty(e.target.value)}
                >
                  <option value="">All Specialties</option>
                  {specialties.map((specialty) => (
                    <option key={specialty} value={specialty}>
                      {specialty}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 pointer-events-none text-drift-gray" />
              </div>
            </div>

            <button
              type="submit"
              className="rounded-md bg-amber-500 px-4 py-2 text-white hover:bg-amber-600 w-full sm:w-auto"
            >
              Search
            </button>
          </div>
        </form>
      </div>

      {/* Error message */}
      {error && <div className="p-4 bg-red-50 border border-red-200 rounded-md text-red-600 text-center">{error}</div>}

      {/* Doctors list */}
      {isLoading && doctors.length === 0 ? (
        <div className="flex min-h-[50vh] items-center justify-center">
          <div className="flex flex-col items-center space-y-4">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-amber-500 border-t-transparent"></div>
            <p className="text-drift-gray">Loading doctors...</p>
          </div>
        </div>
      ) : doctors.length === 0 ? (
        <div className="flex min-h-[50vh] flex-col items-center justify-center rounded-lg border border-pale-stone bg-white p-8">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-pale-stone text-amber-500">
            <User className="h-8 w-8" />
          </div>
          <h2 className="mb-2 text-xl font-semibold text-graphite">No doctors found</h2>
          <p className="mb-6 text-center text-drift-gray">
            {searchTerm || selectedSpecialty
              ? "Try adjusting your search or filters to find more doctors."
              : "There are no doctors available at the moment."}
          </p>
          {(searchTerm || selectedSpecialty) && (
            <button
              onClick={() => {
                setSearchTerm("")
                setSelectedSpecialty("")
                fetchDoctors()
              }}
              className="rounded-md bg-amber-500 px-4 py-2 text-white hover:bg-amber-600"
            >
              Clear Filters
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {doctors.map((doctor) => (
            <div
              key={doctor.id}
              className="rounded-lg border border-pale-stone bg-white p-4 shadow-sm transition-all duration-300 hover:border-amber-500/50 hover:shadow-md"
            >
              <div className="flex flex-col space-y-4">
                <div className="flex items-center space-x-4">
                  <Link href={`/dashboard/doctors/${doctor.id}`} className="flex-shrink-0">
                    <div className="relative h-16 w-16 overflow-hidden rounded-full border-4 border-amber-100 bg-pale-stone sm:h-20 sm:w-20">
                      {doctor.photoURL ? (
                        <img
                          src={doctor.photoURL || "/placeholder.svg"}
                          alt={doctor.displayName}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-amber-500 text-white">
                          <span className="text-xl font-bold">{doctor.displayName.charAt(0)}</span>
                        </div>
                      )}
                      <span
                        className={`absolute -right-1 -top-1 h-3.5 w-3.5 rounded-full ring-2 ring-white ${doctor.isOnline ? "bg-green-500" : "bg-gray-400"}`}
                        title={doctor.isOnline ? "Online" : "Offline"}
                      />
                    </div>
                  </Link>

                  <div className="flex-1 min-w-0">
                    <Link href={`/dashboard/doctors/${doctor.id}`} className="hover:text-amber-500">
                      <h2 className="text-lg font-semibold text-graphite truncate sm:text-xl">{doctor.displayName}</h2>
                    </Link>
                    <p className="text-drift-gray truncate">{doctor.specialty}</p>

                    <div className="mt-1 flex items-center">
                      {renderStarRating(doctor.rating)}
                      <span className="ml-1 text-xs text-drift-gray sm:text-sm">
                        ({doctor.rating} • {doctor.reviewCount})
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center text-drift-gray">
                  <MapPin className="mr-1 h-4 w-4 flex-shrink-0" />
                  <span className="text-sm truncate">{doctor.location}</span>
                </div>

                <div className="flex flex-wrap gap-2">
                  {doctor.availability.slice(0, 3).map((day) => (
                    <span key={day} className="rounded-full bg-pale-stone px-3 py-1 text-xs text-drift-gray">
                      {day}
                    </span>
                  ))}
                  {doctor.availability.length > 3 && (
                    <span className="rounded-full bg-pale-stone px-3 py-1 text-xs text-drift-gray">
                      +{doctor.availability.length - 3} more
                    </span>
                  )}
                </div>

                <div className="flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:space-x-2">
                  <button
                    onClick={() => handleBookAppointment(doctor)}
                    className="rounded-md bg-amber-500 px-4 py-2 text-white hover:bg-amber-600 flex-1"
                  >
                    <Calendar className="mr-2 h-4 w-4 inline" />
                    Book Appointment
                  </button>
                  <Link
                    href={`/dashboard/doctors/${doctor.id}`}
                    className="rounded-md border border-amber-500 px-4 py-2 text-center text-amber-500 hover:bg-amber-50 flex-1"
                  >
                    View Profile
                  </Link>
                </div>
              </div>
            </div>
          ))}

          {hasMore && (
            <div className="flex justify-center pt-4">
              <button
                onClick={handleLoadMore}
                className="rounded-md border border-amber-500 px-4 py-2 text-amber-500 hover:bg-amber-50"
                disabled={isLoading}
              >
                {isLoading ? "Loading..." : "Load More Doctors"}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Appointment Modal */}
      <AppointmentModal
        isOpen={isAppointmentModalOpen}
        onClose={() => setIsAppointmentModalOpen(false)}
        userRole="patient"
        selectedDoctor={selectedDoctor ? { id: selectedDoctor.id, name: selectedDoctor.displayName } : null}
      />
    </div>
  )
}
