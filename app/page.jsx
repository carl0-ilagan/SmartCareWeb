"use client"

import { useState, useEffect, useRef } from "react"
import { ArrowRight, Calendar, CheckCircle, Clock, MessageSquare, Stethoscope, MapPin, Phone, Mail, Send, CheckCircle2, AlertCircle, Shield, Heart, Smile, ChevronDown, ChevronUp } from "lucide-react"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { TestimonialCard } from "@/components/testimonial-card"
import { getLandingPageContent } from "@/lib/welcome-utils"
import { LoginModal } from "@/components/login-modal"
import { SignupModal } from "@/components/signup-modal"
import { collection, query, where, getDocs, orderBy, limit, onSnapshot, getDoc, doc, addDoc, serverTimestamp } from "firebase/firestore"
import { db } from "@/lib/firebase"

// Contact Form Component
function ContactForm({ contactEmail = "smartcarefamily@gmail.com", brandName = "Smart Care" }) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  })
  const [errors, setErrors] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitStatus, setSubmitStatus] = useState(null) // 'success' | 'error' | null

  const validateForm = () => {
    const newErrors = {}
    
    if (!formData.name.trim()) {
      newErrors.name = "Name is required"
    }
    
    if (!formData.email.trim()) {
      newErrors.email = "Email is required"
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address"
    }
    
    if (!formData.subject.trim()) {
      newErrors.subject = "Subject is required"
    }
    
    if (!formData.message.trim()) {
      newErrors.message = "Message is required"
    } else if (formData.message.trim().length < 10) {
      newErrors.message = "Message must be at least 10 characters"
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: "" }))
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    setIsSubmitting(true)
    setSubmitStatus(null)

    try {
      const response = await fetch("/api/email/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          to: contactEmail,
          from: `${formData.name} <${formData.email}>`, // User's email as "from" address
          replyTo: formData.email, // Set reply-to so admin can reply directly
          subject: `${brandName} Contact Form: ${formData.subject}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #d97706; border-bottom: 2px solid #d97706; padding-bottom: 10px;">
                New Contact Form Submission - ${brandName}
              </h2>
              <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <p><strong>Name:</strong> ${formData.name}</p>
                <p><strong>Email:</strong> <a href="mailto:${formData.email}" style="color: #d97706; text-decoration: none;">${formData.email}</a></p>
                <p><strong>Subject:</strong> ${formData.subject}</p>
              </div>
              <div style="background: #fff; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px;">
                <h3 style="color: #374151; margin-top: 0;">Message:</h3>
                <p style="color: #6b7280; line-height: 1.6; white-space: pre-wrap;">${formData.message}</p>
              </div>
              <p style="color: #9ca3af; font-size: 12px; margin-top: 20px;">
                This message was sent from the ${brandName} contact form. You can reply directly to this email to respond to ${formData.name}.
              </p>
            </div>
          `,
          text: `
New Contact Form Submission

Name: ${formData.name}
Email: ${formData.email}
Subject: ${formData.subject}

Message:
${formData.message}

---
This message was sent from the ${brandName} contact form. You can reply directly to this email to respond to ${formData.name}.
          `,
        }),
      })

      const data = await response.json()

      if (data.success) {
        // Save to Firestore for admin inbox
        try {
          await addDoc(collection(db, "contact_messages"), {
            name: formData.name,
            email: formData.email,
            subject: formData.subject,
            message: formData.message,
            read: false,
            createdAt: serverTimestamp(),
            status: "new",
          })
        } catch (firestoreError) {
          console.error("Error saving to Firestore:", firestoreError)
          // Don't fail the form submission if Firestore save fails
        }

        setSubmitStatus("success")
        setFormData({ name: "", email: "", subject: "", message: "" })
        // Clear status after 5 seconds
        setTimeout(() => setSubmitStatus(null), 5000)
      } else {
        setSubmitStatus("error")
      }
    } catch (error) {
      console.error("Error sending contact form:", error)
      setSubmitStatus("error")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2">
        <div>
          <label htmlFor="name" className="block text-sm font-semibold text-graphite mb-2">
            Your Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            className={`w-full rounded-lg border ${
              errors.name ? "border-red-300" : "border-earth-beige"
            } bg-white px-4 py-3 text-graphite placeholder-drift-gray/60 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20 transition-all`}
            placeholder="John Doe"
          />
          {errors.name && (
            <p className="mt-1 text-sm text-red-500 flex items-center gap-1">
              <AlertCircle className="h-4 w-4" />
              {errors.name}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-semibold text-graphite mb-2">
            Your Email <span className="text-red-500">*</span>
          </label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            className={`w-full rounded-lg border ${
              errors.email ? "border-red-300" : "border-earth-beige"
            } bg-white px-4 py-3 text-graphite placeholder-drift-gray/60 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20 transition-all`}
            placeholder="john@example.com"
          />
          {errors.email && (
            <p className="mt-1 text-sm text-red-500 flex items-center gap-1">
              <AlertCircle className="h-4 w-4" />
              {errors.email}
            </p>
          )}
        </div>
      </div>

      <div>
        <label htmlFor="subject" className="block text-sm font-semibold text-graphite mb-2">
          Subject <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          id="subject"
          name="subject"
          value={formData.subject}
          onChange={handleChange}
            className={`w-full rounded-lg border ${
              errors.subject ? "border-red-300" : "border-earth-beige"
            } bg-white px-4 py-3 text-graphite placeholder-drift-gray/60 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20 transition-all`}
          placeholder="What is this regarding?"
        />
        {errors.subject && (
          <p className="mt-1 text-sm text-red-500 flex items-center gap-1">
            <AlertCircle className="h-4 w-4" />
            {errors.subject}
          </p>
        )}
      </div>

      <div>
        <label htmlFor="message" className="block text-sm font-semibold text-graphite mb-2">
          Your Message <span className="text-red-500">*</span>
        </label>
        <textarea
          id="message"
          name="message"
          value={formData.message}
          onChange={handleChange}
          rows={5}
            className={`w-full rounded-lg border ${
              errors.message ? "border-red-300" : "border-earth-beige"
            } bg-white px-4 py-3 text-graphite placeholder-drift-gray/60 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20 resize-none transition-all`}
          placeholder="Tell us how we can help you..."
        />
        {errors.message && (
          <p className="mt-1 text-sm text-red-500 flex items-center gap-1">
            <AlertCircle className="h-4 w-4" />
            {errors.message}
          </p>
        )}
      </div>

      {/* Submit Status Messages */}
      {submitStatus === "success" && (
        <div className="rounded-lg bg-green-50 border border-green-200 p-4 flex items-center gap-3">
          <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0" />
          <div>
            <p className="text-sm font-semibold text-green-800">Message sent successfully!</p>
            <p className="text-xs text-green-600">We'll get back to you within 24 hours.</p>
          </div>
        </div>
      )}

      {submitStatus === "error" && (
        <div className="rounded-lg bg-red-50 border border-red-200 p-4 flex items-center gap-3">
          <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
          <div>
            <p className="text-sm font-semibold text-red-800">Failed to send message</p>
            <p className="text-xs text-red-600">Please try again or contact us directly.</p>
          </div>
        </div>
      )}

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full inline-flex h-11 sm:h-12 items-center justify-center rounded-lg bg-gradient-to-r from-amber-500 to-amber-400 px-4 sm:px-5 py-2.5 text-sm font-semibold text-white shadow-md hover:shadow-lg hover:from-amber-600 hover:to-amber-500 transition-all transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 mt-2"
      >
        {isSubmitting ? (
          <>
            <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
            Sending...
          </>
        ) : (
          <>
            Send Message
            <Send className="ml-2 h-5 w-5" />
          </>
        )}
      </button>
    </form>
  )
}

// Testimonials Carousel Component with Auto-scroll
function TestimonialsCarousel({ testimonials }) {
  const [expandedTestimonials, setExpandedTestimonials] = useState(new Set())
  const [currentPage, setCurrentPage] = useState(0)
  const itemsPerPage = 3
  
  // Limit to 6 testimonials max
  const limitedTestimonials = testimonials.slice(0, 6)
  const totalPages = Math.ceil(limitedTestimonials.length / itemsPerPage)
  const currentTestimonials = limitedTestimonials.slice(
    currentPage * itemsPerPage,
    (currentPage + 1) * itemsPerPage
  )
  
  const toggleExpand = (testimonialId, index) => {
    const key = testimonialId || `testimonial-${index}`
    setExpandedTestimonials((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(key)) {
        newSet.delete(key)
      } else {
        newSet.add(key)
      }
      return newSet
    })
  }
  
  const isExpanded = (testimonialId, index) => {
    const key = testimonialId || `testimonial-${index}`
    return expandedTestimonials.has(key)
  }
  
  const isLongText = (text) => {
    // Approximate: if text is longer than ~200 characters, it's likely more than 6 lines
    return text && text.length > 200
  }

  const goToPage = (page) => {
    setCurrentPage(page)
    // Reset expanded testimonials when changing page
    setExpandedTestimonials(new Set())
  }

  return (
    <div className="relative w-full max-w-7xl mx-auto">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        {currentTestimonials.map((testimonial, index) => {
          const isDoctor = testimonial.userRole === "doctor"
          const globalIndex = currentPage * itemsPerPage + index

          // Doctor Card - Professional/Blue
          if (isDoctor) {
            return (
              <div
                key={testimonial.id || `doctor-${globalIndex}`}
                className="w-full"
              >
                <div className="group flex flex-col rounded-xl border border-blue-200/50 bg-white p-4 sm:p-6 shadow-sm hover:shadow-lg hover:border-blue-300/70 transition-all duration-300 h-full hover:-translate-y-1 bg-gradient-to-br from-white to-blue-50/20">
                  {/* Doctor Header */}
                  <div className="flex items-start gap-2 sm:gap-3 mb-3 sm:mb-4">
                    <div className="h-12 w-12 sm:h-14 sm:w-14 overflow-hidden rounded-full ring-2 ring-blue-200/50 group-hover:ring-blue-400/60 transition-all duration-300 shadow-sm flex-shrink-0">
                      {testimonial.avatarSrc ? (
                        <img
                          src={testimonial.avatarSrc}
                          alt={testimonial.name}
                          className="h-full w-full object-cover"
                          onError={(e) => {
                            e.target.src = "/placeholder.svg"
                          }}
                        />
                      ) : (
                        <div className="h-full w-full bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center text-blue-600 font-semibold text-xl">
                          {testimonial.name?.charAt(0)?.toUpperCase() || "D"}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 sm:gap-3 mb-1 flex-wrap">
                        <p className="font-bold text-graphite text-sm sm:text-base">{testimonial.name}</p>
                        <span className="inline-flex items-center gap-1 px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full bg-blue-100 text-blue-700 text-[10px] sm:text-xs font-semibold flex-shrink-0">
                          <Shield className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                          <span className="hidden sm:inline">Verified Doctor</span>
                          <span className="sm:hidden">Verified</span>
                        </span>
                      </div>
                      {testimonial.specialty ? (
                        <p className="text-xs sm:text-sm font-semibold text-blue-600 mb-1">
                          {testimonial.specialty}
                        </p>
                      ) : (
                        <p className="text-xs sm:text-sm font-medium text-blue-600 mb-1">
                          Doctor
                        </p>
                      )}
                      {testimonial.experience && (
                        <p className="text-[10px] sm:text-xs text-drift-gray">
                          {testimonial.experience} experience
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Testimonial Text with Read More */}
                  <div className="mb-3 sm:mb-4 flex-1">
                    <div className="relative">
                      <p
                        className={`text-drift-gray text-[13px] sm:text-[15px] leading-relaxed group-hover:text-graphite transition-all duration-300 ${
                          !isExpanded(testimonial.id, globalIndex) && isLongText(testimonial.testimonial)
                            ? 'line-clamp-6'
                            : ''
                        }`}
                        style={{
                          lineHeight: '1.6',
                        }}
                      >
                        "{testimonial.testimonial}"
                      </p>
                      {isLongText(testimonial.testimonial) && (
                        <button
                          onClick={() => toggleExpand(testimonial.id, globalIndex)}
                          className="mt-2 text-blue-600 hover:text-blue-700 text-xs sm:text-sm font-medium flex items-center gap-1 transition-colors duration-200"
                        >
                          {isExpanded(testimonial.id, globalIndex) ? (
                            <>
                              <span>Read less</span>
                              <ChevronUp className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                            </>
                          ) : (
                            <>
                              <span>Read more</span>
                              <ChevronDown className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Date Badge */}
                  {testimonial.createdAt && (
                    <div className="mt-auto pt-2 sm:pt-3 border-t border-blue-200/30">
                      <div className="flex items-center gap-1.5 text-[10px] sm:text-xs text-drift-gray">
                        <Clock className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                        {testimonial.createdAt?.toDate 
                          ? (() => {
                              const date = testimonial.createdAt.toDate()
                              const now = new Date()
                              const diffTime = Math.abs(now - date)
                              const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
                              if (diffDays === 1) return "1 day ago"
                              if (diffDays < 7) return `${diffDays} days ago`
                              if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`
                              return `${Math.floor(diffDays / 30)} months ago`
                            })()
                          : "Recently"}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )
          }
          
          // Patient Card - Friendly/Green-Teal
          return (
            <div
              key={testimonial.id || `patient-${globalIndex}`}
              className="w-full"
            >
              <div className="group flex flex-col rounded-xl border border-teal-200/50 bg-white p-4 sm:p-6 shadow-sm hover:shadow-lg hover:border-teal-300/70 transition-all duration-300 h-full hover:-translate-y-1 bg-gradient-to-br from-white to-teal-50/20">
                {/* Patient Header */}
                <div className="flex items-start gap-2 sm:gap-3 mb-3 sm:mb-4">
                  <div className="h-12 w-12 sm:h-14 sm:w-14 overflow-hidden rounded-full ring-2 ring-teal-200/50 group-hover:ring-teal-400/60 transition-all duration-300 shadow-sm flex-shrink-0">
                    {testimonial.avatarSrc ? (
                      <img
                        src={testimonial.avatarSrc}
                        alt={testimonial.name}
                        className="h-full w-full object-cover"
                        onError={(e) => {
                          e.target.src = "/placeholder.svg"
                        }}
                      />
                    ) : (
                      <div className="h-full w-full bg-gradient-to-br from-teal-100 to-teal-200 flex items-center justify-center text-teal-600 font-semibold text-xl">
                        {testimonial.name?.charAt(0)?.toUpperCase() || "P"}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Smile className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-teal-500 flex-shrink-0" />
                      <p className="font-bold text-graphite text-sm sm:text-base">{testimonial.name?.split(' ')[0] || testimonial.name}</p>
                    </div>
                    <p className="text-xs sm:text-sm font-medium text-teal-600 mb-1">Patient</p>
                    {testimonial.location && (
                      <p className="text-[10px] sm:text-xs text-drift-gray flex items-center gap-1">
                        <MapPin className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                        {testimonial.location.split(',')[0]}
                      </p>
                    )}
                  </div>
                </div>

                {/* Testimonial Text with Read More */}
                <div className="mb-3 sm:mb-4 flex-1">
                  <div className="relative">
                    <p
                      className={`text-drift-gray text-[13px] sm:text-[15px] leading-relaxed group-hover:text-graphite transition-all duration-300 ${
                        !isExpanded(testimonial.id, globalIndex) && isLongText(testimonial.testimonial)
                          ? 'line-clamp-6'
                          : ''
                      }`}
                      style={{
                        lineHeight: '1.6',
                      }}
                    >
                      "{testimonial.testimonial}"
                    </p>
                    {isLongText(testimonial.testimonial) && (
                      <button
                        onClick={() => toggleExpand(testimonial.id, globalIndex)}
                        className="mt-2 text-teal-600 hover:text-teal-700 text-xs sm:text-sm font-medium flex items-center gap-1 transition-colors duration-200"
                      >
                        {isExpanded(testimonial.id, globalIndex) ? (
                          <>
                            <span>Read less</span>
                            <ChevronUp className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                          </>
                        ) : (
                          <>
                            <span>Read more</span>
                            <ChevronDown className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>

                {/* Date Badge */}
                {testimonial.createdAt && (
                  <div className="mt-auto pt-2 sm:pt-3 border-t border-teal-200/30">
                    <div className="flex items-center gap-1.5 text-[10px] sm:text-xs text-drift-gray">
                      <Clock className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                      {testimonial.createdAt?.toDate 
                        ? (() => {
                            const date = testimonial.createdAt.toDate()
                            const now = new Date()
                            const diffTime = Math.abs(now - date)
                            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
                            if (diffDays === 1) return "1 day ago"
                            if (diffDays < 7) return `${diffDays} days ago`
                            if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`
                            return `${Math.floor(diffDays / 30)} months ago`
                          })()
                        : "Recently"}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
      
      {/* Pagination Indicators */}
      {limitedTestimonials.length > itemsPerPage && (
        <div className="flex items-center justify-center gap-3 sm:gap-4 mt-6">
          <span className="text-xs sm:text-sm text-drift-gray font-medium">
            {limitedTestimonials.length} {limitedTestimonials.length === 1 ? 'Testimonial' : 'Testimonials'}
          </span>
          <div className="flex items-center gap-1.5 sm:gap-2">
            {Array.from({ length: totalPages }).map((_, pageIndex) => (
              <button
                key={pageIndex}
                onClick={() => goToPage(pageIndex)}
                className={`transition-all duration-300 ${
                  currentPage === pageIndex
                    ? 'w-6 sm:w-8 h-2 bg-soft-amber rounded-full'
                    : 'w-2 h-2 bg-earth-beige rounded-full hover:bg-amber-300'
                }`}
                aria-label={`Go to page ${pageIndex + 1}`}
              />
            ))}
          </div>
          {totalPages > 1 && (
            <div className="flex items-center gap-1 text-xs sm:text-sm text-drift-gray">
              <span>{currentPage + 1}</span>
              <span>/</span>
              <span>{totalPages}</span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default function HomePage() {
  const [showLoginModal, setShowLoginModal] = useState(false)
  const [showSignupModal, setShowSignupModal] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [testimonials, setTestimonials] = useState([])
  const [loadingTestimonials, setLoadingTestimonials] = useState(true)
  const [loadingContent, setLoadingContent] = useState(true)
  const defaultBranding = {
    name: "Smart Care",
    tagline: "Your Health, One Click Away",
    description:
      "Connecting patients with healthcare professionals for virtual consultations, prescription management, and personalized care.",
    logoUrl: "",
    faviconUrl: "/SmartCare.png?v=2",
    contact: {
      address: "123 Healthcare Avenue, Medical District, CA 90210",
      phone: "+1 (555) 123-4567",
      email: "contact@smartcare.com",
      mapUrl: "",
    },
    footer: {
      description:
        "Smart Care connects patients with healthcare professionals for virtual consultations, prescription management, and personalized care.",
      note: "All rights reserved.",
      socials: {
        facebook: "",
        twitter: "",
        instagram: "",
      },
    },
  }
  const [landingContent, setLandingContent] = useState({
    branding: defaultBranding,
    hero: {
      title: "Your Health, One Click Away",
      description:
        "Smart Care connects you with healthcare professionals for virtual consultations, prescription management, and personalized care from the comfort of your home.",
      imageUrl: "/placeholder.svg?height=400&width=600",
    },
    features: [
      {
        icon: "MessageSquare",
        title: "Virtual Consultations",
        description: "Connect with healthcare professionals from the comfort of your home via secure video calls.",
      },
      {
        icon: "Calendar",
        title: "Easy Scheduling",
        description: "Book appointments with just a few clicks and receive instant confirmations.",
      },
      {
        icon: "Clock",
        title: "24/7 Support",
        description: "Access medical advice anytime with our round-the-clock healthcare support.",
      },
      {
        icon: "CheckCircle",
        title: "Secure & Private",
        description: "Your health information is protected with industry-leading security measures.",
      },
    ],
    howItWorks: {
      title: "How It Works",
      description:
        "Getting started with Smart Care is simple. Follow these steps to access quality healthcare from anywhere.",
    },
    testimonials: {
      title: "What Our Users Say",
      description: "Hear from patients and healthcare providers who have experienced the benefits of Smart Care.",
    },
    cta: {
      title: "Ready to Transform Your Healthcare Experience?",
      description: "Join thousands of satisfied users who have made Smart Care their go-to healthcare solution.",
    },
    forDoctors: {
      title: "For Healthcare Providers",
      description:
        "Smart Care offers a streamlined platform for healthcare providers to connect with patients, manage appointments, and provide virtual care.",
      imageUrl: "/placeholder.svg?height=400&width=600",
      benefits: [
        "Expand your practice beyond geographical limitations",
        "Reduce administrative burden with our intuitive platform",
        "Access patient records securely from anywhere",
        "Flexible scheduling to fit your availability",
      ],
    },
  })

  // Load landing page content with real-time updates
  useEffect(() => {
    setLoadingContent(true)
    const landingDocRef = doc(db, "system", "landing_page")
    
    // Set up real-time listener for landing page content
    const unsubscribe = onSnapshot(
      landingDocRef,
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data()
          const defaultContent = {
            branding: {
              name: "Smart Care",
              tagline: "Your Health, One Click Away",
              description:
                "Connecting patients with healthcare professionals for virtual consultations, prescription management, and personalized care.",
              logoUrl: "",
              faviconUrl: "/SmartCare.png?v=2",
              contact: {
                address: "123 Healthcare Avenue, Medical District, CA 90210",
                phone: "+1 (555) 123-4567",
                email: "contact@smartcare.com",
              },
              footer: {
                description:
                  "Smart Care connects patients with healthcare professionals for virtual consultations, prescription management, and personalized care.",
                note: "All rights reserved.",
                socials: {
                  facebook: "",
                  twitter: "",
                  instagram: "",
                },
              },
            },
            hero: {
              title: "Your Health, One Click Away",
              description:
                "Smart Care connects you with healthcare professionals for virtual consultations, prescription management, and personalized care from the comfort of your home.",
              imageUrl: "/placeholder.svg?height=400&width=600",
            },
            features: [
              {
                icon: "MessageSquare",
                title: "Virtual Consultations",
                description: "Connect with healthcare professionals from the comfort of your home via secure video calls.",
              },
              {
                icon: "Calendar",
                title: "Easy Scheduling",
                description: "Book appointments with just a few clicks and receive instant confirmations.",
              },
              {
                icon: "Clock",
                title: "24/7 Support",
                description: "Access medical advice anytime with our round-the-clock healthcare support.",
              },
              {
                icon: "CheckCircle",
                title: "Secure & Private",
                description: "Your health information is protected with industry-leading security measures.",
              },
            ],
            howItWorks: {
              title: "How It Works",
              description:
                "Getting started with Smart Care is simple. Follow these steps to access quality healthcare from anywhere.",
            },
            testimonials: {
              title: "What Our Users Say",
              description: "Hear from patients and healthcare providers who have experienced the benefits of Smart Care.",
            },
            cta: {
              title: "Ready to Transform Your Healthcare Experience?",
              description: "Join thousands of satisfied users who have made Smart Care their go-to healthcare solution.",
            },
            forDoctors: {
              title: "For Healthcare Providers",
              description:
                "Smart Care offers a streamlined platform for healthcare providers to connect with patients, manage appointments, and provide virtual care.",
              imageUrl: "/placeholder.svg?height=400&width=600",
              benefits: [
                "Expand your practice beyond geographical limitations",
                "Reduce administrative burden with our intuitive platform",
                "Access patient records securely from anywhere",
                "Flexible scheduling to fit your availability",
              ],
            },
          }
          
          setLandingContent({
            ...defaultContent,
            ...data,
            branding: {
              ...defaultContent.branding,
              ...(data.branding || {}),
              contact: {
                ...defaultBranding.contact,
                ...(data.branding?.contact || {}),
                // Explicitly include mapUrl from Firestore
                mapUrl: data.branding?.contact?.mapUrl || "",
              },
              footer: {
                ...defaultContent.branding.footer,
                ...(data.branding?.footer || {}),
                socials: {
                  ...defaultContent.branding.footer.socials,
                  ...(data.branding?.footer?.socials || {}),
                },
              },
            },
          })
        } else {
          // If document doesn't exist, create it with defaults
          const defaultContent = {
            branding: {
              name: "Smart Care",
              tagline: "Your Health, One Click Away",
              description:
                "Connecting patients with healthcare professionals for virtual consultations, prescription management, and personalized care.",
              logoUrl: "",
              faviconUrl: "/SmartCare.png?v=2",
              contact: {
                address: "123 Healthcare Avenue, Medical District, CA 90210",
                phone: "+1 (555) 123-4567",
                email: "contact@smartcare.com",
                mapUrl: "",
              },
              footer: {
                description:
                  "Smart Care connects patients with healthcare professionals for virtual consultations, prescription management, and personalized care.",
                note: "All rights reserved.",
                socials: {
                  facebook: "",
                  twitter: "",
                  instagram: "",
                },
              },
            },
            hero: {
              title: "Your Health, One Click Away",
              description:
                "Smart Care connects you with healthcare professionals for virtual consultations, prescription management, and personalized care from the comfort of your home.",
              imageUrl: "/placeholder.svg?height=400&width=600",
            },
            features: [
              {
                icon: "MessageSquare",
                title: "Virtual Consultations",
                description: "Connect with healthcare professionals from the comfort of your home via secure video calls.",
              },
              {
                icon: "Calendar",
                title: "Easy Scheduling",
                description: "Book appointments with just a few clicks and receive instant confirmations.",
              },
              {
                icon: "Clock",
                title: "24/7 Support",
                description: "Access medical advice anytime with our round-the-clock healthcare support.",
              },
              {
                icon: "CheckCircle",
                title: "Secure & Private",
                description: "Your health information is protected with industry-leading security measures.",
              },
            ],
            howItWorks: {
              title: "How It Works",
              description:
                "Getting started with Smart Care is simple. Follow these steps to access quality healthcare from anywhere.",
            },
            testimonials: {
              title: "What Our Users Say",
              description: "Hear from patients and healthcare providers who have experienced the benefits of Smart Care.",
            },
            cta: {
              title: "Ready to Transform Your Healthcare Experience?",
              description: "Join thousands of satisfied users who have made Smart Care their go-to healthcare solution.",
            },
            forDoctors: {
              title: "For Healthcare Providers",
              description:
                "Smart Care offers a streamlined platform for healthcare providers to connect with patients, manage appointments, and provide virtual care.",
              imageUrl: "/placeholder.svg?height=400&width=600",
              benefits: [
                "Expand your practice beyond geographical limitations",
                "Reduce administrative burden with our intuitive platform",
                "Access patient records securely from anywhere",
                "Flexible scheduling to fit your availability",
              ],
            },
          }
          setLandingContent(defaultContent)
        }
        setLoadingContent(false)
        setMounted(true)
      },
      (error) => {
        console.error("Error loading landing page content:", error)
        setLoadingContent(false)
        setMounted(true)
      }
    )

    // Cleanup listener on unmount
    return () => unsubscribe()
  }, [])

  // Load testimonials for landing page with real-time updates
  useEffect(() => {
    setLoadingTestimonials(true)
    const testimonialsRef = collection(db, "testimonials")
    
    // Query: Only testimonials marked for landing page, published, ordered by newest first, limited to 6
    const q = query(
      testimonialsRef,
      where("showOnLanding", "==", true),
      orderBy("createdAt", "desc"),
      limit(6)
    )

    // Set up real-time listener - automatically updates when testimonials are added/removed/updated
    const unsubscribe = onSnapshot(
      q,
      async (snapshot) => {
        try {
          // Process only published testimonials
          const items = snapshot.docs
            .map((docSnap) => {
              const data = docSnap.data()
              // Only include published testimonials
              if (data.published === false) return null
                return {
                id: docSnap.id,
                userId: data.userId,
                name: data.userName || "Anonymous",
                testimonial: data.message || "",
                avatarSrc: data.userProfile || null,
                userRole: data.userRole,
                specialty: data.specialty,
                createdAt: data.createdAt || docSnap.data().createdAt || null,
              }
            })
            .filter(Boolean) // Remove null items
          
          // Enrich testimonials with user data (photoURL, experience, etc.)
          const enriched = await Promise.all(
            items.map(async (item) => {
              try {
                if (item.userId) {
                  const userDoc = await getDoc(doc(db, "users", item.userId))
                  if (userDoc.exists()) {
                    const userData = userDoc.data() || {}
                    const isDoctor = item.userRole === "doctor" || userData.role === "doctor"
                    return {
                      ...item,
                      avatarSrc: item.avatarSrc || userData.photoURL || null,
                      name: item.name || userData.displayName || userData.name || "Anonymous",
                      userRole: isDoctor ? "doctor" : "patient",
                      specialty: item.specialty || userData.specialty || userData.specialization || userData.speciality || null,
                      experience: userData.experience || null,
                      location: userData.address || userData.location || null,
                      createdAt: item.createdAt || null,
                    }
                  }
                }
                return item
              } catch (err) {
                console.warn("Failed to enrich testimonial user data", err)
                return item
              }
            })
          )
          
          // Limit to 6 (query already does this, but ensure client-side too)
          const limitedItems = enriched.slice(0, 6)
          
          setTestimonials(limitedItems)
          setLoadingTestimonials(false)
        } catch (error) {
          console.error("Error processing testimonials:", error)
          setTestimonials([])
          setLoadingTestimonials(false)
        }
      },
      (error) => {
        console.error("Error loading testimonials:", error)
        setTestimonials([])
        setLoadingTestimonials(false)
      }
    )

    // Cleanup: unsubscribe when component unmounts
    return () => {
      unsubscribe()
    }
  }, [])

  // Apply scrollbar hiding to body and html
  useEffect(() => {
    if (mounted) {
      document.body.classList.add('scrollbar-hide')
      document.documentElement.classList.add('scrollbar-hide')
      return () => {
        document.body.classList.remove('scrollbar-hide')
        document.documentElement.classList.remove('scrollbar-hide')
      }
    }
  }, [mounted])

  // Update page title and favicon based on branding
  useEffect(() => {
    const brandName = landingContent.branding?.name || "Smart Care"
    const heroTitle = landingContent.hero?.title || "Your Health, One Click Away"
    document.title = `${brandName} - ${heroTitle}`

    const applyFavicon = (rel, href) => {
      if (!href) return
      let link = document.querySelector(`link[rel='${rel}']`)
      if (!link) {
        link = document.createElement("link")
        link.setAttribute("rel", rel)
        document.head.appendChild(link)
      }
      link.setAttribute("href", href)
      link.setAttribute("type", "image/png")
    }

    const favicon = landingContent.branding?.faviconUrl
    applyFavicon("icon", favicon)
    applyFavicon("shortcut icon", favicon)
    applyFavicon("apple-touch-icon", favicon)
  }, [landingContent.branding, landingContent.hero?.title])

  // Map icon names to components
  const getIconComponent = (iconName, className) => {
    const icons = {
      MessageSquare: <MessageSquare className={className} />,
      Calendar: <Calendar className={className} />,
      Clock: <Clock className={className} />,
      CheckCircle: <CheckCircle className={className} />,
      Stethoscope: <Stethoscope className={className} />,
    }

    return icons[iconName] || <MessageSquare className={className} />
  }

  const brandName = landingContent.branding?.name || "Smart Care"
  const brandTagline = landingContent.branding?.tagline || "Your Health, One Click Away"
  const brandContact = landingContent.branding?.contact || {}
  const contactEmail = brandContact.email || "smartcarefamily@gmail.com"
  const contactPhone = brandContact.phone || "+1 (555) 123-4567"
  const contactAddress = brandContact.address || "123 Healthcare Avenue, Medical District, CA 90210"
  const rawMapUrl = brandContact.mapUrl || ""
  const phoneHref = contactPhone ? contactPhone.replace(/[^+\d]/g, "") : ""

  // Extract URL from iframe HTML if needed
  const extractMapUrl = (urlString) => {
    if (!urlString || !urlString.trim()) return ""
    
    // If it's already a clean URL, return it
    if (urlString.startsWith("https://www.google.com/maps/embed") || urlString.startsWith("http://www.google.com/maps/embed")) {
      return urlString
    }
    
    // If it contains iframe HTML, extract the src URL
    const iframeMatch = urlString.match(/src=["']([^"']+)["']/)
    if (iframeMatch && iframeMatch[1]) {
      return iframeMatch[1]
    }
    
    // If it's wrapped in iframe tags, try to extract
    const srcMatch = urlString.match(/src="([^"]+)"/)
    if (srcMatch && srcMatch[1]) {
      return srcMatch[1]
    }
    
    // Return as is if no pattern matches
    return urlString.trim()
  }

  const mapUrl = extractMapUrl(rawMapUrl)

  // Smooth scroll function
  const scrollToSection = (sectionId) => {
    const element = document.getElementById(sectionId)
    if (element) {
      const offset = 70 // Account for fixed navbar (64px header + 6px spacing)
      const elementPosition = element.getBoundingClientRect().top
      const offsetPosition = elementPosition + window.pageYOffset - offset

      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth",
      })
    }
  }

  return (
    <div className="flex min-h-screen flex-col scrollbar-hide overflow-x-hidden">
      <Navbar 
        onSidebarOpen={() => {}} 
        onSignIn={() => setShowLoginModal(true)}
        scrollToSection={scrollToSection}
      />
      <LoginModal 
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        onSwitchToSignup={() => {
          setShowLoginModal(false)
          setShowSignupModal(true)
        }}
      />
      <SignupModal 
        isOpen={showSignupModal}
        onClose={() => setShowSignupModal(false)}
        onSwitchToSignin={() => {
          setShowSignupModal(false)
          setShowLoginModal(true)
        }}
      />

      {/* Hero Section */}
      <section id="home" className="relative flex items-center bg-gradient-to-br from-pale-stone via-white to-amber-50/30 pt-20 pb-8 md:pt-24 md:pb-12 overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-10 w-72 h-72 bg-amber-500/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-amber-400/5 rounded-full blur-3xl animate-pulse delay-1000"></div>
        </div>
        
        <div className="container px-4 sm:px-6 md:px-6 mx-auto relative z-10">
          <div className="grid gap-4 sm:gap-6 lg:grid-cols-2 lg:gap-12 items-center">
            {loadingContent ? (
              <>
                <div className="flex flex-col justify-center space-y-3">
                  <div className="h-8 w-32 bg-gray-200 rounded-full animate-pulse mb-2"></div>
                  <div className="h-12 sm:h-16 md:h-20 bg-gray-200 rounded-lg animate-pulse mb-3"></div>
                  <div className="space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-full animate-pulse"></div>
                    <div className="h-4 bg-gray-200 rounded w-5/6 animate-pulse"></div>
                    <div className="h-4 bg-gray-200 rounded w-4/6 animate-pulse"></div>
                  </div>
                  <div className="flex flex-col gap-2.5 sm:gap-3 sm:flex-row pt-1">
                    <div className="h-11 sm:h-12 bg-gray-200 rounded-lg w-full sm:w-40 animate-pulse"></div>
                    <div className="h-11 sm:h-12 bg-gray-200 rounded-lg w-full sm:w-32 animate-pulse"></div>
                  </div>
                </div>
                <div className="flex items-center justify-center">
                  <div className="relative w-full max-w-lg">
                    <div className="aspect-video bg-gray-200 rounded-2xl animate-pulse"></div>
                  </div>
                </div>
              </>
            ) : (
              <>
            <div className="flex flex-col justify-center space-y-3 animate-fadeInUp">
              <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-amber-500/10 border border-amber-500/20 w-fit mb-1">
                <span className="text-xs sm:text-sm font-semibold text-amber-600">✨ {brandTagline}</span>
              </div>
              <h1 className="text-3xl sm:text-4xl md:text-5xl xl:text-6xl font-bold tracking-tight text-graphite leading-tight">
                {landingContent.hero.title}
              </h1>
              <p className="max-w-[600px] text-base sm:text-lg md:text-xl text-drift-gray leading-relaxed mt-1">
                {landingContent.hero.description}
              </p>
              <div className="flex flex-col gap-2.5 sm:gap-3 sm:flex-row pt-1">
                <button
                  onClick={() => setShowSignupModal(true)}
                  className="group inline-flex h-11 sm:h-12 items-center justify-center rounded-lg bg-gradient-to-r from-amber-500 to-amber-400 px-4 sm:px-5 py-2.5 text-sm font-semibold text-white shadow-md hover:shadow-lg hover:from-amber-600 hover:to-amber-500 transition-all transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 w-full sm:w-auto"
                >
                  Get Started
                  <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5 group-hover:translate-x-1 transition-transform" />
                </button>
                <button
                  onClick={() => scrollToSection("features")}
                  className="inline-flex h-11 sm:h-12 items-center justify-center rounded-lg border border-earth-beige bg-white px-4 sm:px-5 py-2.5 text-sm font-medium text-graphite hover:bg-pale-stone transition-colors shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-earth-beige focus:ring-offset-2 w-full sm:w-auto"
                >
                  Learn More
                </button>
              </div>
            </div>
            <div className="flex items-center justify-center animate-fadeInRight">
              <div className="relative w-full max-w-lg">
                <div className="absolute inset-0 bg-gradient-to-br from-amber-500/30 to-amber-400/20 rounded-3xl blur-3xl animate-pulse"></div>
                <div className="relative">
                  <div className="absolute -inset-4 bg-gradient-to-r from-amber-500/20 to-amber-400/20 rounded-3xl blur-xl animate-pulse delay-500"></div>
              <img
                src={landingContent.hero.imageUrl || "/placeholder.svg"}
                alt={`${brandName} Platform`}
                    className="relative aspect-video overflow-hidden rounded-2xl object-cover object-center shadow-2xl transform hover:scale-105 transition-transform duration-500"
                width={600}
                height={400}
              />
                </div>
              </div>
            </div>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="relative py-12 sm:py-16 md:py-20 lg:py-28 bg-gradient-to-b from-white to-pale-stone/30 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(245,166,35,0.05),transparent_50%)]"></div>
        <div className="container px-4 md:px-6 mx-auto relative z-10">
          <div className="mx-auto max-w-3xl text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500/10 border border-amber-500/20 w-fit mb-6">
              <span className="text-sm font-semibold text-amber-600">Features</span>
            </div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight text-graphite mb-3 sm:mb-4">
              Comprehensive Healthcare Solutions
            </h2>
            <p className="text-base sm:text-lg md:text-xl text-drift-gray">
              Smart Care offers a range of features designed to make healthcare accessible, convenient, and personalized for everyone.
            </p>
          </div>
          <div className="mx-auto grid max-w-5xl grid-cols-1 gap-4 sm:gap-6 md:gap-8 md:grid-cols-2">
            {loadingContent ? (
              [1, 2, 3, 4].map((index) => (
                <div
                  key={index}
                  className="group flex flex-col gap-3 sm:gap-4 rounded-xl sm:rounded-2xl border border-gray-200/50 bg-white/80 backdrop-blur-sm p-4 sm:p-6 md:p-8 shadow-sm animate-pulse"
                >
                  <div className="rounded-lg sm:rounded-xl bg-gray-200 p-3 sm:p-4 w-12 h-12 sm:w-16 sm:h-16"></div>
                  <div className="h-6 bg-gray-200 rounded w-3/4 animate-pulse"></div>
                  <div className="space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-full animate-pulse"></div>
                    <div className="h-4 bg-gray-200 rounded w-5/6 animate-pulse"></div>
                  </div>
                </div>
              ))
            ) : (
              landingContent.features.map((feature, index) => (
              <div
                key={index}
                className="group flex flex-col gap-3 sm:gap-4 rounded-xl sm:rounded-2xl border border-earth-beige/50 bg-white/80 backdrop-blur-sm p-4 sm:p-6 md:p-8 shadow-sm transition-all duration-500 hover:shadow-2xl hover:border-amber-500/50 hover:-translate-y-2 hover:bg-white"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="rounded-lg sm:rounded-xl bg-gradient-to-br from-amber-500/10 to-amber-50 p-3 sm:p-4 w-fit group-hover:from-amber-500/20 group-hover:to-amber-100 transition-all duration-300 group-hover:scale-110">
                  {getIconComponent(feature.icon, "h-6 w-6 sm:h-8 sm:w-8 text-amber-600")}
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-graphite group-hover:text-amber-600 transition-colors">{feature.title}</h3>
                <p className="text-sm sm:text-base text-drift-gray leading-relaxed">{feature.description}</p>
              </div>
              ))
            )}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="relative py-12 sm:py-16 md:py-20 lg:py-28 bg-gradient-to-br from-earth-beige/10 via-pale-stone/50 to-amber-50/20 overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(245,166,35,0.05)_0%,transparent_50%,rgba(245,166,35,0.05)_100%)]"></div>
        <div className="container px-4 md:px-6 mx-auto relative z-10">
          <div className="mx-auto max-w-3xl text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500/10 border border-amber-500/20 w-fit mb-6">
              <span className="text-sm font-semibold text-amber-600">Simple Process</span>
            </div>
            <h2 className="text-3xl font-bold tracking-tight text-graphite sm:text-4xl md:text-5xl mb-4">
              {landingContent.howItWorks.title}
            </h2>
            <p className="text-lg text-drift-gray md:text-xl">
              {landingContent.howItWorks.description}
            </p>
          </div>
          <div className="mx-auto mt-16 grid max-w-5xl grid-cols-1 gap-12 md:grid-cols-3">
            {loadingContent ? (
              [1, 2, 3].map((index) => (
                <div key={index} className="group flex flex-col items-center gap-4 text-center p-6 rounded-2xl bg-white/60 backdrop-blur-sm border border-gray-200/30 animate-pulse">
                  <div className="h-20 w-20 rounded-full bg-gray-200"></div>
                  <div className="h-6 bg-gray-200 rounded w-3/4"></div>
                  <div className="space-y-2 w-full">
                    <div className="h-4 bg-gray-200 rounded w-full"></div>
                    <div className="h-4 bg-gray-200 rounded w-5/6 mx-auto"></div>
                  </div>
                </div>
              ))
            ) : (
              [
              {
                number: 1,
                title: "Create an Account",
                description: "Sign up for Smart Care and complete your health profile with relevant medical information."
              },
              {
                number: 2,
                title: "Book an Appointment",
                description: "Browse available healthcare providers and schedule a virtual consultation at your convenience."
              },
              {
                number: 3,
                title: "Receive Care",
                description: "Connect with your provider via secure video call, get diagnoses, prescriptions, and follow-up care."
              }
            ].map((step, index) => (
              <div key={index} className="group flex flex-col items-center gap-4 text-center p-6 rounded-2xl bg-white/60 backdrop-blur-sm border border-earth-beige/30 hover:bg-white hover:shadow-xl hover:border-amber-500/50 transition-all duration-300 hover:-translate-y-1">
                  <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-amber-500/20 to-amber-400/20 rounded-full blur-xl group-hover:blur-2xl transition-all"></div>
                  <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-amber-500 to-amber-400 text-3xl font-bold text-white shadow-lg group-hover:scale-110 transition-transform duration-300">
                    {step.number}
              </div>
            </div>
                <h3 className="text-xl font-bold text-graphite group-hover:text-amber-600 transition-colors">{step.title}</h3>
                <p className="text-drift-gray leading-relaxed">{step.description}</p>
              </div>
              ))
            )}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="relative py-12 sm:py-16 md:py-20 lg:py-28 bg-gradient-to-b from-white via-pale-stone/20 to-white overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(245,166,35,0.03),transparent_70%)]"></div>
        <div className="container px-4 md:px-6 mx-auto relative z-10">
          <div className="mx-auto max-w-3xl text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500/10 border border-amber-500/20 w-fit mb-6">
              <span className="text-sm font-semibold text-amber-600">Testimonials</span>
            </div>
            <h2 className="text-3xl font-bold tracking-tight text-graphite sm:text-4xl md:text-5xl mb-4">
              {landingContent.testimonials.title}
            </h2>
            <p className="text-lg text-drift-gray md:text-xl">
              {landingContent.testimonials.description}
            </p>
          </div>
          
          {loadingTestimonials ? (
            <div className="relative w-full max-w-7xl mx-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                {[1, 2, 3].map((index) => (
                  <div key={index} className="w-full">
                    <div className="group flex flex-col rounded-xl border border-gray-200/50 bg-white p-4 sm:p-6 shadow-sm h-full animate-pulse">
                      {/* Header Skeleton */}
                      <div className="flex items-start gap-2 sm:gap-3 mb-3 sm:mb-4">
                        <div className="h-12 w-12 sm:h-14 sm:w-14 rounded-full bg-gray-200 flex-shrink-0"></div>
                        <div className="flex-1 min-w-0 space-y-2">
                          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                          <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                          <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                        </div>
                      </div>
                      {/* Text Skeleton */}
                      <div className="mb-3 sm:mb-4 flex-1 space-y-2">
                        <div className="h-3 bg-gray-200 rounded w-full"></div>
                        <div className="h-3 bg-gray-200 rounded w-full"></div>
                        <div className="h-3 bg-gray-200 rounded w-5/6"></div>
                        <div className="h-3 bg-gray-200 rounded w-4/6"></div>
                      </div>
                      {/* Date Badge Skeleton */}
                      <div className="mt-auto pt-2 sm:pt-3 border-t border-gray-200/30">
                        <div className="h-3 bg-gray-200 rounded w-1/3"></div>
                      </div>
                    </div>
              </div>
            ))}
          </div>
            </div>
          ) : testimonials.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-drift-gray">No testimonials available at the moment.</p>
            </div>
          ) : (
            <TestimonialsCarousel testimonials={testimonials} />
          )}
        </div>
      </section>

      {/* For Doctors Section */}
      <section id="for-doctors" className="relative py-12 sm:py-16 md:py-20 lg:py-28 bg-gradient-to-br from-earth-beige/10 via-pale-stone/50 to-amber-50/20 overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(45deg,rgba(245,166,35,0.03)_0%,transparent_50%,rgba(245,166,35,0.03)_100%)]"></div>
        <div className="container px-4 md:px-6 mx-auto relative z-10">
          <div className="grid gap-12 lg:grid-cols-2 lg:gap-16 items-center">
            {loadingContent ? (
              <>
                <div className="flex items-center justify-center order-2 lg:order-1">
                  <div className="relative w-full max-w-lg">
                    <div className="aspect-video bg-gray-200 rounded-2xl animate-pulse"></div>
                  </div>
                </div>
                <div className="flex flex-col justify-center space-y-6 order-1 lg:order-2">
                  <div className="h-8 w-48 bg-gray-200 rounded-full animate-pulse mb-4"></div>
                  <div className="space-y-4">
                    <div className="h-10 bg-gray-200 rounded-lg animate-pulse"></div>
                    <div className="space-y-2">
                      <div className="h-4 bg-gray-200 rounded w-full animate-pulse"></div>
                      <div className="h-4 bg-gray-200 rounded w-5/6 animate-pulse"></div>
                    </div>
                  </div>
                  <ul className="grid gap-4">
                    {[1, 2, 3, 4].map((index) => (
                      <li key={index} className="flex items-start gap-3 p-3 rounded-lg">
                        <div className="h-8 w-8 bg-gray-200 rounded-full flex-shrink-0 animate-pulse"></div>
                        <div className="h-5 bg-gray-200 rounded flex-1 animate-pulse"></div>
                      </li>
                    ))}
                  </ul>
                  <div className="pt-4">
                    <div className="h-14 bg-gray-200 rounded-xl w-48 animate-pulse"></div>
                  </div>
                </div>
              </>
            ) : (
              <>
            <div className="flex items-center justify-center order-2 lg:order-1">
              <div className="relative w-full max-w-lg">
                <div className="absolute inset-0 bg-gradient-to-br from-amber-500/30 to-amber-400/20 rounded-3xl blur-3xl animate-pulse"></div>
                <div className="relative">
                  <div className="absolute -inset-4 bg-gradient-to-r from-amber-500/20 to-amber-400/20 rounded-3xl blur-xl"></div>
              <img
                src={landingContent.forDoctors.imageUrl || "/placeholder.svg"}
                alt="Doctor using Smart Care"
                    className="relative aspect-video overflow-hidden rounded-2xl object-cover object-center shadow-2xl transform hover:scale-105 transition-transform duration-500"
                width={600}
                height={400}
              />
            </div>
              </div>
            </div>
            <div className="flex flex-col justify-center space-y-6 order-1 lg:order-2">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500/10 border border-amber-500/20 w-fit mb-4">
                <span className="text-sm font-semibold text-amber-600">For Healthcare Providers</span>
              </div>
              <div className="space-y-4">
                <h2 className="text-3xl font-bold tracking-tight text-graphite sm:text-4xl md:text-5xl">
                  {landingContent.forDoctors.title}
                </h2>
                <p className="text-lg text-drift-gray md:text-xl leading-relaxed">
                  {landingContent.forDoctors.description}
                </p>
              </div>
              <ul className="grid gap-4">
                {landingContent.forDoctors.benefits.map((benefit, index) => (
                  <li key={index} className="flex items-start gap-3 p-3 rounded-lg hover:bg-white/50 transition-colors group">
                    <div className="rounded-full bg-amber-500/10 p-1.5 group-hover:bg-amber-500/20 transition-colors">
                      <CheckCircle className="h-5 w-5 text-amber-600 flex-shrink-0" />
                    </div>
                    <span className="text-graphite text-lg group-hover:text-amber-600 transition-colors">{benefit}</span>
                  </li>
                ))}
              </ul>
              <div className="pt-4 flex justify-center sm:justify-start">
                <button
                  onClick={() => setShowSignupModal(true)}
                  className="group inline-flex h-14 items-center justify-center rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 px-8 text-base font-semibold text-white transition-all hover:from-amber-600 hover:to-amber-500 hover:shadow-2xl hover:scale-105 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 transform duration-300"
                >
                  Join as a Provider
                  <Stethoscope className="ml-2 h-5 w-5 group-hover:rotate-12 transition-transform" />
                </button>
              </div>
            </div>
              </>
            )}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section id="cta" className="relative py-12 sm:py-16 md:py-20 lg:py-28 bg-gradient-to-br from-amber-500/10 via-amber-50/30 to-pale-stone overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(245,158,11,0.1),transparent_50%)]"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_50%,rgba(245,158,11,0.05),transparent_50%)]"></div>
        <div className="container px-4 md:px-6 mx-auto relative z-10">
          <div className="mx-auto max-w-3xl flex flex-col items-center justify-center gap-8 text-center p-12 rounded-3xl bg-white/60 backdrop-blur-sm border border-amber-500/20 shadow-2xl">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-amber-500/20 to-amber-50 border border-amber-500/30 w-fit mb-4">
              <span className="text-sm font-semibold text-amber-600">Ready to Start?</span>
            </div>
            <h2 className="text-3xl font-bold tracking-tight text-graphite sm:text-4xl md:text-5xl">
              {landingContent.cta.title}
            </h2>
            <p className="text-lg text-drift-gray md:text-xl leading-relaxed">
              {landingContent.cta.description}
            </p>
            <div className="flex flex-col gap-2.5 sm:gap-3 sm:flex-row pt-4 w-full sm:w-auto">
              <button
                onClick={() => setShowSignupModal(true)}
                className="group inline-flex h-11 sm:h-12 items-center justify-center rounded-lg bg-gradient-to-r from-amber-500 to-amber-400 px-4 sm:px-5 py-2.5 text-sm font-semibold text-white shadow-md hover:shadow-lg hover:from-amber-600 hover:to-amber-500 transition-all transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 w-full sm:w-auto"
              >
                Get Started
                <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5 group-hover:translate-x-1 transition-transform" />
              </button>
              <button
                onClick={() => setShowLoginModal(true)}
                className="inline-flex h-11 sm:h-12 items-center justify-center rounded-lg border border-earth-beige bg-white px-4 sm:px-5 py-2.5 text-sm font-medium text-graphite hover:bg-pale-stone transition-colors shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-earth-beige focus:ring-offset-2 w-full sm:w-auto"
              >
                Sign In
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="relative py-12 sm:py-16 md:py-20 lg:py-28 bg-gradient-to-br from-white via-pale-stone/30 to-amber-50/20 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,rgba(245,166,35,0.05),transparent_70%)]"></div>
        <div className="container px-4 md:px-6 mx-auto relative z-10">
          <div className="mx-auto max-w-3xl text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500/10 border border-amber-500/20 w-fit mb-6">
              <span className="text-sm font-semibold text-amber-600">Contact Us</span>
            </div>
            <h2 className="text-3xl font-bold tracking-tight text-graphite sm:text-4xl md:text-5xl mb-4">
              Get In Touch
            </h2>
            <p className="text-lg text-drift-gray md:text-xl">
              Have questions? We'd love to hear from you. Send us a message and we'll respond as soon as possible.
            </p>
          </div>
          
          <div className="mx-auto max-w-6xl grid gap-8 lg:grid-cols-3 lg:items-stretch">
            {/* Map Section */}
            <div className="lg:col-span-1 flex">
              <div className="rounded-2xl border border-earth-beige/50 bg-white shadow-2xl hover:shadow-amber-500/10 transition-all duration-300 w-full flex flex-col overflow-hidden">
                <div className="p-6 border-b border-earth-beige/30 bg-gradient-to-r from-amber-50 to-white">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 p-3 shadow-lg">
                      <MapPin className="h-6 w-6 text-white" />
                  </div>
                  <div className="flex-1">
                      <h3 className="text-2xl font-bold text-graphite">Our Location</h3>
                      <p className="text-sm text-drift-gray">{contactAddress}</p>
                  </div>
                </div>
                  {/* Contact Info */}
                  <div className="mt-4 pt-4 border-t border-earth-beige/20 grid grid-cols-1 gap-3">
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-amber-600 flex-shrink-0" />
                      <a 
                        href={phoneHref ? `tel:${phoneHref}` : "#"} 
                        className="text-sm text-graphite hover:text-amber-600 transition-colors font-medium break-words"
                      >
                      {contactPhone}
                    </a>
                  </div>
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-amber-600 flex-shrink-0" />
                      <a 
                        href={`mailto:${contactEmail}`} 
                        className="text-sm text-graphite hover:text-amber-600 transition-colors font-medium break-all"
                        style={{ wordBreak: "break-word", overflowWrap: "anywhere" }}
                      >
                      {contactEmail}
                    </a>
                  </div>
                </div>
              </div>
                <div className="flex-1 min-h-[400px] md:min-h-[500px] relative bg-pale-stone/20">
                  {mapUrl && mapUrl.trim() ? (
                    <iframe
                      src={mapUrl.startsWith('http') ? mapUrl : `https://${mapUrl}`}
                      width="100%"
                      height="100%"
                      style={{ border: 0 }}
                      allowFullScreen={true}
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                      title="Smart Care Location"
                      className="absolute inset-0 w-full h-full rounded-b-2xl"
                    />
                  ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-pale-stone to-amber-50/30">
                      <MapPin className="h-16 w-16 text-amber-500/50 mb-4" />
                      <p className="text-graphite font-semibold mb-2">Map Not Configured</p>
                      <p className="text-sm text-drift-gray text-center px-4">
                        Please configure the map URL in admin settings
                      </p>
                  </div>
                  )}
                </div>
              </div>
            </div>

            {/* Contact Form */}
            <div className="lg:col-span-2 flex">
              <div className="rounded-2xl border border-earth-beige/50 bg-white/80 backdrop-blur-sm p-8 md:p-10 shadow-2xl hover:shadow-3xl transition-all duration-300 w-full flex flex-col">
                <div className="mb-8">
                  <h3 className="text-2xl font-bold text-graphite mb-3">Send us a message</h3>
                  <p className="text-drift-gray leading-relaxed text-base">
                    Fill out the form below and we'll get back to you within 24 hours. We're here to help you with any questions or concerns.
                  </p>
                </div>
                <div className="flex-1 flex flex-col justify-between">
                  <div className="flex-1">
                <ContactForm contactEmail={contactEmail} brandName={brandName} />
                  </div>
                  
                  {/* Decorative element at bottom */}
                  <div className="mt-8 pt-6 border-t border-earth-beige/30">
                    <div className="flex items-center gap-2 text-sm text-drift-gray">
                      <div className="h-2 w-2 rounded-full bg-amber-500 animate-pulse"></div>
                      <span>We typically respond within 24 hours</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer scrollToSection={scrollToSection} brand={landingContent.branding} />
    </div>
  )
}
