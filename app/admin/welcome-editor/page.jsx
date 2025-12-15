"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import {
  Trash2,
  Upload,
  Save,
  Eye,
  CheckCircle,
  Edit,
  ImageIcon,
  Layout,
  MessageSquare,
  AlertCircle,
  Globe2,
} from "lucide-react"
import { AdminHeaderBanner } from "@/components/admin-header-banner"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { SuccessNotification } from "@/components/success-notification"
import {
  getLandingPageContent,
  updateLandingPageContent,
  uploadLandingPageImage,
  getLogoContent,
  updateLogoContent,
  uploadLogoImage,
  deleteLogoImage,
} from "@/lib/welcome-utils"
import { useAuth } from "@/contexts/auth-context"

export default function WelcomeEditorPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState("landing")
  const [mobileTabsOpen, setMobileTabsOpen] = useState(false)
  const mobileTabsRef = useRef(null)
  const [isSaving, setIsSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [lastUpdated, setLastUpdated] = useState(null)

  const [landingContent, setLandingContent] = useState({
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
  })

  const [uploadingImage, setUploadingImage] = useState({
    section: "",
    isUploading: false,
  })

  const [logoContent, setLogoContent] = useState({
    text: "SmartCare",
    color: "#F2B95E", // soft-amber color
    fontSize: "text-xl",
    fontWeight: "font-bold",
    imageUrl: "",
    imageHeight: 32,
  })

  // Check if user is authenticated
  useEffect(() => {
    if (!user) {
      showNotification("You must be logged in to access this page", true)
    }
  }, [user])

  // Close mobile tab dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (mobileTabsRef.current && !mobileTabsRef.current.contains(e.target)) {
        setMobileTabsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  // Load welcome content on mount
  useEffect(() => {
    const loadContent = async () => {
      try {
        const landingData = await getLandingPageContent()
        if (landingData) {
          setLandingContent((prev) => ({
            ...prev,
            ...landingData,
            branding: {
              ...prev.branding,
              ...(landingData.branding || {}),
              contact: {
                ...prev.branding.contact,
                ...(landingData.branding?.contact || {}),
              },
              footer: {
                ...prev.branding.footer,
                ...(landingData.branding?.footer || {}),
                socials: {
                  ...prev.branding.footer.socials,
                  ...(landingData.branding?.footer?.socials || {}),
                },
              },
            },
          }))
          if (landingData.lastUpdated && (!lastUpdated || landingData.lastUpdated > lastUpdated)) {
            setLastUpdated(landingData.lastUpdated)
          }
        }

        const logoData = await getLogoContent()
        if (logoData) {
          setLogoContent(logoData)
        }
      } catch (error) {
        console.error("Error loading content:", error)
        showNotification("Failed to load content: " + (error.message || "Unknown error"), true)
      }
    }

    loadContent()
  }, [])

  // Handle landing page content changes
  const handleLandingChange = (section, field, value) => {
    setLandingContent((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value,
      },
    }))
  }

  // Handle feature changes
  const handleFeatureChange = (index, field, value) => {
    setLandingContent((prev) => {
      const updatedFeatures = [...prev.features]
      updatedFeatures[index] = {
        ...updatedFeatures[index],
        [field]: value,
      }
      return {
        ...prev,
        features: updatedFeatures,
      }
    })
  }

  // Handle doctor benefit changes
  const handleBenefitChange = (index, value) => {
    setLandingContent((prev) => {
      const updatedBenefits = [...prev.forDoctors.benefits]
      updatedBenefits[index] = value
      return {
        ...prev,
        forDoctors: {
          ...prev.forDoctors,
          benefits: updatedBenefits,
        },
      }
    })
  }

  const handleBrandingChange = (field, value) => {
    setLandingContent((prev) => ({
      ...prev,
      branding: {
        ...prev.branding,
        [field]: value,
      },
    }))
  }

  const handleBrandingContactChange = (field, value) => {
    setLandingContent((prev) => ({
      ...prev,
      branding: {
        ...prev.branding,
        contact: {
          ...prev.branding.contact,
          [field]: value,
        },
      },
    }))
  }

  const handleBrandingFooterChange = (field, value) => {
    setLandingContent((prev) => ({
      ...prev,
      branding: {
        ...prev.branding,
        footer: {
          ...prev.branding.footer,
          [field]: value,
        },
      },
    }))
  }

  const handleBrandingSocialChange = (field, value) => {
    setLandingContent((prev) => ({
      ...prev,
      branding: {
        ...prev.branding,
        footer: {
          ...prev.branding.footer,
          socials: {
            ...prev.branding.footer.socials,
            [field]: value,
          },
        },
      },
    }))
  }

  // Handle logo content changes
  const handleLogoChange = (field, value) => {
    setLogoContent((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  // Show notification
  const [notification, setNotification] = useState({
    show: false,
    message: "",
    isError: false,
  })

  const showNotification = (message, isError = false) => {
    setNotification({
      show: true,
      message,
      isError,
    })

    // Auto-hide after 5 seconds
    setTimeout(() => {
      setNotification((prev) => ({ ...prev, show: false }))
    }, 5000)
  }

  // Handle image upload
  const handleImageUpload = async (e, section) => {
    const file = e.target.files[0]
    if (!file) return

    // Check file size
    if (file.size > 1024 * 1024) {
      showNotification("Image size exceeds 1MB limit. Please choose a smaller image.", true)
      return
    }

    setUploadingImage({
      section,
      isUploading: true,
    })

    try {
      const imageUrl = await uploadLandingPageImage(file, section)
      let updatedContent
      setLandingContent((prev) => {
        updatedContent = {
        ...prev,
        [section]: {
          ...prev[section],
          imageUrl,
        },
        }
        return updatedContent
      })

      // Auto-save image uploads to Firestore for real-time updates
      try {
        await updateLandingPageContent(updatedContent)
      } catch (saveError) {
        console.error("Error auto-saving image:", saveError)
        // Don't show error to user, just log it
      }

      showNotification("Image uploaded successfully")
    } catch (error) {
      console.error("Error uploading image:", error)
      showNotification("Failed to upload image: " + (error.message || "Unknown error"), true)
    } finally {
      setUploadingImage({
        section: "",
        isUploading: false,
      })
    }
  }

  const handleBrandingImageUpload = async (e, field) => {
    const file = e.target.files[0]
    if (!file) return

    if (file.size > 1024 * 1024) {
      showNotification("Image size exceeds 1MB limit. Please choose a smaller image.", true)
      return
    }

    setUploadingImage({
      section: field,
      isUploading: true,
    })

    try {
      const imageUrl = await uploadLandingPageImage(file, `branding-${field}`)
      let updatedContent
      setLandingContent((prev) => {
        updatedContent = {
        ...prev,
        branding: {
          ...prev.branding,
          [field]: imageUrl,
        },
        }
        return updatedContent
      })

      // Auto-save image uploads to Firestore for real-time updates
      try {
        await updateLandingPageContent(updatedContent)
      } catch (saveError) {
        console.error("Error auto-saving branding image:", saveError)
        // Don't show error to user, just log it
      }

      showNotification("Brand asset uploaded successfully")
    } catch (error) {
      console.error("Error uploading branding image:", error)
      showNotification("Failed to upload brand asset: " + (error.message || "Unknown error"), true)
    } finally {
      setUploadingImage({
        section: "",
        isUploading: false,
      })
    }
  }

  // Add a function to handle logo image upload
  const handleLogoImageUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    // Check file size
    if (file.size > 500 * 1024) {
      showNotification("Image size exceeds 500KB limit. Please choose a smaller image.", true)
      return
    }

    setUploadingImage({
      section: "logo",
      isUploading: true,
    })

    try {
      const imageUrl = await uploadLogoImage(file)
      const updatedLogoContent = {
        ...logoContent,
        imageUrl,
      }
      setLogoContent(updatedLogoContent)

      // Auto-save logo uploads to Firestore for real-time updates
      try {
        await updateLogoContent(updatedLogoContent)
      } catch (saveError) {
        console.error("Error auto-saving logo:", saveError)
        // Don't show error to user, just log it
      }

      showNotification("Logo image uploaded successfully")
    } catch (error) {
      console.error("Error uploading logo image:", error)
      showNotification("Failed to upload logo image: " + (error.message || "Unknown error"), true)
    } finally {
      setUploadingImage({
        section: "",
        isUploading: false,
      })
    }
  }

  // Add a function to handle logo image deletion
  const handleLogoImageDelete = async () => {
    if (!logoContent.imageUrl) return

    if (confirm("Are you sure you want to delete the logo image?")) {
      try {
        await deleteLogoImage()
        setLogoContent((prev) => ({
          ...prev,
          imageUrl: "",
        }))
        showNotification("Logo image deleted successfully")
      } catch (error) {
        console.error("Error deleting logo image:", error)
        showNotification("Failed to delete logo image: " + (error.message || "Unknown error"), true)
      }
    }
  }

  // Save all content
  const handleSave = async () => {
    setIsSaving(true)

    try {
      let result
      if (activeTab === "landing" || activeTab === "branding") {
        result = await updateLandingPageContent(landingContent)
      } else if (activeTab === "logo") {
        result = await updateLogoContent(logoContent)
      }

      if (result.success) {
        setLastUpdated(new Date())
        setSaveSuccess(true)
        showNotification(result.message || "Content saved successfully")
        setTimeout(() => setSaveSuccess(false), 3000)
      } else {
        showNotification(result.message || "Failed to save content", true)
      }
    } catch (error) {
      console.error("Error saving content:", error)
      showNotification("Failed to save content: " + (error.message || "Unknown error"), true)
    } finally {
      setIsSaving(false)
    }
  }

  // Preview landing page
  const handlePreview = () => {
    window.open("/", "_blank")
  }

  // Format date for display
  const formatDate = (timestamp) => {
    if (!timestamp) return "Never"

    try {
      // Handle Firebase Timestamp objects
      const date = timestamp?.toDate
        ? timestamp.toDate()
        : // Handle serialized timestamp objects
          timestamp?.seconds
          ? new Date(timestamp.seconds * 1000)
          : // Handle regular dates or timestamps
            new Date(timestamp)

      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    } catch (error) {
      console.error("Error formatting date:", error)
      return "Unknown"
    }
  }

  // Stats for the banner
  const stats = [
    {
      label: "Last Updated",
      value: formatDate(lastUpdated),
      icon: <Edit className="h-4 w-4 text-white/70" />,
    },
    {
      label: "Landing Sections",
      value: "7",
      icon: <Layout className="h-4 w-4 text-white/70" />,
    },
    {
      label: "Welcome Modals",
      value: "3",
      icon: <MessageSquare className="h-4 w-4 text-white/70" />,
    },
    {
      label: "Features",
      value: landingContent.features.length,
      icon: <CheckCircle className="h-4 w-4 text-white/70" />,
    },
  ]

  return (
    <div className="space-y-6">
      {/* Banner */}
      <AdminHeaderBanner
        title="Content Management"
        subtitle="Edit and manage website content and welcome messages"
        stats={stats}
      />

      {/* Success notification */}
      <SuccessNotification
        message={notification.message}
        isVisible={notification.show}
        onClose={() => setNotification((prev) => ({ ...prev, show: false }))}
        isValidation={notification.isError}
      />

      {/* Authentication warning */}
      {!user && (
        <div className="bg-amber-50 border border-amber-200 rounded-md p-4 mb-4 flex items-center">
          <AlertCircle className="h-5 w-5 text-amber-500 mr-2" />
          <div>
            <h3 className="font-medium text-amber-800">Authentication Required</h3>
            <p className="text-amber-700 text-sm">
              You are not logged in. Changes may not be saved. Please log in as an admin to manage content.
            </p>
          </div>
        </div>
      )}

      {/* Action buttons */}
      <div className="flex justify-end space-x-3">
        <Button
          variant="outline"
          onClick={handlePreview}
          disabled={isSaving}
          className="bg-white border-earth-beige text-graphite hover:bg-pale-stone"
        >
          <Eye className="w-4 h-4 mr-2" />
          Preview
        </Button>
        <Button onClick={handleSave} disabled={isSaving} className="bg-soft-amber hover:bg-soft-amber/90 text-white">
          {isSaving ? (
            <>
              <svg
                className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              Saving...
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              Save Changes
            </>
          )}
        </Button>
      </div>

      {/* Tabs */}
      <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="w-full">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Content Editor</CardTitle>
            <CardDescription>Edit landing content, branding, and logo assets</CardDescription>
          </CardHeader>
          <CardContent>
            {/* Mobile tab selector with smooth dropdown */}
            <div className="mb-4 md:hidden" ref={mobileTabsRef}>
              <label className="block text-xs font-medium text-graphite mb-1">Select section</label>
              <button
                type="button"
                onClick={() => setMobileTabsOpen((v) => !v)}
                className="w-full rounded-md border border-earth-beige bg-white px-3 py-2 text-sm text-graphite flex items-center justify-between focus:outline-none focus:ring-2 focus:ring-soft-amber transition-colors duration-200"
              >
                <span>
                  {activeTab === "landing" ? "Landing Page" : activeTab === "branding" ? "Brand Settings" : "Logo Settings"}
                </span>
                <svg
                  className={`h-4 w-4 text-drift-gray transition-transform duration-200 ${mobileTabsOpen ? "rotate-180" : ""}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              <div
                className={`mt-2 origin-top rounded-md border border-earth-beige bg-white shadow-lg transition-all duration-200 ease-out ${
                  mobileTabsOpen ? "opacity-100 scale-100" : "opacity-0 scale-95 pointer-events-none"
                }`}
              >
                {[
                  { value: "landing", label: "Landing Page" },
                  { value: "branding", label: "Brand Settings" },
                  { value: "logo", label: "Logo Settings" },
                ].map((item) => (
                  <button
                    key={item.value}
                    type="button"
                    onClick={() => {
                      setActiveTab(item.value)
                      setMobileTabsOpen(false)
                    }}
                    className={`w-full text-left px-3 py-2 text-sm transition-colors duration-150 ${
                      activeTab === item.value ? "bg-amber-50 text-amber-700" : "text-graphite hover:bg-pale-stone"
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            <TabsList className="hidden md:grid w-full grid-cols-3 mb-6 bg-white border border-earth-beige/70 rounded-lg shadow-sm">
              <TabsTrigger
                value="landing"
                className="data-[state=active]:bg-soft-amber data-[state=active]:text-white data-[state=active]:border-soft-amber data-[state=active]:shadow-sm text-graphite"
              >
                <Layout className="w-4 h-4 mr-2" />
                Landing Page
              </TabsTrigger>
              <TabsTrigger
                value="branding"
                className="data-[state=active]:bg-soft-amber data-[state=active]:text-white data-[state=active]:border-soft-amber data-[state=active]:shadow-sm text-graphite"
              >
                <Globe2 className="w-4 h-4 mr-2" />
                Brand Settings
              </TabsTrigger>
              <TabsTrigger
                value="logo"
                className="data-[state=active]:bg-soft-amber data-[state=active]:text-white data-[state=active]:border-soft-amber data-[state=active]:shadow-sm text-graphite"
              >
                <Edit className="w-4 h-4 mr-2" />
                Logo Settings
              </TabsTrigger>
            </TabsList>

            <TabsContent value="landing" className="space-y-6 mt-0">
              {/* Hero Section */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center">
                    <Layout className="h-5 w-5 mr-2 text-soft-amber" />
                    Hero Section
                  </CardTitle>
                  <CardDescription>The main banner section at the top of the landing page</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-6 md:grid-cols-2">
                    <div className="space-y-4">
                      <div>
                        <label htmlFor="hero-title" className="block text-sm font-medium text-graphite mb-1">
                          Title
                        </label>
                        <input
                          type="text"
                          id="hero-title"
                          value={landingContent.hero.title}
                          onChange={(e) => handleLandingChange("hero", "title", e.target.value)}
                          className="w-full px-3 py-2 border border-earth-beige rounded-md focus:ring-soft-amber focus:border-soft-amber"
                        />
                      </div>
                      <div>
                        <label htmlFor="hero-description" className="block text-sm font-medium text-graphite mb-1">
                          Description
                        </label>
                        <textarea
                          id="hero-description"
                          value={landingContent.hero.description}
                          onChange={(e) => handleLandingChange("hero", "description", e.target.value)}
                          rows={4}
                          className="w-full px-3 py-2 border border-earth-beige rounded-md focus:ring-soft-amber focus:border-soft-amber"
                        />
                      </div>
                    </div>
                    <div className="space-y-4">
                      <label className="block text-sm font-medium text-graphite mb-1">Hero Image</label>
                      <div className="border border-earth-beige rounded-md p-4 bg-pale-stone/20">
                        <div className="aspect-video bg-pale-stone rounded-md overflow-hidden mb-4">
                          {landingContent.hero.imageUrl ? (
                            <img
                              src={landingContent.hero.imageUrl || "/placeholder.svg"}
                              alt="Hero"
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-drift-gray">
                              <ImageIcon className="h-8 w-8 mr-2 text-drift-gray/50" />
                              No image selected
                            </div>
                          )}
                        </div>
                        <div className="flex space-x-2">
                          <label className="flex items-center px-4 py-2 bg-white border border-earth-beige rounded-md text-sm font-medium text-graphite hover:bg-pale-stone cursor-pointer">
                            <Upload className="w-4 h-4 mr-2" />
                            Upload Image
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => handleImageUpload(e, "hero")}
                              disabled={uploadingImage.isUploading}
                            />
                          </label>
                        </div>
                        <p className="text-xs text-drift-gray mt-2">
                          Max file size: 1MB. Recommended dimensions: 1200x600px.
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Features Section */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center">
                    <CheckCircle className="h-5 w-5 mr-2 text-soft-amber" />
                    Features
                  </CardTitle>
                  <CardDescription>Key features highlighted on the landing page</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {landingContent.features.map((feature, index) => (
                      <div key={index} className="p-4 border border-earth-beige rounded-md bg-pale-stone/10">
                        <div className="flex justify-between items-center mb-4">
                          <h3 className="font-medium text-graphite flex items-center">
                            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-soft-amber text-white text-sm mr-2">
                              {index + 1}
                            </span>
                            Feature {index + 1}
                          </h3>
                        </div>
                        <div className="grid gap-4 md:grid-cols-3">
                          <div>
                            <label className="block text-sm font-medium text-graphite mb-1">Icon</label>
                            <select
                              value={feature.icon}
                              onChange={(e) => handleFeatureChange(index, "icon", e.target.value)}
                              className="w-full px-3 py-2 border border-earth-beige rounded-md focus:ring-soft-amber focus:border-soft-amber"
                            >
                              <option value="MessageSquare">Message Square</option>
                              <option value="Calendar">Calendar</option>
                              <option value="Clock">Clock</option>
                              <option value="CheckCircle">Check Circle</option>
                              <option value="Shield">Shield</option>
                              <option value="Heart">Heart</option>
                              <option value="Stethoscope">Stethoscope</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-graphite mb-1">Title</label>
                            <input
                              type="text"
                              value={feature.title}
                              onChange={(e) => handleFeatureChange(index, "title", e.target.value)}
                              className="w-full px-3 py-2 border border-earth-beige rounded-md focus:ring-soft-amber focus:border-soft-amber"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-graphite mb-1">Description</label>
                            <textarea
                              value={feature.description}
                              onChange={(e) => handleFeatureChange(index, "description", e.target.value)}
                              rows={2}
                              className="w-full px-3 py-2 border border-earth-beige rounded-md focus:ring-soft-amber focus:border-soft-amber"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* How It Works Section */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center">
                    <Layout className="h-5 w-5 mr-2 text-soft-amber" />
                    How It Works
                  </CardTitle>
                  <CardDescription>Section explaining how the platform works</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <label htmlFor="how-it-works-title" className="block text-sm font-medium text-graphite mb-1">
                        Title
                      </label>
                      <input
                        type="text"
                        id="how-it-works-title"
                        value={landingContent.howItWorks.title}
                        onChange={(e) => handleLandingChange("howItWorks", "title", e.target.value)}
                        className="w-full px-3 py-2 border border-earth-beige rounded-md focus:ring-soft-amber focus:border-soft-amber"
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="how-it-works-description"
                        className="block text-sm font-medium text-graphite mb-1"
                      >
                        Description
                      </label>
                      <textarea
                        id="how-it-works-description"
                        value={landingContent.howItWorks.description}
                        onChange={(e) => handleLandingChange("howItWorks", "description", e.target.value)}
                        rows={3}
                        className="w-full px-3 py-2 border border-earth-beige rounded-md focus:ring-soft-amber focus:border-soft-amber"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Testimonials Section */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center">
                    <MessageSquare className="h-5 w-5 mr-2 text-soft-amber" />
                    Testimonials
                  </CardTitle>
                  <CardDescription>User testimonials section</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <label htmlFor="testimonials-title" className="block text-sm font-medium text-graphite mb-1">
                        Title
                      </label>
                      <input
                        type="text"
                        id="testimonials-title"
                        value={landingContent.testimonials.title}
                        onChange={(e) => handleLandingChange("testimonials", "title", e.target.value)}
                        className="w-full px-3 py-2 border border-earth-beige rounded-md focus:ring-soft-amber focus:border-soft-amber"
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="testimonials-description"
                        className="block text-sm font-medium text-graphite mb-1"
                      >
                        Description
                      </label>
                      <textarea
                        id="testimonials-description"
                        value={landingContent.testimonials.description}
                        onChange={(e) => handleLandingChange("testimonials", "description", e.target.value)}
                        rows={3}
                        className="w-full px-3 py-2 border border-earth-beige rounded-md focus:ring-soft-amber focus:border-soft-amber"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* CTA Section */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center">
                    <CheckCircle className="h-5 w-5 mr-2 text-soft-amber" />
                    Call to Action
                  </CardTitle>
                  <CardDescription>Call-to-action section to encourage sign-ups</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <label htmlFor="cta-title" className="block text-sm font-medium text-graphite mb-1">
                        Title
                      </label>
                      <input
                        type="text"
                        id="cta-title"
                        value={landingContent.cta.title}
                        onChange={(e) => handleLandingChange("cta", "title", e.target.value)}
                        className="w-full px-3 py-2 border border-earth-beige rounded-md focus:ring-soft-amber focus:border-soft-amber"
                      />
                    </div>
                    <div>
                      <label htmlFor="cta-description" className="block text-sm font-medium text-graphite mb-1">
                        Description
                      </label>
                      <textarea
                        id="cta-description"
                        value={landingContent.cta.description}
                        onChange={(e) => handleLandingChange("cta", "description", e.target.value)}
                        rows={3}
                        className="w-full px-3 py-2 border border-earth-beige rounded-md focus:ring-soft-amber focus:border-soft-amber"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* For Doctors Section */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center">
                    <Layout className="h-5 w-5 mr-2 text-soft-amber" />
                    For Doctors
                  </CardTitle>
                  <CardDescription>Section targeting healthcare providers</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-6 md:grid-cols-2">
                    <div className="space-y-4">
                      <div>
                        <label htmlFor="for-doctors-title" className="block text-sm font-medium text-graphite mb-1">
                          Title
                        </label>
                        <input
                          type="text"
                          id="for-doctors-title"
                          value={landingContent.forDoctors.title}
                          onChange={(e) => handleLandingChange("forDoctors", "title", e.target.value)}
                          className="w-full px-3 py-2 border border-earth-beige rounded-md focus:ring-soft-amber focus:border-soft-amber"
                        />
                      </div>
                      <div>
                        <label
                          htmlFor="for-doctors-description"
                          className="block text-sm font-medium text-graphite mb-1"
                        >
                          Description
                        </label>
                        <textarea
                          id="for-doctors-description"
                          value={landingContent.forDoctors.description}
                          onChange={(e) => handleLandingChange("forDoctors", "description", e.target.value)}
                          rows={4}
                          className="w-full px-3 py-2 border border-earth-beige rounded-md focus:ring-soft-amber focus:border-soft-amber"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-graphite mb-1">Benefits</label>
                        <div className="space-y-2">
                          {landingContent.forDoctors.benefits.map((benefit, index) => (
                            <div key={index} className="flex items-center">
                              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-soft-amber/20 text-soft-amber text-sm mr-2">
                                {index + 1}
                              </span>
                              <input
                                type="text"
                                value={benefit}
                                onChange={(e) => handleBenefitChange(index, e.target.value)}
                                className="w-full px-3 py-2 border border-earth-beige rounded-md focus:ring-soft-amber focus:border-soft-amber"
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <label className="block text-sm font-medium text-graphite mb-1">Doctor Image</label>
                      <div className="border border-earth-beige rounded-md p-4 bg-pale-stone/20">
                        <div className="aspect-video bg-pale-stone rounded-md overflow-hidden mb-4">
                          {landingContent.forDoctors.imageUrl ? (
                            <img
                              src={landingContent.forDoctors.imageUrl || "/placeholder.svg"}
                              alt="For Doctors"
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-drift-gray">
                              <ImageIcon className="h-8 w-8 mr-2 text-drift-gray/50" />
                              No image selected
                            </div>
                          )}
                        </div>
                        <div className="flex space-x-2">
                          <label className="flex items-center px-4 py-2 bg-white border border-earth-beige rounded-md text-sm font-medium text-graphite hover:bg-pale-stone cursor-pointer">
                            <Upload className="w-4 h-4 mr-2" />
                            Upload Image
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => handleImageUpload(e, "forDoctors")}
                              disabled={uploadingImage.isUploading}
                            />
                          </label>
                        </div>
                        <p className="text-xs text-drift-gray mt-2">
                          Max file size: 1MB. Recommended dimensions: 1200x600px.
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="branding" className="space-y-6 mt-0">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center">
                    <Globe2 className="h-5 w-5 mr-2 text-soft-amber" />
                    Brand Identity
                  </CardTitle>
                  <CardDescription>Control brand name, tagline, and favicon for the public site</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-6 md:grid-cols-2">
                    <div className="space-y-4">
                      <div>
                        <label htmlFor="brand-name" className="block text-sm font-medium text-graphite mb-1">
                          Brand Name
                        </label>
                        <input
                          type="text"
                          id="brand-name"
                          value={landingContent.branding.name}
                          onChange={(e) => handleBrandingChange("name", e.target.value)}
                          className="w-full px-3 py-2 border border-earth-beige rounded-md focus:ring-soft-amber focus:border-soft-amber"
                        />
                      </div>
                      <div>
                        <label htmlFor="brand-tagline" className="block text-sm font-medium text-graphite mb-1">
                          Tagline
                        </label>
                        <input
                          type="text"
                          id="brand-tagline"
                          value={landingContent.branding.tagline}
                          onChange={(e) => handleBrandingChange("tagline", e.target.value)}
                          className="w-full px-3 py-2 border border-earth-beige rounded-md focus:ring-soft-amber focus:border-soft-amber"
                        />
                      </div>
                      <div>
                        <label htmlFor="brand-description" className="block text-sm font-medium text-graphite mb-1">
                          Short Description
                        </label>
                        <textarea
                          id="brand-description"
                          rows={4}
                          value={landingContent.branding.description}
                          onChange={(e) => handleBrandingChange("description", e.target.value)}
                          className="w-full px-3 py-2 border border-earth-beige rounded-md focus:ring-soft-amber focus:border-soft-amber"
                        />
                      </div>
                      <div>
                        <label htmlFor="brand-logo-url" className="block text-sm font-medium text-graphite mb-1">
                          Logo Image URL (optional)
                        </label>
                        <input
                          type="text"
                          id="brand-logo-url"
                          value={landingContent.branding.logoUrl}
                          onChange={(e) => handleBrandingChange("logoUrl", e.target.value)}
                          className="w-full px-3 py-2 border border-earth-beige rounded-md focus:ring-soft-amber focus:border-soft-amber"
                          placeholder="Paste a hosted logo URL or use the Logo tab for uploaded logos"
                        />
                      </div>
                    </div>
                    <div className="space-y-4">
                      <label className="block text-sm font-medium text-graphite mb-1">Favicon</label>
                      <div className="border border-earth-beige rounded-md p-4 bg-pale-stone/20">
                        <div className="aspect-square w-20 h-20 bg-pale-stone rounded-md overflow-hidden mb-4 flex items-center justify-center mx-auto">
                          {landingContent.branding.faviconUrl ? (
                            <img
                              src={landingContent.branding.faviconUrl}
                              alt="Favicon preview"
                              className="w-full h-full object-contain"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-drift-gray">
                              <ImageIcon className="h-8 w-8 mr-2 text-drift-gray/50" />
                              No favicon
                            </div>
                          )}
                        </div>
                        <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-2 space-y-2 sm:space-y-0">
                          <label className="flex items-center justify-center px-4 py-2 bg-white border border-earth-beige rounded-md text-sm font-medium text-graphite hover:bg-pale-stone cursor-pointer">
                            <Upload className="w-4 h-4 mr-2" />
                            Upload Favicon
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => handleBrandingImageUpload(e, "faviconUrl")}
                              disabled={uploadingImage.isUploading}
                            />
                          </label>
                        </div>
                        <p className="text-xs text-drift-gray mt-2">
                          Recommended size: 64x64px. Max file size: 1MB.
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center">
                    <Globe2 className="h-5 w-5 mr-2 text-soft-amber" />
                    Contact & Footer
                  </CardTitle>
                  <CardDescription>Manage footer content, social links, and contact details</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-6 md:grid-cols-2">
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-graphite mb-1">Address</label>
                        <textarea
                          rows={3}
                          value={landingContent.branding.contact.address}
                          onChange={(e) => handleBrandingContactChange("address", e.target.value)}
                          className="w-full px-3 py-2 border border-earth-beige rounded-md focus:ring-soft-amber focus:border-soft-amber"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-graphite mb-1">Phone</label>
                        <input
                          type="text"
                          value={landingContent.branding.contact.phone}
                          onChange={(e) => handleBrandingContactChange("phone", e.target.value)}
                          className="w-full px-3 py-2 border border-earth-beige rounded-md focus:ring-soft-amber focus:border-soft-amber"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-graphite mb-1">Email</label>
                        <input
                          type="email"
                          value={landingContent.branding.contact.email}
                          onChange={(e) => handleBrandingContactChange("email", e.target.value)}
                          className="w-full px-3 py-2 border border-earth-beige rounded-md focus:ring-soft-amber focus:border-soft-amber"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-graphite mb-1">
                          Map Embed URL
                          <span className="text-xs text-drift-gray ml-2 font-normal">(Google Maps embed URL)</span>
                        </label>
                        <input
                          type="url"
                          value={landingContent.branding.contact.mapUrl || ""}
                          onChange={(e) => handleBrandingContactChange("mapUrl", e.target.value)}
                          className="w-full px-3 py-2 border border-earth-beige rounded-md focus:ring-soft-amber focus:border-soft-amber"
                          placeholder="https://www.google.com/maps/embed?pb=..."
                        />
                        <div className="mt-2 p-3 bg-amber-50/50 border border-amber-200/50 rounded-lg">
                          <p className="text-xs font-semibold text-graphite mb-1.5">How to get Google Maps embed URL:</p>
                          <ol className="text-xs text-drift-gray space-y-1 list-decimal list-inside mb-2">
                            <li>Go to <a href="https://www.google.com/maps" target="_blank" rel="noopener noreferrer" className="text-soft-amber hover:underline">Google Maps</a> and search for your location</li>
                            <li>Click the <strong>"Share"</strong> button</li>
                            <li>Select the <strong>"Embed a map"</strong> tab</li>
                            <li>Click <strong>"Copy HTML"</strong> button</li>
                            <li>Extract the URL from the iframe: Look for <code className="bg-white px-1 rounded">src="..."</code> and copy only the URL inside the quotes</li>
                            <li>Paste the URL in the field above (should start with <code className="bg-white px-1 rounded">https://www.google.com/maps/embed</code>)</li>
                          </ol>
                          <div className="mt-2 p-2 bg-white rounded border border-amber-200">
                            <p className="text-xs font-semibold text-graphite mb-1">Example URL format:</p>
                            <code className="text-xs text-drift-gray break-all">
                              https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d...
                            </code>
                          </div>
                        </div>
                        {landingContent.branding.contact.mapUrl && (
                          <div className="mt-3 p-2 bg-green-50 border border-green-200 rounded-lg">
                            <p className="text-xs text-green-800 flex items-center gap-1">
                              <CheckCircle className="h-3 w-3" />
                              Map URL configured. The map will be displayed on the landing page.
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-graphite mb-1">Footer Description</label>
                        <textarea
                          rows={3}
                          value={landingContent.branding.footer.description}
                          onChange={(e) => handleBrandingFooterChange("description", e.target.value)}
                          className="w-full px-3 py-2 border border-earth-beige rounded-md focus:ring-soft-amber focus:border-soft-amber"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-graphite mb-1">
                          Footer Note (Copyright Text)
                        </label>
                        <input
                          type="text"
                          value={landingContent.branding.footer.note}
                          onChange={(e) => handleBrandingFooterChange("note", e.target.value)}
                          className="w-full px-3 py-2 border border-earth-beige rounded-md focus:ring-soft-amber focus:border-soft-amber"
                          placeholder="All rights reserved."
                        />
                        <p className="text-xs text-drift-gray mt-1">
                          This text appears after the copyright year and brand name in the footer.
                        </p>
                        <div className="mt-2 p-3 bg-pale-stone/30 rounded-md border border-earth-beige/30">
                          <p className="text-xs text-drift-gray">
                            <span className="font-semibold">Preview:</span> © {new Date().getFullYear()} {landingContent.branding.name || "Smart Care"}. {landingContent.branding.footer.note || "All rights reserved."}
                          </p>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                          <label className="block text-sm font-medium text-graphite mb-1">Facebook</label>
                          <input
                            type="url"
                            value={landingContent.branding.footer.socials.facebook}
                            onChange={(e) => handleBrandingSocialChange("facebook", e.target.value)}
                            className="w-full px-3 py-2 border border-earth-beige rounded-md focus:ring-soft-amber focus:border-soft-amber"
                            placeholder="https://facebook.com/yourpage"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-graphite mb-1">Twitter/X</label>
                          <input
                            type="url"
                            value={landingContent.branding.footer.socials.twitter}
                            onChange={(e) => handleBrandingSocialChange("twitter", e.target.value)}
                            className="w-full px-3 py-2 border border-earth-beige rounded-md focus:ring-soft-amber focus:border-soft-amber"
                            placeholder="https://twitter.com/yourhandle"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-graphite mb-1">Instagram</label>
                          <input
                            type="url"
                            value={landingContent.branding.footer.socials.instagram}
                            onChange={(e) => handleBrandingSocialChange("instagram", e.target.value)}
                            className="w-full px-3 py-2 border border-earth-beige rounded-md focus:ring-soft-amber focus:border-soft-amber"
                            placeholder="https://instagram.com/yourprofile"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="logo" className="space-y-6 mt-0">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center">
                    <Edit className="h-5 w-5 mr-2 text-soft-amber" />
                    Logo Settings
                  </CardTitle>
                  <CardDescription>Customize the application logo that appears in navigation bars</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div className="grid gap-6 md:grid-cols-2">
                      <div className="space-y-4">
                        <div>
                          <label htmlFor="logo-text" className="block text-sm font-medium text-graphite mb-1">
                            Logo Text (used when no image is uploaded)
                          </label>
                          <input
                            type="text"
                            id="logo-text"
                            value={logoContent.text}
                            onChange={(e) => handleLogoChange("text", e.target.value)}
                            className="w-full px-3 py-2 border border-earth-beige rounded-md focus:ring-soft-amber focus:border-soft-amber"
                          />
                        </div>
                        <div>
                          <label htmlFor="logo-color" className="block text-sm font-medium text-graphite mb-1">
                            Logo Text Color
                          </label>
                          <div className="flex items-center space-x-2">
                            <input
                              type="color"
                              id="logo-color"
                              value={logoContent.color}
                              onChange={(e) => handleLogoChange("color", e.target.value)}
                              className="w-10 h-10 border border-earth-beige rounded-md"
                            />
                            <input
                              type="text"
                              value={logoContent.color}
                              onChange={(e) => handleLogoChange("color", e.target.value)}
                              className="flex-1 px-3 py-2 border border-earth-beige rounded-md focus:ring-soft-amber focus:border-soft-amber"
                            />
                          </div>
                        </div>
                      </div>
                      <div className="space-y-4">
                        <div>
                          <label htmlFor="logo-font-size" className="block text-sm font-medium text-graphite mb-1">
                            Font Size
                          </label>
                          <select
                            id="logo-font-size"
                            value={logoContent.fontSize}
                            onChange={(e) => handleLogoChange("fontSize", e.target.value)}
                            className="w-full px-3 py-2 border border-earth-beige rounded-md focus:ring-soft-amber focus:border-soft-amber"
                          >
                            <option value="text-sm">Small</option>
                            <option value="text-base">Medium</option>
                            <option value="text-lg">Large</option>
                            <option value="text-xl">Extra Large</option>
                            <option value="text-2xl">2XL</option>
                            <option value="text-3xl">3XL</option>
                          </select>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label htmlFor="logo-font-weight" className="block text-sm font-medium text-graphite mb-1">
                              Font Weight
                            </label>
                            <select
                              id="logo-font-weight"
                              value={logoContent.fontWeight}
                              onChange={(e) => handleLogoChange("fontWeight", e.target.value)}
                              className="w-full px-3 py-2 border border-earth-beige rounded-md focus:ring-soft-amber focus:border-soft-amber"
                            >
                              <option value="font-normal">Normal</option>
                              <option value="font-medium">Medium</option>
                              <option value="font-semibold">Semibold</option>
                              <option value="font-bold">Bold</option>
                              <option value="font-extrabold">Extra Bold</option>
                            </select>
                          </div>
                          <div>
                            <label htmlFor="logo-image-height" className="block text-sm font-medium text-graphite mb-1">
                              Logo Image Height (px)
                            </label>
                            <input
                              type="number"
                              id="logo-image-height"
                              min={16}
                              max={120}
                              step={2}
                              value={logoContent.imageHeight || 32}
                              onChange={(e) => handleLogoChange("imageHeight", Number(e.target.value) || 32)}
                              className="w-full px-3 py-2 border border-earth-beige rounded-md focus:ring-soft-amber focus:border-soft-amber"
                            />
                            <p className="text-xs text-drift-gray mt-1">Applies to header/navigation logos.</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Logo Image Upload Section */}
                    <div className="mt-6 border border-earth-beige rounded-md p-4">
                      <h3 className="font-medium text-graphite mb-4">Logo Image</h3>
                      <div className="space-y-4">
                        <div className="border border-earth-beige rounded-md p-4 bg-pale-stone/20">
                          <div className="h-24 sm:h-28 bg-white rounded-md overflow-hidden mb-4 flex items-center justify-center px-4">
                            {logoContent.imageUrl ? (
                              <img
                                src={logoContent.imageUrl || "/placeholder.svg"}
                                alt="Logo"
                                className="h-full w-full object-contain"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-drift-gray">
                                <ImageIcon className="h-8 w-8 mr-2 text-drift-gray/50" />
                                No logo image uploaded
                              </div>
                            )}
                          </div>
                          <div className="flex space-x-2">
                            <label className="flex items-center px-4 py-2 bg-white border border-earth-beige rounded-md text-sm font-medium text-graphite hover:bg-pale-stone cursor-pointer">
                              <Upload className="w-4 h-4 mr-2" />
                              Upload Logo
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={handleLogoImageUpload}
                                disabled={uploadingImage.isUploading}
                              />
                            </label>
                            {logoContent.imageUrl && (
                              <button
                                onClick={handleLogoImageDelete}
                                className="flex items-center px-4 py-2 bg-white border border-earth-beige rounded-md text-sm font-medium text-red-500 hover:bg-pale-stone"
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Delete Logo
                              </button>
                            )}
                          </div>
                          <p className="text-xs text-drift-gray mt-2">
                            Max file size: 500KB. Recommended dimensions: 300–400px wide, transparent PNG.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="mt-6 p-4 border border-earth-beige rounded-md">
                      <h3 className="font-medium text-graphite mb-4">Logo Preview</h3>
                      <div className="flex flex-col space-y-4">
                        <div className="p-4 bg-white border border-earth-beige rounded-md">
                          {logoContent.imageUrl ? (
                            <div className="flex items-center">
                              <img
                                src={logoContent.imageUrl || "/placeholder.svg"}
                                alt="Logo"
                                className="h-12 sm:h-14 object-contain"
                              />
                              <span className="ml-2 rounded-md bg-soft-amber px-2 py-1 text-xs font-medium text-white">
                                Preview
                              </span>
                            </div>
                          ) : (
                            <div className="flex items-center">
                              <span
                                className={`${logoContent.fontSize} ${logoContent.fontWeight}`}
                                style={{ color: logoContent.color }}
                              >
                                {logoContent.text}
                              </span>
                              <span className="ml-2 rounded-md bg-soft-amber px-2 py-1 text-xs font-medium text-white">
                                Preview
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </CardContent>
        </Card>
      </Tabs>
    </div>
  )
}
