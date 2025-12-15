"use client"

import { useState, useEffect, useRef } from "react"
import { Camera, Mail, Phone, Briefcase, GraduationCap, Globe, MapPin, Clock, FileText, Edit2, Save, X, Shield, Stethoscope } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { getUserProfile, updateUserProfile, uploadProfilePhoto } from "@/lib/firebase-utils"
import { SaveConfirmationModal } from "@/components/save-confirmation-modal"
import ProfileImage from "@/components/profile-image"

export default function DoctorProfilePage() {
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
    specialty: "",
    licenseNumber: "",
    education: "",
    experience: "",
    languages: "",
    bio: "",
    officeAddress: "",
    officeHours: "",
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
            specialty: userData.specialty || "",
            licenseNumber: userData.licenseNumber || "",
            education: userData.education || "",
            experience: userData.experience || "",
            languages: userData.languages || "",
            bio: userData.bio || "",
            officeAddress: userData.officeAddress || "",
            officeHours: userData.officeHours || "",
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
        specialty: profile.specialty,
        licenseNumber: profile.licenseNumber,
        education: profile.education,
        experience: profile.experience,
        languages: profile.languages,
        bio: profile.bio,
        officeAddress: profile.officeAddress,
        officeHours: profile.officeHours,
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
                        role="doctor"
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
                    <h1 className="text-xl sm:text-2xl font-bold md:text-3xl">{profile.displayName || "Doctor Profile"}</h1>
                    <span className="inline-flex items-center rounded-full bg-white/20 px-2.5 py-0.5 text-xs font-medium text-white backdrop-blur-sm">
                      Doctor
                    </span>
                  </div>
                  {profile.specialty && (
                    <div className="mt-2">
                      <span className="inline-flex items-center rounded-full bg-white/30 px-2.5 py-0.5 text-xs sm:text-sm font-medium text-white backdrop-blur-sm">
                        {profile.specialty}
                      </span>
                    </div>
                  )}
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
              <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900">Edit Professional Information</h2>
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
                  <label htmlFor="specialty" className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1.5 sm:mb-2">
                    Specialty
                  </label>
                  <input
                    type="text"
                    id="specialty"
                    name="specialty"
                    value={profile.specialty}
                    onChange={handleChange}
                    className="w-full rounded-lg border-2 border-earth-beige bg-white py-2 sm:py-2.5 px-3 sm:px-4 text-xs sm:text-sm focus:border-soft-amber focus:outline-none focus:ring-2 focus:ring-soft-amber/20 transition-all duration-200"
                  />
                </div>
                <div>
                  <label htmlFor="licenseNumber" className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1.5 sm:mb-2">
                    License Number
                  </label>
                  <input
                    type="text"
                    id="licenseNumber"
                    name="licenseNumber"
                    value={profile.licenseNumber}
                    onChange={handleChange}
                    className="w-full rounded-lg border-2 border-earth-beige bg-white py-2 sm:py-2.5 px-3 sm:px-4 text-xs sm:text-sm focus:border-soft-amber focus:outline-none focus:ring-2 focus:ring-soft-amber/20 transition-all duration-200"
                  />
                </div>
                <div>
                  <label htmlFor="education" className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1.5 sm:mb-2">
                    Education
                  </label>
                  <input
                    type="text"
                    id="education"
                    name="education"
                    value={profile.education}
                    onChange={handleChange}
                    className="w-full rounded-lg border-2 border-earth-beige bg-white py-2 sm:py-2.5 px-3 sm:px-4 text-xs sm:text-sm focus:border-soft-amber focus:outline-none focus:ring-2 focus:ring-soft-amber/20 transition-all duration-200"
                  />
                </div>
                <div>
                  <label htmlFor="experience" className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1.5 sm:mb-2">
                    Experience
                  </label>
                  <input
                    type="text"
                    id="experience"
                    name="experience"
                    value={profile.experience}
                    onChange={handleChange}
                    className="w-full rounded-lg border-2 border-earth-beige bg-white py-2 sm:py-2.5 px-3 sm:px-4 text-xs sm:text-sm focus:border-soft-amber focus:outline-none focus:ring-2 focus:ring-soft-amber/20 transition-all duration-200"
                  />
                </div>
                <div>
                  <label htmlFor="languages" className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1.5 sm:mb-2">
                    Languages
                  </label>
                  <input
                    type="text"
                    id="languages"
                    name="languages"
                    value={profile.languages}
                    onChange={handleChange}
                    className="w-full rounded-lg border-2 border-earth-beige bg-white py-2 sm:py-2.5 px-3 sm:px-4 text-xs sm:text-sm focus:border-soft-amber focus:outline-none focus:ring-2 focus:ring-soft-amber/20 transition-all duration-200"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="bio" className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1.5 sm:mb-2">
                  Professional Bio
                </label>
                <textarea
                  id="bio"
                  name="bio"
                  value={profile.bio}
                  onChange={handleChange}
                  rows={3}
                  className="w-full rounded-lg border-2 border-earth-beige bg-white py-2 sm:py-2.5 px-3 sm:px-4 text-xs sm:text-sm focus:border-soft-amber focus:outline-none focus:ring-2 focus:ring-soft-amber/20 transition-all duration-200 resize-none"
                />
              </div>

              <div>
                <label htmlFor="officeAddress" className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1.5 sm:mb-2">
                  Office Address
                </label>
                <input
                  type="text"
                  id="officeAddress"
                  name="officeAddress"
                  value={profile.officeAddress}
                  onChange={handleChange}
                  className="w-full rounded-lg border-2 border-earth-beige bg-white py-2 sm:py-2.5 px-3 sm:px-4 text-xs sm:text-sm focus:border-soft-amber focus:outline-none focus:ring-2 focus:ring-soft-amber/20 transition-all duration-200"
                />
              </div>

              <div>
                <label htmlFor="officeHours" className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1.5 sm:mb-2">
                  Office Hours
                </label>
                <input
                  type="text"
                  id="officeHours"
                  name="officeHours"
                  value={profile.officeHours}
                  onChange={handleChange}
                  className="w-full rounded-lg border-2 border-earth-beige bg-white py-2 sm:py-2.5 px-3 sm:px-4 text-xs sm:text-sm focus:border-soft-amber focus:outline-none focus:ring-2 focus:ring-soft-amber/20 transition-all duration-200"
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
            {/* Professional Information */}
            <div className="rounded-2xl border-2 border-amber-200/50 bg-gradient-to-br from-white via-amber-50/20 to-yellow-50/30 p-6 sm:p-8 shadow-xl backdrop-blur-sm">
              <div className="mb-6 flex items-center gap-3 pb-4 border-b-2 border-amber-200/30">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-soft-amber to-amber-500 shadow-lg">
                  <Briefcase className="h-5 w-5 text-white" />
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-gray-900">Professional Information</h3>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-6">
                  <div className="flex items-start gap-4 p-4 rounded-xl bg-white/60 backdrop-blur-sm border border-amber-100/50 hover:bg-white/80 transition-all duration-200">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-soft-amber/20 to-amber-50 flex-shrink-0">
                      <Briefcase className="h-5 w-5 text-soft-amber" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Specialty</p>
                      <p className="text-base sm:text-lg text-gray-900 break-words">
                        {profile.specialty || "Not provided"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4 p-4 rounded-xl bg-white/60 backdrop-blur-sm border border-amber-100/50 hover:bg-white/80 transition-all duration-200">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-soft-amber/20 to-amber-50 flex-shrink-0">
                      <FileText className="h-5 w-5 text-soft-amber" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">License Number</p>
                      <p className="text-base sm:text-lg text-gray-900 break-words">
                        {profile.licenseNumber || "Not provided"}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="flex items-start gap-4 p-4 rounded-xl bg-white/60 backdrop-blur-sm border border-amber-100/50 hover:bg-white/80 transition-all duration-200">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-soft-amber/20 to-amber-50 flex-shrink-0">
                      <Briefcase className="h-5 w-5 text-soft-amber" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Experience</p>
                      <p className="text-base sm:text-lg text-gray-900 break-words">
                        {profile.experience || "Not provided"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4 p-4 rounded-xl bg-white/60 backdrop-blur-sm border border-amber-100/50 hover:bg-white/80 transition-all duration-200">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-soft-amber/20 to-amber-50 flex-shrink-0">
                      <Globe className="h-5 w-5 text-soft-amber" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Languages</p>
                      <p className="text-base sm:text-lg text-gray-900 break-words">
                        {profile.languages || "Not provided"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Education - Full width spanning both columns */}
                <div className="md:col-span-2 flex items-start gap-4 p-4 rounded-xl bg-white/60 backdrop-blur-sm border border-amber-100/50 hover:bg-white/80 transition-all duration-200">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-soft-amber/20 to-amber-50 flex-shrink-0">
                    <GraduationCap className="h-5 w-5 text-soft-amber" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Education</p>
                    <p className="text-base sm:text-lg text-gray-900 break-words">
                      {profile.education || "Not provided"}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Contact Information */}
            <div className="rounded-2xl border-2 border-amber-200/50 bg-gradient-to-br from-white via-amber-50/20 to-yellow-50/30 p-6 sm:p-8 shadow-xl backdrop-blur-sm">
              <div className="mb-6 flex items-center gap-3 pb-4 border-b-2 border-amber-200/30">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-soft-amber to-amber-500 shadow-lg">
                  <Mail className="h-5 w-5 text-white" />
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-gray-900">Contact Information</h3>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
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
                </div>

                <div className="space-y-6">
                  <div className="flex items-start gap-4 p-4 rounded-xl bg-white/60 backdrop-blur-sm border border-amber-100/50 hover:bg-white/80 transition-all duration-200">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-soft-amber/20 to-amber-50 flex-shrink-0">
                      <MapPin className="h-5 w-5 text-soft-amber" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Office Address</p>
                      <p className="text-base sm:text-lg text-gray-900 break-words">
                        {profile.officeAddress || "Not provided"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4 p-4 rounded-xl bg-white/60 backdrop-blur-sm border border-amber-100/50 hover:bg-white/80 transition-all duration-200">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-soft-amber/20 to-amber-50 flex-shrink-0">
                      <Clock className="h-5 w-5 text-soft-amber" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Office Hours</p>
                      <p className="text-base sm:text-lg text-gray-900 break-words">
                        {profile.officeHours || "Not provided"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Professional Bio */}
            {profile.bio && (
              <div className="rounded-2xl border-2 border-amber-200/50 bg-gradient-to-br from-white via-amber-50/20 to-yellow-50/30 p-6 sm:p-8 shadow-xl backdrop-blur-sm">
                <div className="mb-6 flex items-center gap-3 pb-4 border-b-2 border-amber-200/30">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-soft-amber to-amber-500 shadow-lg">
                    <FileText className="h-5 w-5 text-white" />
                  </div>
                  <h3 className="text-xl sm:text-2xl font-bold text-gray-900">Professional Bio</h3>
                </div>

                <div className="flex items-start gap-4 p-4 rounded-xl bg-white/60 backdrop-blur-sm border border-amber-100/50 hover:bg-white/80 transition-all duration-200">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-soft-amber/20 to-amber-50 flex-shrink-0">
                    <FileText className="h-5 w-5 text-soft-amber" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-base sm:text-lg text-gray-900 whitespace-pre-line break-words">
                      {profile.bio}
                    </p>
                  </div>
                </div>
              </div>
            )}
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