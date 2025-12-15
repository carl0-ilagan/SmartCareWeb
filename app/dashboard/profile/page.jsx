"use client"

import { useState, useEffect, useRef } from "react"
import { Camera, Mail, Phone, User, Calendar, MapPin, Heart, Shield, FileText, Edit2, Save, X } from "lucide-react"
import { SaveConfirmationModal } from "@/components/save-confirmation-modal"
import { useAuth } from "@/contexts/auth-context"
import { getUserProfile, updateUserProfile, uploadProfilePhoto } from "@/lib/firebase-utils"
import ProfileImage from "@/components/profile-image"

export default function ProfilePage() {
  const { user } = useAuth()
  const [isEditing, setIsEditing] = useState(false)
  const [showSaveModal, setShowSaveModal] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const fileInputRef = useRef(null)

  const [profile, setProfile] = useState({
    displayName: "",
    email: "",
    phone: "",
    dob: "",
    gender: "",
    address: "",
    emergencyContact: "",
    emergencyPhone: "",
    bloodType: "",
    allergies: "",
    medicalConditions: "",
    currentMedications: "",
    photoURL: "",
  })

  // Fetch user profile data
  useEffect(() => {
    async function fetchUserProfile() {
      if (!user) return

      try {
        setLoading(true)
        const userData = await getUserProfile(user.uid)
        if (userData) {
          setProfile({
            displayName: userData.displayName || user.displayName || "",
            email: userData.email || user.email || "",
            phone: userData.phone || "",
            dob: userData.dob || "",
            gender: userData.gender || "",
            address: userData.address || "",
            emergencyContact: userData.emergencyContact || "",
            emergencyPhone: userData.emergencyPhone || "",
            bloodType: userData.bloodType || "",
            allergies: userData.allergies || "",
            medicalConditions: userData.medicalConditions || "",
            currentMedications: userData.currentMedications || "",
            photoURL: userData.photoURL || user.photoURL || "",
          })
        }
      } catch (err) {
        console.error("Error fetching profile:", err)
        setError("Failed to load profile data")
      } finally {
        setLoading(false)
      }
    }

    fetchUserProfile()
  }, [user])

  const handleChange = (e) => {
    const { name, value } = e.target
    setProfile((prev) => ({ ...prev, [name]: value }))
  }

  const handlePhotoClick = () => {
    fileInputRef.current?.click()
  }

  const handlePhotoChange = async (e) => {
    if (!user || !e.target.files || !e.target.files[0]) return

    try {
      const file = e.target.files[0]
      const photoURL = await uploadProfilePhoto(user.uid, file)
      setProfile((prev) => ({ ...prev, photoURL }))
    } catch (err) {
      console.error("Error uploading photo:", err)
      setError("Failed to upload photo")
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!user) return

    try {
      setLoading(true)
      await updateUserProfile(user.uid, {
        displayName: profile.displayName,
        phone: profile.phone,
        dob: profile.dob,
        gender: profile.gender,
        address: profile.address,
        emergencyContact: profile.emergencyContact,
        emergencyPhone: profile.emergencyPhone,
        bloodType: profile.bloodType,
        allergies: profile.allergies,
        medicalConditions: profile.medicalConditions,
        currentMedications: profile.currentMedications,
      })
      setIsEditing(false)
      setShowSaveModal(true)
    } catch (err) {
      console.error("Error updating profile:", err)
      setError("Failed to update profile")
    } finally {
      setLoading(false)
    }
  }

  if (loading && !profile.displayName) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-soft-amber"></div>
      </div>
    )
  }

  return (
    <>
      <style jsx global>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-20px);
            max-height: 0;
          }
          to {
            opacity: 1;
            transform: translateY(0);
            max-height: 5000px;
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.4s ease-out forwards;
        }
        .animate-slideDown {
          animation: slideDown 0.4s ease-out forwards;
        }
      `}</style>
      
      <div className="space-y-6 sm:space-y-8 animate-fadeIn">
        {error && (
          <div className="rounded-lg bg-red-50 border-2 border-red-200 p-4 flex items-center gap-3 shadow-sm" role="alert">
            <div className="flex-shrink-0">
              <Shield className="h-5 w-5 text-red-600" />
            </div>
            <span className="text-sm font-medium text-red-800">{error}</span>
            <button
              onClick={() => setError(null)}
              className="ml-auto flex-shrink-0 text-red-600 hover:text-red-800 transition-colors"
              aria-label="Dismiss error"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Profile Header Banner */}
        <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 p-4 sm:p-6 text-white shadow-md">
          <div className="relative z-10 flex flex-col gap-4 sm:gap-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 sm:gap-6">
              <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
                <div className="relative flex-shrink-0">
                  <div className="relative h-24 w-24 sm:h-28 sm:w-28 md:h-28 md:w-28">
                    <div className="h-full w-full overflow-hidden rounded-full border-4 border-white/30 shadow-lg">
                      <ProfileImage
                        src={profile.photoURL}
                        alt={profile.displayName || "Profile"}
                        className="h-full w-full"
                        role="patient"
                      />
                    </div>
                    {isEditing && (
                      <>
                        <input
                          type="file"
                          ref={fileInputRef}
                          onChange={handlePhotoChange}
                          className="hidden"
                          accept="image/*"
                        />
                        <button
                          className="absolute -bottom-1 -right-1 sm:-bottom-1.5 sm:-right-1.5 z-10 rounded-full bg-white p-2 sm:p-2.5 text-amber-500 shadow-xl hover:bg-amber-50 transition-all duration-200 hover:scale-110 border-2 border-amber-500/50 ring-2 ring-white/50"
                          onClick={handlePhotoClick}
                          aria-label="Change photo"
                        >
                          <Camera className="h-4 w-4 sm:h-5 sm:w-5" />
                          <span className="sr-only">Change photo</span>
                        </button>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h1 className="text-xl sm:text-2xl font-bold md:text-3xl">{profile.displayName || "Your Profile"}</h1>
                    <span className="inline-flex items-center rounded-full bg-white/20 px-2.5 py-0.5 text-xs font-medium text-white backdrop-blur-sm">
                      Patient
                    </span>
                  </div>
                  <div className="mt-2 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                    {profile.email && (
                      <div className="flex items-center text-white/90">
                        <Mail className="mr-1 h-4 w-4 flex-shrink-0" />
                        <span className="text-xs sm:text-sm truncate">{profile.email}</span>
                      </div>
                    )}
                    {profile.phone && (
                      <div className="flex items-center text-white/90">
                        <Phone className="mr-1 h-4 w-4 flex-shrink-0" />
                        <span className="text-xs sm:text-sm">{profile.phone}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <button
                onClick={() => setIsEditing(!isEditing)}
                className={`w-full sm:w-auto self-stretch sm:self-center rounded-xl px-5 sm:px-6 py-3 sm:py-2.5 text-sm font-semibold shadow-lg transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                  isEditing
                    ? "bg-white text-amber-500 hover:bg-amber-50 hover:scale-105 focus:ring-white border-2 border-white/50"
                    : "bg-white/20 backdrop-blur-sm text-white hover:bg-white/30 hover:scale-105 focus:ring-white/50 border-2 border-white/30"
                }`}
                disabled={loading}
              >
                <span className="flex items-center justify-center gap-2">
                  {isEditing ? (
                    <>
                      <X className="h-4 w-4" />
                      Cancel
                    </>
                  ) : (
                    <>
                      <Edit2 className="h-4 w-4" />
                      Edit Profile
                    </>
                  )}
                </span>
              </button>
            </div>
          </div>

          {/* Decorative elements */}
          <div className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-white/10"></div>
          <div className="absolute -bottom-24 -left-24 h-80 w-80 rounded-full bg-white/10"></div>
          <div className="absolute -bottom-32 right-16 h-48 w-48 rounded-full bg-white/5"></div>
        </div>

        {isEditing ? (
          <div className="rounded-2xl border-2 border-amber-200/50 bg-gradient-to-br from-white via-amber-50/20 to-yellow-50/30 p-4 sm:p-6 md:p-8 shadow-xl backdrop-blur-sm animate-slideDown transition-all duration-300">
            <div className="mb-4 sm:mb-6 flex items-center gap-3 pb-3 sm:pb-4 border-b-2 border-amber-200/30">
              <div className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-full bg-gradient-to-br from-soft-amber to-amber-500 shadow-lg">
                <Edit2 className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
              </div>
              <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900">Edit Profile Information</h2>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
              <div className="grid gap-4 sm:gap-6 sm:grid-cols-2">
                <div>
                  <label htmlFor="displayName" className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1.5 sm:mb-2">
                    Full Name
                  </label>
                  <input
                    type="text"
                    id="displayName"
                    name="displayName"
                    value={profile.displayName}
                    onChange={handleChange}
                    className="w-full rounded-lg border-2 border-earth-beige bg-white py-2 sm:py-2.5 px-3 sm:px-4 text-xs sm:text-sm focus:border-soft-amber focus:outline-none focus:ring-2 focus:ring-soft-amber/20 transition-all duration-200"
                  />
                </div>
                <div>
                  <label htmlFor="email" className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1.5 sm:mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={profile.email}
                    onChange={handleChange}
                    disabled
                    className="w-full rounded-lg border-2 border-gray-200 bg-gray-50 py-2 sm:py-2.5 px-3 sm:px-4 text-xs sm:text-sm cursor-not-allowed opacity-70"
                  />
                </div>
                <div>
                  <label htmlFor="phone" className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1.5 sm:mb-2">
                    Phone
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={profile.phone}
                    onChange={handleChange}
                    className="w-full rounded-lg border-2 border-earth-beige bg-white py-2 sm:py-2.5 px-3 sm:px-4 text-xs sm:text-sm focus:border-soft-amber focus:outline-none focus:ring-2 focus:ring-soft-amber/20 transition-all duration-200"
                  />
                </div>
                <div>
                  <label htmlFor="dob" className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1.5 sm:mb-2">
                    Date of Birth
                  </label>
                  <input
                    type="date"
                    id="dob"
                    name="dob"
                    value={profile.dob}
                    onChange={handleChange}
                    className="w-full rounded-lg border-2 border-earth-beige bg-white py-2 sm:py-2.5 px-3 sm:px-4 text-xs sm:text-sm focus:border-soft-amber focus:outline-none focus:ring-2 focus:ring-soft-amber/20 transition-all duration-200"
                  />
                </div>
                <div>
                  <label htmlFor="gender" className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1.5 sm:mb-2">
                    Gender
                  </label>
                  <select
                    id="gender"
                    name="gender"
                    value={profile.gender}
                    onChange={handleChange}
                    className="w-full rounded-lg border-2 border-earth-beige bg-white py-2 sm:py-2.5 px-3 sm:px-4 text-xs sm:text-sm focus:border-soft-amber focus:outline-none focus:ring-2 focus:ring-soft-amber/20 transition-all duration-200"
                  >
                    <option value="">Select gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                    <option value="Prefer not to say">Prefer not to say</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="bloodType" className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1.5 sm:mb-2">
                    Blood Type
                  </label>
                  <select
                    id="bloodType"
                    name="bloodType"
                    value={profile.bloodType}
                    onChange={handleChange}
                    className="w-full rounded-lg border-2 border-earth-beige bg-white py-2 sm:py-2.5 px-3 sm:px-4 text-xs sm:text-sm focus:border-soft-amber focus:outline-none focus:ring-2 focus:ring-soft-amber/20 transition-all duration-200"
                  >
                    <option value="">Select blood type</option>
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                  </select>
                </div>
              </div>

              <div>
                <label htmlFor="address" className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1.5 sm:mb-2">
                  Address
                </label>
                <input
                  type="text"
                  id="address"
                  name="address"
                  value={profile.address}
                  onChange={handleChange}
                  className="w-full rounded-lg border-2 border-earth-beige bg-white py-2 sm:py-2.5 px-3 sm:px-4 text-xs sm:text-sm focus:border-soft-amber focus:outline-none focus:ring-2 focus:ring-soft-amber/20 transition-all duration-200"
                />
              </div>

              <div className="grid gap-4 sm:gap-6 sm:grid-cols-2">
                <div>
                  <label htmlFor="emergencyContact" className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1.5 sm:mb-2">
                    Emergency Contact
                  </label>
                  <input
                    type="text"
                    id="emergencyContact"
                    name="emergencyContact"
                    value={profile.emergencyContact}
                    onChange={handleChange}
                    className="w-full rounded-lg border-2 border-earth-beige bg-white py-2 sm:py-2.5 px-3 sm:px-4 text-xs sm:text-sm focus:border-soft-amber focus:outline-none focus:ring-2 focus:ring-soft-amber/20 transition-all duration-200"
                  />
                </div>
                <div>
                  <label htmlFor="emergencyPhone" className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1.5 sm:mb-2">
                    Emergency Phone
                  </label>
                  <input
                    type="tel"
                    id="emergencyPhone"
                    name="emergencyPhone"
                    value={profile.emergencyPhone}
                    onChange={handleChange}
                    className="w-full rounded-lg border-2 border-earth-beige bg-white py-2 sm:py-2.5 px-3 sm:px-4 text-xs sm:text-sm focus:border-soft-amber focus:outline-none focus:ring-2 focus:ring-soft-amber/20 transition-all duration-200"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="allergies" className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1.5 sm:mb-2">
                  Allergies
                </label>
                <input
                  type="text"
                  id="allergies"
                  name="allergies"
                  value={profile.allergies}
                  onChange={handleChange}
                  className="w-full rounded-lg border-2 border-earth-beige bg-white py-2 sm:py-2.5 px-3 sm:px-4 text-xs sm:text-sm focus:border-soft-amber focus:outline-none focus:ring-2 focus:ring-soft-amber/20 transition-all duration-200"
                />
              </div>

              <div>
                <label htmlFor="medicalConditions" className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1.5 sm:mb-2">
                  Medical Conditions
                </label>
                <textarea
                  id="medicalConditions"
                  name="medicalConditions"
                  value={profile.medicalConditions}
                  onChange={handleChange}
                  rows={3}
                  className="w-full rounded-lg border-2 border-earth-beige bg-white py-2 sm:py-2.5 px-3 sm:px-4 text-xs sm:text-sm focus:border-soft-amber focus:outline-none focus:ring-2 focus:ring-soft-amber/20 transition-all duration-200 resize-none"
                />
              </div>

              <div>
                <label htmlFor="currentMedications" className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1.5 sm:mb-2">
                  Current Medications
                </label>
                <textarea
                  id="currentMedications"
                  name="currentMedications"
                  value={profile.currentMedications}
                  onChange={handleChange}
                  rows={3}
                  className="w-full rounded-lg border-2 border-earth-beige bg-white py-2 sm:py-2.5 px-3 sm:px-4 text-xs sm:text-sm focus:border-soft-amber focus:outline-none focus:ring-2 focus:ring-soft-amber/20 transition-all duration-200 resize-none"
                />
              </div>

              <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-4 sm:pt-6 border-t-2 border-amber-200/30">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="w-full sm:w-auto rounded-xl border-2 border-gray-300 bg-white px-5 sm:px-6 py-2.5 sm:py-3 text-sm font-semibold text-gray-700 shadow-md transition-all duration-200 hover:bg-gray-50 hover:scale-105 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-gray-300 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={loading}
                >
                  <span className="flex items-center justify-center gap-2">
                    <X className="h-4 w-4" />
                    Cancel
                  </span>
                </button>
                <button
                  type="submit"
                  className="w-full sm:w-auto rounded-xl bg-gradient-to-r from-soft-amber to-amber-500 px-6 sm:px-8 py-2.5 sm:py-3 text-sm font-semibold text-white shadow-lg transition-all duration-200 hover:from-amber-500 hover:to-amber-600 hover:scale-105 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-soft-amber focus:ring-offset-2 disabled:opacity-70 disabled:cursor-not-allowed"
                  disabled={loading}
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
                      <span>Saving...</span>
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      <Save className="h-4 w-4" />
                      <span>Save Changes</span>
                    </span>
                  )}
                </button>
              </div>
            </form>
          </div>
        ) : (
          <div className="grid gap-6 sm:gap-8 grid-cols-1">
            {/* Personal Information */}
            <div className="rounded-2xl border-2 border-amber-200/50 bg-gradient-to-br from-white via-amber-50/20 to-yellow-50/30 p-6 sm:p-8 shadow-xl backdrop-blur-sm">
              <div className="mb-6 flex items-center gap-3 pb-4 border-b-2 border-amber-200/30">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-soft-amber to-amber-500 shadow-lg">
                  <User className="h-5 w-5 text-white" />
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-gray-900">Personal Information</h3>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-6">
                  <div className="flex items-start gap-4 p-4 rounded-xl bg-white/60 backdrop-blur-sm border border-amber-100/50 hover:bg-white/80 transition-all duration-200">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-soft-amber/20 to-amber-50 flex-shrink-0">
                      <User className="h-5 w-5 text-soft-amber" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Full Name</p>
                      <p className="text-base sm:text-lg text-gray-900 break-words">
                        {profile.displayName || "Not provided"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4 p-4 rounded-xl bg-white/60 backdrop-blur-sm border border-amber-100/50 hover:bg-white/80 transition-all duration-200">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-soft-amber/20 to-amber-50 flex-shrink-0">
                      <Calendar className="h-5 w-5 text-soft-amber" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Date of Birth</p>
                      <p className="text-base sm:text-lg text-gray-900">
                        {profile.dob ? new Date(profile.dob).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : "Not provided"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4 p-4 rounded-xl bg-white/60 backdrop-blur-sm border border-amber-100/50 hover:bg-white/80 transition-all duration-200">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-soft-amber/20 to-amber-50 flex-shrink-0">
                      <User className="h-5 w-5 text-soft-amber" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Gender</p>
                      <p className="text-base sm:text-lg text-gray-900">{profile.gender || "Not provided"}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="flex items-start gap-4 p-4 rounded-xl bg-white/60 backdrop-blur-sm border border-amber-100/50 hover:bg-white/80 transition-all duration-200">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-soft-amber/20 to-amber-50 flex-shrink-0">
                      <Mail className="h-5 w-5 text-soft-amber" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Email</p>
                      <p className="text-base sm:text-lg text-gray-900 break-words">{profile.email}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4 p-4 rounded-xl bg-white/60 backdrop-blur-sm border border-amber-100/50 hover:bg-white/80 transition-all duration-200">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-soft-amber/20 to-amber-50 flex-shrink-0">
                      <Phone className="h-5 w-5 text-soft-amber" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Phone</p>
                      <p className="text-base sm:text-lg text-gray-900">{profile.phone || "Not provided"}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4 p-4 rounded-xl bg-white/60 backdrop-blur-sm border border-amber-100/50 hover:bg-white/80 transition-all duration-200">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-soft-amber/20 to-amber-50 flex-shrink-0">
                      <MapPin className="h-5 w-5 text-soft-amber" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Address</p>
                      <p className="text-base sm:text-lg text-gray-900 break-words">
                        {profile.address || "Not provided"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Emergency Contact */}
            <div className="rounded-2xl border-2 border-amber-200/50 bg-gradient-to-br from-white via-amber-50/20 to-yellow-50/30 p-6 sm:p-8 shadow-xl backdrop-blur-sm">
              <div className="mb-6 flex items-center gap-3 pb-4 border-b-2 border-amber-200/30">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-red-400 to-red-500 shadow-lg">
                  <Phone className="h-5 w-5 text-white" />
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-gray-900">Emergency Contact</h3>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <div className="flex items-start gap-4 p-4 rounded-xl bg-white/60 backdrop-blur-sm border border-amber-100/50 hover:bg-white/80 transition-all duration-200">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-red-400/20 to-red-50 flex-shrink-0">
                    <User className="h-5 w-5 text-red-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Emergency Contact</p>
                    <p className="text-base sm:text-lg text-gray-900">
                      {profile.emergencyContact || "Not provided"}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-4 rounded-xl bg-white/60 backdrop-blur-sm border border-amber-100/50 hover:bg-white/80 transition-all duration-200">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-red-400/20 to-red-50 flex-shrink-0">
                    <Phone className="h-5 w-5 text-red-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Emergency Phone</p>
                    <p className="text-base sm:text-lg text-gray-900">
                      {profile.emergencyPhone || "Not provided"}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Medical Information */}
            <div className="rounded-2xl border-2 border-amber-200/50 bg-gradient-to-br from-white via-amber-50/20 to-yellow-50/30 p-6 sm:p-8 shadow-xl backdrop-blur-sm">
              <div className="mb-6 flex items-center gap-3 pb-4 border-b-2 border-amber-200/30">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-green-400 to-green-500 shadow-lg">
                  <Heart className="h-5 w-5 text-white" />
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-gray-900">Medical Information</h3>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <div className="flex items-start gap-4 p-4 rounded-xl bg-white/60 backdrop-blur-sm border border-amber-100/50 hover:bg-white/80 transition-all duration-200">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-red-400/20 to-red-50 flex-shrink-0">
                    <Heart className="h-5 w-5 text-red-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Blood Type</p>
                    <p className="text-base sm:text-lg text-gray-900">
                      {profile.bloodType || "Not provided"}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-4 rounded-xl bg-white/60 backdrop-blur-sm border border-amber-100/50 hover:bg-white/80 transition-all duration-200">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-amber-400/20 to-amber-50 flex-shrink-0">
                    <Shield className="h-5 w-5 text-amber-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Allergies</p>
                    <p className="text-base sm:text-lg text-gray-900">{profile.allergies || "None"}</p>
                  </div>
                </div>
              </div>

              <div className="mt-6 space-y-6">
                <div className="flex items-start gap-4 p-4 rounded-xl bg-white/60 backdrop-blur-sm border border-amber-100/50 hover:bg-white/80 transition-all duration-200">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-blue-400/20 to-blue-50 flex-shrink-0">
                    <FileText className="h-5 w-5 text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Medical Conditions</p>
                    <p className="text-base sm:text-lg text-gray-900 break-words">
                      {profile.medicalConditions || "None"}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-4 rounded-xl bg-white/60 backdrop-blur-sm border border-amber-100/50 hover:bg-white/80 transition-all duration-200">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-purple-400/20 to-purple-50 flex-shrink-0">
                    <FileText className="h-5 w-5 text-purple-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Current Medications</p>
                    <p className="text-base sm:text-lg text-gray-900 break-words">
                      {profile.currentMedications || "None"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        <SaveConfirmationModal
          isOpen={showSaveModal}
          onClose={() => setShowSaveModal(false)}
          title="Profile Updated"
          message="Your profile information has been successfully updated."
        />
      </div>
    </>
  )
}