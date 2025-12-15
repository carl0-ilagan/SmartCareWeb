"use client"

import { useState, useEffect } from "react"
import { Star, Send, AlertCircle, Trash2, X, Check } from "lucide-react"
import { useMobile } from "@/hooks/use-mobile"
import { useAuth } from "@/contexts/auth-context"
import { addFeedback, getUserFeedback, deleteFeedback } from "@/lib/feedback-utils"
import { SuccessNotification } from "@/components/success-notification"
import {
  getDoc,
  getDocs,
  doc,
  collection,
  orderBy,
  addDoc,
  serverTimestamp,
  query,
  updateDoc,
  deleteDoc,
} from "firebase/firestore"
import { db } from "@/lib/firebase"
import ProfileImage from "@/components/profile-image"
import { Loader2 } from "lucide-react"

export default function DoctorFeedbackPage() {
  const isMobile = useMobile()
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState("feedback")
  const [feedbackType, setFeedbackType] = useState("general")
  const [rating, setRating] = useState(0)
  const [hoverRating, setHoverRating] = useState(0)
  const [feedbackText, setFeedbackText] = useState("")
  const [loading, setLoading] = useState(true)
  const [pastFeedback, setPastFeedback] = useState([])
  const [notification, setNotification] = useState({ message: "", isVisible: false })
  const [deleteConfirm, setDeleteConfirm] = useState(null)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [adminProfiles, setAdminProfiles] = useState({})
  const [testimonials, setTestimonials] = useState([])
  const [testimonialText, setTestimonialText] = useState("")
  const [submittingTestimonial, setSubmittingTestimonial] = useState(false)
  const [editingTestimonialId, setEditingTestimonialId] = useState(null)
  const [editingText, setEditingText] = useState("")
  const [deletingTestimonialId, setDeletingTestimonialId] = useState(null)

  // Load published testimonials (global)
  useEffect(() => {
    const loadTestimonials = async () => {
      try {
        const testimonialsRef = collection(db, "testimonials")
        const q = query(testimonialsRef, orderBy("createdAt", "desc"))
        const snapshot = await getDocs(q)
        const items = snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }))

        // Enrich with user role/specialty when available
        const enriched = await Promise.all(
          items.map(async (item) => {
            try {
              if (!item.userId) return { ...item }
              const userDoc = await getDoc(doc(db, "users", item.userId))
              if (!userDoc.exists()) return { ...item }
              const userData = userDoc.data() || {}
              return {
                ...item,
                userRole: userData.role || item.userRole || "patient",
                specialty: userData.specialty || userData.specialization || userData.speciality || null,
                userName: item.userName || userData.displayName || userData.name || "User",
                userProfile: item.userProfile || userData.photoURL || null,
              }
            } catch {
              return { ...item }
            }
          })
        )

        setTestimonials(enriched)
      } catch (error) {
        if (error?.code === "permission-denied") {
          console.warn("Testimonials load blocked by permissions; showing none.")
        } else {
          console.error("Error loading testimonials:", error)
        }
        setTestimonials([])
      }
    }

    loadTestimonials()
  }, [])

  // Load user feedback
  useEffect(() => {
    if (!user) return

    const loadFeedback = async () => {
      try {
        setLoading(true)
        const feedback = await getUserFeedback(user.uid)
        setPastFeedback(feedback)

        // Fetch admin profiles for responses
        const adminIds = feedback
          .filter((item) => item.status === "responded" && item.respondedBy)
          .map((item) => item.respondedBy)
          .filter((value, index, self) => self.indexOf(value) === index) // Get unique admin IDs

        const adminProfilesData = {}
        for (const adminId of adminIds) {
          try {
            // Try users collection first to minimize permission issues
            const userDoc = await getDoc(doc(db, "users", adminId))
            if (userDoc.exists() && userDoc.data().role === "admin") {
              adminProfilesData[adminId] = userDoc.data()
              continue
            }

            // Fallback to admins collection; may be restricted for doctors, so handle permission errors quietly
            const adminDoc = await getDoc(doc(db, "admins", adminId))
            if (adminDoc.exists()) {
              adminProfilesData[adminId] = adminDoc.data()
            }
          } catch (error) {
            if (error?.code === "permission-denied") {
              // Provide a minimal placeholder to avoid breaking UI when permissions are restricted
              adminProfilesData[adminId] = { displayName: "Admin", photoURL: "/admin-interface.png" }
            } else {
              console.error(`Error fetching admin ${adminId}:`, error)
            }
          }
        }

        setAdminProfiles(adminProfilesData)
      } catch (error) {
        console.error("Error loading feedback:", error)
      } finally {
        setLoading(false)
      }
    }

    loadFeedback()
  }, [user])

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (rating === 0) {
      setNotification({
        message: "Please select a rating",
        isVisible: true,
      })
      return
    }

    if (!feedbackText.trim()) {
      setNotification({
        message: "Please provide feedback details",
        isVisible: true,
      })
      return
    }

    try {
      // Get doctor information from Firestore
      const doctorInfo = {
        userId: user.uid,
        userName: user.displayName || "Anonymous Doctor",
        userEmail: user.email,
        userRole: "doctor",
        specialty: user.specialty || "General Practice",
        userProfile: user.photoURL || null,
      }

      const newFeedback = {
        ...doctorInfo,
        type: feedbackType,
        rating,
        message: feedbackText,
        date: new Date().toLocaleDateString("en-US", {
          year: "numeric",
          month: "short",
          day: "numeric",
        }),
      }

      // Add to Firebase
      const addedFeedback = await addFeedback(newFeedback)

      // Update local state
      setPastFeedback([addedFeedback, ...pastFeedback])

      // Reset form
      setRating(0)
      setFeedbackText("")

      // Show success notification
      setNotification({
        message: "Thank you for your feedback! We appreciate your professional input.",
        isVisible: true,
      })
    } catch (error) {
      console.error("Error submitting feedback:", error)
      setNotification({
        message: "There was an error submitting your feedback. Please try again.",
        isVisible: true,
      })
    }
  }

  const handleSubmitTestimonial = async () => {
    if (!user) {
      setNotification({ message: "Please sign in to submit a testimonial.", isVisible: true })
      return
    }
    if (!testimonialText.trim()) {
      setNotification({ message: "Please add a testimonial message.", isVisible: true })
      return
    }

    try {
      setSubmittingTestimonial(true)
      const docRef = await addDoc(collection(db, "testimonials"), {
        userId: user?.uid || null,
        userName: user?.displayName || "Anonymous User",
        userRole: "doctor",
        message: testimonialText.trim(),
        createdAt: serverTimestamp(),
        type: "general",
      })

      // Optimistic add
      setTestimonials((prev) => [
        {
          id: docRef.id,
          userId: user?.uid || null,
          userName: user?.displayName || "Anonymous User",
          userRole: "doctor",
          message: testimonialText.trim(),
          createdAt: new Date(),
          type: "general",
          userProfile: user?.photoURL || null,
          specialty: user?.specialty || user?.specialization || null,
        },
        ...prev,
      ])
      setActiveTab("testimonials")
      setTestimonialText("")
      setNotification({
        message: "Published! If you don't see it, refresh the page.",
        isVisible: true,
      })
    } catch (error) {
      console.error("Error submitting testimonial:", error)
      setNotification({
        message: "There was an error submitting your testimonial. Please try again.",
        isVisible: true,
      })
    } finally {
      setSubmittingTestimonial(false)
    }
  }

  const handleStartEdit = (item) => {
    setEditingTestimonialId(item.id)
    setEditingText(item.message || "")
  }

  const handleCancelEdit = () => {
    setEditingTestimonialId(null)
    setEditingText("")
  }

  const handleSaveEdit = async (id) => {
    if (!editingText.trim()) {
      setNotification({ message: "Please add a testimonial message.", isVisible: true })
      return
    }
    try {
      // Find the testimonial to get userId for the update
      const testimonial = testimonials.find((t) => t.id === id)
      if (!testimonial) {
        setNotification({ message: "Testimonial not found.", isVisible: true })
        return
      }
      
      // Include userId in update to satisfy Firestore rules
      await updateDoc(doc(db, "testimonials", id), {
        userId: testimonial.userId, // Preserve userId
        message: editingText.trim(),
        updatedAt: serverTimestamp(),
      })
      setTestimonials((prev) =>
        prev.map((t) => (t.id === id ? { ...t, message: editingText.trim(), updatedAt: new Date() } : t))
      )
      handleCancelEdit()
      setNotification({ message: "Testimonial updated.", isVisible: true })
    } catch (error) {
      console.error("Error updating testimonial:", error)
      setNotification({ message: "Error updating testimonial. Please try again.", isVisible: true })
    }
  }

  const handleDeleteTestimonial = async (id) => {
    try {
      setDeletingTestimonialId(id)
      await deleteDoc(doc(db, "testimonials", id))
      setTestimonials((prev) => prev.filter((t) => t.id !== id))
      setNotification({ message: "Testimonial deleted.", isVisible: true })
    } catch (error) {
      console.error("Error deleting testimonial:", error)
      setNotification({ message: "Error deleting testimonial. Please try again.", isVisible: true })
    } finally {
      setDeletingTestimonialId(null)
    }
  }

  const handleDeleteFeedback = async (id) => {
    try {
      setDeleteLoading(true)
      await deleteFeedback(id)
      setPastFeedback(pastFeedback.filter((feedback) => feedback.id !== id))
      setNotification({
        message: "Feedback deleted successfully",
        isVisible: true,
      })
      setDeleteConfirm(null)
    } catch (error) {
      console.error("Error deleting feedback:", error)
      setNotification({
        message: "There was an error deleting your feedback. Please try again.",
        isVisible: true,
      })
    } finally {
      setDeleteLoading(false)
    }
  }

  // Render stars for rating
  const renderStars = (rating) => {
    if (rating === null || rating === undefined) return <span className="text-xs text-drift-gray">No rating</span>

    return (
      <div className="flex">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-4 w-4 ${star <= rating ? "text-amber-400 fill-amber-400" : "text-drift-gray"}`}
          />
        ))}
      </div>
    )
  }

  // Get admin profile picture
  const getAdminProfilePic = (adminId) => {
    if (!adminId || !adminProfiles[adminId]) {
      return "/admin-interface.png" // Default admin image if no adminId or profile
    }

    // Check if photoURL exists and is a valid URL
    const photoURL = adminProfiles[adminId]?.photoURL
    if (!photoURL || typeof photoURL !== "string") {
      return "/admin-interface.png"
    }

    // Ensure URL starts with http:// or https://
    if (!photoURL.startsWith("http://") && !photoURL.startsWith("https://")) {
      console.log(`Invalid admin photo URL format: ${photoURL}`)
      return "/admin-interface.png"
    }

    return photoURL
  }

  // Get admin name
  const getAdminName = (adminId) => {
    if (adminProfiles[adminId]?.displayName) {
      return adminProfiles[adminId].displayName
    }
    return "Admin"
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header with gradient background */}
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 p-6 text-white shadow-md mb-4">
        {/* Decorative elements */}
        <div className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-white/10"></div>
        <div className="absolute -bottom-24 -left-24 h-80 w-80 rounded-full bg-white/10"></div>
        <div className="absolute -bottom-32 right-16 h-48 w-48 rounded-full bg-white/5"></div>

        <div className="relative z-10">
          <h1 className="text-2xl font-bold text-white md:text-3xl">Feedback & Support</h1>
          <p className="mt-1 text-white/90">
            Share your experience or report issues to help us improve the platform for healthcare providers
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex justify-center">
        <div className="flex p-1 bg-earth-beige/20 rounded-full shadow-sm">
          <button
            onClick={() => setActiveTab("feedback")}
            className={`relative px-5 py-2.5 pr-7 text-sm font-medium rounded-full transition-all duration-200 flex items-center gap-2 ${
              activeTab === "feedback" ? "bg-soft-amber text-white shadow-sm" : "text-drift-gray hover:text-graphite"
            }`}
          >
            <span>Feedback</span>
            {pastFeedback.length > 0 && (
              <span className={`inline-flex items-center justify-center min-w-[22px] h-5 px-1.5 rounded-full text-xs font-semibold ${
                activeTab === "feedback" 
                  ? "bg-white/20 text-white border border-white/30" 
                  : "bg-soft-amber text-white"
              }`}>
                {pastFeedback.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab("testimonials")}
            className={`relative px-5 py-2.5 pr-7 text-sm font-medium rounded-full transition-all duration-200 flex items-center gap-2 ${
              activeTab === "testimonials" ? "bg-soft-amber text-white shadow-sm" : "text-drift-gray hover:text-graphite"
            }`}
          >
            <span>Testimonials</span>
            {testimonials.length > 0 && (
              <span className={`inline-flex items-center justify-center min-w-[22px] h-5 px-1.5 rounded-full text-xs font-semibold ${
                activeTab === "testimonials" 
                  ? "bg-white/20 text-white border border-white/30" 
                  : "bg-soft-amber text-white"
              }`}>
                {testimonials.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {activeTab === "feedback" && (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Feedback Form */}
        <div className="md:col-span-2">
          <div className="bg-white rounded-lg shadow-sm border border-earth-beige p-6">
            <h2 className="text-xl font-semibold text-graphite mb-4">Submit Feedback</h2>

            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-graphite mb-2">Feedback Type</label>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    className={`px-4 py-2 rounded-md text-sm ${
                      feedbackType === "general"
                        ? "bg-soft-amber text-white"
                        : "bg-pale-stone text-drift-gray hover:bg-earth-beige"
                    }`}
                    onClick={() => setFeedbackType("general")}
                  >
                    General Feedback
                  </button>
                  <button
                    type="button"
                    className={`px-4 py-2 rounded-md text-sm ${
                      feedbackType === "platform"
                        ? "bg-soft-amber text-white"
                        : "bg-pale-stone text-drift-gray hover:bg-earth-beige"
                    }`}
                    onClick={() => setFeedbackType("platform")}
                  >
                    Platform Feedback
                  </button>
                  <button
                    type="button"
                    className={`px-4 py-2 rounded-md text-sm ${
                      feedbackType === "technical"
                        ? "bg-soft-amber text-white"
                        : "bg-pale-stone text-drift-gray hover:bg-earth-beige"
                    }`}
                    onClick={() => setFeedbackType("technical")}
                  >
                    Technical Issue
                  </button>
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-graphite mb-2">Rating</label>
                <div className="flex">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      className="p-1"
                    >
                      <Star
                        className={`h-8 w-8 ${
                          star <= (hoverRating || rating) ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              <div className="mb-4">
                <label htmlFor="feedback" className="block text-sm font-medium text-graphite mb-2">
                  Your Feedback
                </label>
                <textarea
                  id="feedback"
                  rows="4"
                  value={feedbackText}
                  onChange={(e) => setFeedbackText(e.target.value)}
                  placeholder={
                    feedbackType === "technical"
                      ? "Please describe the issue you're experiencing in detail..."
                      : "Share your professional insights and suggestions..."
                  }
                  className="w-full p-3 border border-earth-beige rounded-md focus:outline-none focus:ring-2 focus:ring-soft-amber"
                ></textarea>
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  className="inline-flex items-center px-4 py-2 bg-soft-amber text-white rounded-md hover:bg-soft-amber/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-soft-amber"
                >
                  <Send className="h-4 w-4 mr-2" />
                  Submit Feedback
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Support & Past Feedback */}
        <div className="md:col-span-1">
          <div className="bg-white rounded-lg shadow-sm border border-earth-beige p-6 mb-6">
            <h2 className="text-xl font-semibold text-graphite mb-4">Provider Feedback Guidelines</h2>
            <p className="text-drift-gray mb-4">
              Your professional insights help us improve our platform for all healthcare providers:
            </p>
            <ul className="space-y-2 text-drift-gray">
              <li className="flex items-start">
                <div className="bg-soft-amber/20 p-1 rounded-full mr-2 mt-0.5">
                  <Star className="h-3 w-3 text-soft-amber" />
                </div>
                <span>Share your clinical workflow experiences</span>
              </li>
              <li className="flex items-start">
                <div className="bg-soft-amber/20 p-1 rounded-full mr-2 mt-0.5">
                  <Star className="h-3 w-3 text-soft-amber" />
                </div>
                <span>Suggest features that would enhance patient care</span>
              </li>
              <li className="flex items-start">
                <div className="bg-soft-amber/20 p-1 rounded-full mr-2 mt-0.5">
                  <Star className="h-3 w-3 text-soft-amber" />
                </div>
                <span>Provider feedback is prioritized for platform improvements</span>
              </li>
            </ul>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-earth-beige p-6">
            <h2 className="text-xl font-semibold text-graphite mb-4">Your Past Feedback</h2>
            {loading ? (
              <div className="flex justify-center py-6">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-soft-amber"></div>
              </div>
            ) : pastFeedback.length > 0 ? (
              <div className="space-y-4">
                {pastFeedback.map((feedback) => (
                  <div key={feedback.id} className="border-b border-earth-beige pb-4 last:border-0">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center">
                        <div className="relative h-10 w-10 rounded-full overflow-hidden mr-3 bg-earth-beige flex-shrink-0">
                          <ProfileImage
                            src={user?.photoURL}
                            alt={user?.displayName || "Doctor"}
                            className="h-full w-full"
                            role="doctor"
                          />
                        </div>
                        <div>
                          <span className="text-sm font-medium text-graphite">
                            {feedback.type.charAt(0).toUpperCase() + feedback.type.slice(1)} Feedback
                          </span>
                          <div className="flex mt-1">{renderStars(feedback.rating)}</div>
                        </div>
                      </div>
                      <div className="flex items-center">
                        <span className="text-xs text-drift-gray mr-2">{feedback.date}</span>
                        {deleteConfirm === feedback.id ? (
                          <div className="flex items-center bg-red-50 p-1 rounded-md">
                            <span className="text-xs text-red-600 mr-2">Delete?</span>
                            <button
                              onClick={() => handleDeleteFeedback(feedback.id)}
                              className="text-white bg-red-500 hover:bg-red-600 rounded-full p-1 mr-1"
                              aria-label="Confirm delete"
                              disabled={deleteLoading}
                            >
                              {deleteLoading ? (
                                <div className="animate-spin h-4 w-4 border-2 border-white rounded-full"></div>
                              ) : (
                                <Check className="h-3 w-3" />
                              )}
                            </button>
                            <button
                              onClick={() => setDeleteConfirm(null)}
                              className="text-white bg-gray-400 hover:bg-gray-500 rounded-full p-1"
                              aria-label="Cancel delete"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setDeleteConfirm(feedback.id)}
                            className="text-drift-gray hover:text-red-500"
                            aria-label="Delete feedback"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </div>
                    <p className="text-sm text-graphite mb-2">{feedback.message}</p>

                    {/* Sentiment Analysis */}
                    {feedback.status === "responded" && feedback.response && (
                      <div className="mt-2 pl-3 border-l-2 border-soft-amber">
                        <div className="flex items-center mb-2">
                          <div className="relative h-8 w-8 rounded-full overflow-hidden mr-2 bg-earth-beige flex-shrink-0">
                            <ProfileImage
                              userId={feedback.respondedBy}
                              src={getAdminProfilePic(feedback.respondedBy)}
                              alt={getAdminName(feedback.respondedBy)}
                              className="h-full w-full"
                              role="admin"
                            />
                          </div>
                          <p className="text-xs font-medium text-soft-amber">
                            Response from {getAdminName(feedback.respondedBy)}:
                          </p>
                        </div>
                        <p className="text-sm text-drift-gray">{feedback.response}</p>
                      </div>
                    )}

                    <div className="mt-2 flex items-center">
                      <span
                        className={`text-xs px-2 py-1 rounded-full ${
                          feedback.status === "responded"
                            ? "bg-green-100 text-green-700"
                            : "bg-yellow-100 text-yellow-700"
                        }`}
                      >
                        {feedback.status === "responded" ? "Responded" : "Pending"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6">
                <AlertCircle className="h-8 w-8 text-drift-gray mx-auto mb-2" />
                <p className="text-drift-gray">You haven't submitted any feedback yet.</p>
              </div>
            )}
          </div>
        </div>
      </div>
      )}

      {activeTab === "testimonials" && (
        <div className="bg-gradient-to-br from-cream via-white to-amber-50 rounded-xl shadow-md border border-earth-beige/70 p-6">
          <div className="flex flex-col gap-2 mb-4">
            <p className="text-xs uppercase tracking-[0.15em] text-soft-amber font-semibold">Community Voices</p>
            <h2 className="text-2xl font-bold text-graphite">Global Testimonials</h2>
            <p className="text-sm text-drift-gray">
              All published testimonials appear here — positive stories from patients and doctors.
            </p>
          </div>

          <div className="mb-6 space-y-3 rounded-lg border border-earth-beige bg-white/70 p-4 shadow-sm">
            <div className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-soft-amber/15 text-soft-amber font-semibold">★</div>
              <div>
                <p className="text-sm font-semibold text-graphite">Share a testimonial</p>
                <p className="text-xs text-drift-gray">Submissions are shown to everyone.</p>
              </div>
            </div>
            <textarea
              rows="3"
              value={testimonialText}
              onChange={(e) => setTestimonialText(e.target.value)}
              className="w-full rounded-lg border border-earth-beige bg-white p-3 text-sm text-graphite focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 shadow-inner"
              placeholder="Share how Smart Care helped you..."
            />
            <div className="flex justify-end">
              <button
                onClick={handleSubmitTestimonial}
                disabled={submittingTestimonial}
                className="inline-flex items-center gap-2 rounded-lg bg-soft-amber px-4 py-2 text-sm font-semibold text-white transition hover:bg-amber-600 disabled:opacity-60"
              >
                {submittingTestimonial ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                Submit Testimonial
              </button>
            </div>
          </div>

          {testimonials.length === 0 ? (
            <div className="rounded-lg border border-earth-beige bg-white/70 p-4 text-sm text-drift-gray shadow-sm">
              No testimonials yet. Be the first to share a story!
            </div>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {testimonials.map((item) => {
                const roleLabel =
                  item.userRole === "doctor"
                    ? item.specialty
                      ? `Doctor • ${item.specialty}`
                      : "Doctor"
                    : "Patient"

                const dateLabel =
                  item.date ||
                  (item.createdAt?.toDate?.() ? item.createdAt.toDate().toLocaleDateString() : "—")

                return (
                  <div
                    key={item.id}
                    className="group relative overflow-hidden rounded-xl border border-earth-beige bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-soft-amber/8 via-transparent to-amber-200/10 opacity-0 group-hover:opacity-100 transition" />
                    <div className="p-5 space-y-3 relative z-10">
                      <div className="flex items-center gap-3">
                        <div className="h-12 w-12 overflow-hidden rounded-full bg-earth-beige shadow-inner">
                          <ProfileImage
                            src={item.userProfile}
                            alt={item.userName || "User"}
                            className="h-full w-full"
                            role={item.userRole}
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-graphite truncate">{item.userName || "User"}</p>
                          <div className="flex items-center gap-2 text-[12px] text-drift-gray">
                            <span className="rounded-full bg-earth-beige/40 px-2 py-0.5 font-medium text-graphite capitalize">
                              {roleLabel}
                            </span>
                          </div>
                        </div>
                        <div className="ml-auto flex items-center gap-2">
                          <span className="flex items-center gap-1 rounded-full bg-soft-amber/15 px-3 py-1 text-xs text-amber-700 font-semibold">
                            Thanks!
                          </span>
                          {item.userId === user?.uid && (
                            <div className="flex items-center gap-2 text-xs">
                              {editingTestimonialId === item.id ? (
                                <>
                                  <button
                                    onClick={() => handleSaveEdit(item.id)}
                                    className="rounded-full bg-soft-amber text-white px-3 py-1 hover:bg-amber-600"
                                  >
                                    Save
                                  </button>
                                  <button
                                    onClick={handleCancelEdit}
                                    className="rounded-full bg-earth-beige text-graphite px-3 py-1 hover:bg-earth-beige/80"
                                  >
                                    Cancel
                                  </button>
                                </>
                              ) : (
                                <>
                                  <button
                                    onClick={() => handleStartEdit(item)}
                                    className="text-graphite hover:text-amber-600"
                                  >
                                    Edit
                                  </button>
                                  <button
                                    onClick={() => handleDeleteTestimonial(item.id)}
                                    disabled={deletingTestimonialId === item.id}
                                    className="text-red-500 hover:text-red-600 disabled:opacity-60"
                                  >
                                    {deletingTestimonialId === item.id ? "Deleting..." : "Delete"}
                                  </button>
                                </>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                      {editingTestimonialId === item.id ? (
                        <textarea
                          rows="3"
                          value={editingText}
                          onChange={(e) => setEditingText(e.target.value)}
                          className="w-full rounded-lg border border-earth-beige bg-white p-3 text-sm text-graphite focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 shadow-inner"
                        />
                      ) : (
                        <p className="text-sm leading-relaxed text-graphite line-clamp-4">
                          {item.message || "No message provided."}
                        </p>
                      )}
                      <div className="flex items-center justify-between text-[11px] text-drift-gray">
                        <span>{dateLabel}</span>
                        <span className="rounded-full bg-cream px-2 py-1 text-[11px] capitalize text-deep-forest border border-earth-beige/70">
                          {item.type || "general"}
                        </span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* Success Notification */}
      <SuccessNotification
        message={notification.message}
        isVisible={notification.isVisible}
        onClose={() => setNotification({ ...notification, isVisible: false })}
        isValidation={
          notification.message === "Please select a rating" ||
          notification.message === "Please provide feedback details" ||
          notification.message === "There was an error deleting your feedback. Please try again."
        }
      />

      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes fadeInUp {
          from { 
            opacity: 0;
            transform: translateY(20px);
          }
          to { 
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes slideDown {
          from { 
            opacity: 0;
            transform: translateY(-10px);
          }
          to { 
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-fadeIn {
          animation: fadeIn 0.5s ease-out;
        }
        
        .animate-slideDown {
          animation: slideDown 0.3s ease-out;
        }
      `}</style>
    </div>
  )
}
