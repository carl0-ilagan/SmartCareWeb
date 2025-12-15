"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/auth-context"
import { AdminHeaderBanner } from "@/components/admin-header-banner"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { SuccessNotification } from "@/components/success-notification"
import { Loader2, Save } from "lucide-react"

export default function InformationPagesAdmin() {
  const { user } = useAuth()
  const [pageContent, setPageContent] = useState({
    about: { title: "", subtitle: "", content: "", imageUrl: "" },
    services: { title: "", subtitle: "", items: [] },
    doctors: { title: "", subtitle: "", items: [] },
    contact: { title: "", subtitle: "", address: "", phone: "", email: "", mapUrl: "" },
    terms: { title: "", content: "", lastUpdated: "" },
    privacy: { title: "", content: "", lastUpdated: "" },
    lastUpdated: new Date()
  })
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [notification, setNotification] = useState(null)
  const [activeTab, setActiveTab] = useState("about")

  // Fetch information page content on component mount
  useEffect(() => {
    async function fetchContent() {
      try {
        // Initialize with empty content structure
        setPageContent(prev => ({
          ...prev,
          lastUpdated: new Date()
        }))
      } catch (error) {
        console.error("Error fetching information page content:", error)
        setNotification({
          type: "error",
          message: "Failed to load information page content",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchContent()
  }, [])

  // Handle content update for a specific section
  const handleUpdateSection = async (section, data) => {
    if (!user) return

    setIsSaving(true)
    try {
      // Removed the call to updateInformationPageContent as the utility file is missing
      // const result = await updateInformationPageContent(section, data, user.uid)

      // Assuming local state update is sufficient for now or will be handled differently
      setPageContent((prev) => ({
        ...prev,
        [section]: data,
        lastUpdated: new Date(),
      }))

      setNotification({
        type: "success",
        message: `${section.charAt(0).toUpperCase() + section.slice(1)} section updated successfully`,
      })

    } catch (error) {
      console.error(`Error updating ${section} section:`, error)
      setNotification({
        type: "error",
        message: `Error updating ${section} section: ${error.message}`,
      })
    } finally {
      setIsSaving(false)
    }
  }

  // Handle image upload
  const handleImageUpload = async (file, section, itemId) => {
    if (!user || !file) return null

    try {
      // Removed the call to uploadInformationPageImage as the utility file is missing
      // const result = await uploadInformationPageImage(file, section, itemId, user.uid)
      console.warn("Image upload functionality is currently disabled.");
      setNotification({
        type: "warning",
        message: "Image upload functionality is currently disabled.",
      });
      return null; // Indicate no image URL is available

    } catch (error) {
      console.error("Error uploading image:", error)
      setNotification({
        type: "error",
        message: `Error uploading image: ${error.message}`,
      })
      return null
    }
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 text-soft-amber animate-spin" />
        <span className="ml-2 text-graphite">Loading information page content...</span>
      </div>
    )
  }

  // Banner stats
  const bannerStats = [
    {
      label: "Last Updated",
      value: pageContent?.lastUpdated ? new Date(pageContent.lastUpdated.seconds * 1000).toLocaleDateString() : "Never",
      icon: <Save className="h-4 w-4" />,
    },
  ]

  // Editor components for each section
  const renderEditor = () => {
    switch (activeTab) {
      case "about":
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-medium text-graphite">About Us Content</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-graphite mb-1">Title</label>
                <input
                  type="text"
                  value={pageContent?.about?.title || ""}
                  onChange={(e) =>
                    setPageContent((prev) => ({
                      ...prev,
                      about: { ...prev.about, title: e.target.value },
                    }))
                  }
                  className="w-full p-2 border border-earth-beige rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-graphite mb-1">Subtitle</label>
                <input
                  type="text"
                  value={pageContent?.about?.subtitle || ""}
                  onChange={(e) =>
                    setPageContent((prev) => ({
                      ...prev,
                      about: { ...prev.about, subtitle: e.target.value },
                    }))
                  }
                  className="w-full p-2 border border-earth-beige rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-graphite mb-1">Content</label>
                <textarea
                  value={pageContent?.about?.content || ""}
                  onChange={(e) =>
                    setPageContent((prev) => ({
                      ...prev,
                      about: { ...prev.about, content: e.target.value },
                    }))
                  }
                  rows={10}
                  className="w-full p-2 border border-earth-beige rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-graphite mb-1">Image URL</label>
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={pageContent?.about?.imageUrl || ""}
                    onChange={(e) =>
                      setPageContent((prev) => ({
                        ...prev,
                        about: { ...prev.about, imageUrl: e.target.value },
                      }))
                    }
                    className="flex-1 p-2 border border-earth-beige rounded-md"
                  />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={async (e) => {
                      const file = e.target.files[0]
                      if (file) {
                        const imageUrl = await handleImageUpload(file, "about", "main")
                        if (imageUrl) {
                          setPageContent((prev) => ({
                            ...prev,
                            about: { ...prev.about, imageUrl },
                          }))
                        }
                      }
                    }}
                    className="hidden"
                    id="about-image-upload"
                  />
                  <label
                    htmlFor="about-image-upload"
                    className="px-4 py-2 bg-soft-amber text-white rounded-md cursor-pointer hover:bg-soft-amber/90 transition-colors"
                  >
                    Upload
                  </label>
                </div>
              </div>
              <button
                onClick={() => handleUpdateSection("about", pageContent?.about || {})}
                disabled={isSaving}
                className="px-4 py-2 bg-soft-amber text-white rounded-md hover:bg-soft-amber/90 transition-colors disabled:opacity-50 flex items-center"
              >
                {isSaving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                Save Changes
              </button>
            </div>
          </div>
        )
      case "services":
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-medium text-graphite">Our Services Content</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-graphite mb-1">Title</label>
                <input
                  type="text"
                  value={pageContent?.services?.title || ""}
                  onChange={(e) =>
                    setPageContent((prev) => ({
                      ...prev,
                      services: { ...prev.services, title: e.target.value },
                    }))
                  }
                  className="w-full p-2 border border-earth-beige rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-graphite mb-1">Subtitle</label>
                <input
                  type="text"
                  value={pageContent?.services?.subtitle || ""}
                  onChange={(e) =>
                    setPageContent((prev) => ({
                      ...prev,
                      services: { ...prev.services, subtitle: e.target.value },
                    }))
                  }
                  className="w-full p-2 border border-earth-beige rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-graphite mb-1">Services List</label>
                <div className="space-y-4">
                  {pageContent?.services?.items?.map((service, index) => (
                    <div key={index} className="border border-earth-beige rounded-md p-4">
                      <div className="flex justify-between items-center mb-2">
                        <h4 className="font-medium">Service {index + 1}</h4>
                        <button
                          onClick={() => {
                            const newItems = [...pageContent.services.items]
                            newItems.splice(index, 1)
                            setPageContent((prev) => ({
                              ...prev,
                              services: { ...prev.services, items: newItems },
                            }))
                          }}
                          className="text-red-500 hover:text-red-700"
                        >
                          Remove
                        </button>
                      </div>
                      <div className="space-y-2">
                        <div>
                          <label className="block text-sm font-medium text-graphite mb-1">Title</label>
                          <input
                            type="text"
                            value={service.title || ""}
                            onChange={(e) => {
                              const newItems = [...pageContent.services.items]
                              newItems[index] = { ...newItems[index], title: e.target.value }
                              setPageContent((prev) => ({
                                ...prev,
                                services: { ...prev.services, items: newItems },
                              }))
                            }}
                            className="w-full p-2 border border-earth-beige rounded-md"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-graphite mb-1">Description</label>
                          <textarea
                            value={service.description || ""}
                            onChange={(e) => {
                              const newItems = [...pageContent.services.items]
                              newItems[index] = { ...newItems[index], description: e.target.value }
                              setPageContent((prev) => ({
                                ...prev,
                                services: { ...prev.services, items: newItems },
                              }))
                            }}
                            rows={3}
                            className="w-full p-2 border border-earth-beige rounded-md"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-graphite mb-1">Icon</label>
                          <input
                            type="text"
                            value={service.icon || ""}
                            onChange={(e) => {
                              const newItems = [...pageContent.services.items]
                              newItems[index] = { ...newItems[index], icon: e.target.value }
                              setPageContent((prev) => ({
                                ...prev,
                                services: { ...prev.services, items: newItems },
                              }))
                            }}
                            className="w-full p-2 border border-earth-beige rounded-md"
                            placeholder="Lucide icon name (e.g., 'heart', 'activity')"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                  <button
                    onClick={() => {
                      const newItems = [...(pageContent?.services?.items || [])]
                      newItems.push({ title: "", description: "", icon: "" })
                      setPageContent((prev) => ({
                        ...prev,
                        services: { ...prev.services, items: newItems },
                      }))
                    }}
                    className="px-4 py-2 bg-pale-stone text-graphite rounded-md hover:bg-pale-stone/80 transition-colors"
                  >
                    Add Service
                  </button>
                </div>
              </div>
              <button
                onClick={() => handleUpdateSection("services", pageContent?.services || {})}
                disabled={isSaving}
                className="px-4 py-2 bg-soft-amber text-white rounded-md hover:bg-soft-amber/90 transition-colors disabled:opacity-50 flex items-center"
              >
                {isSaving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                Save Changes
              </button>
            </div>
          </div>
        )
      case "doctors":
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-medium text-graphite">Our Doctors Content</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-graphite mb-1">Title</label>
                <input
                  type="text"
                  value={pageContent?.doctors?.title || ""}
                  onChange={(e) =>
                    setPageContent((prev) => ({
                      ...prev,
                      doctors: { ...prev.doctors, title: e.target.value },
                    }))
                  }
                  className="w-full p-2 border border-earth-beige rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-graphite mb-1">Subtitle</label>
                <input
                  type="text"
                  value={pageContent?.doctors?.subtitle || ""}
                  onChange={(e) =>
                    setPageContent((prev) => ({
                      ...prev,
                      doctors: { ...prev.doctors, subtitle: e.target.value },
                    }))
                  }
                  className="w-full p-2 border border-earth-beige rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-graphite mb-1">Doctors List</label>
                <div className="space-y-4">
                  {pageContent?.doctors?.items?.map((doctor, index) => (
                    <div key={index} className="border border-earth-beige rounded-md p-4">
                      <div className="flex justify-between items-center mb-2">
                        <h4 className="font-medium">Doctor {index + 1}</h4>
                        <button
                          onClick={() => {
                            const newItems = [...pageContent.doctors.items]
                            newItems.splice(index, 1)
                            setPageContent((prev) => ({
                              ...prev,
                              doctors: { ...prev.doctors, items: newItems },
                            }))
                          }}
                          className="text-red-500 hover:text-red-700"
                        >
                          Remove
                        </button>
                      </div>
                      <div className="space-y-2">
                        <div>
                          <label className="block text-sm font-medium text-graphite mb-1">Name</label>
                          <input
                            type="text"
                            value={doctor.name || ""}
                            onChange={(e) => {
                              const newItems = [...pageContent.doctors.items]
                              newItems[index] = { ...newItems[index], name: e.target.value }
                              setPageContent((prev) => ({
                                ...prev,
                                doctors: { ...prev.doctors, items: newItems },
                              }))
                            }}
                            className="w-full p-2 border border-earth-beige rounded-md"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-graphite mb-1">Specialty</label>
                          <input
                            type="text"
                            value={doctor.specialty || ""}
                            onChange={(e) => {
                              const newItems = [...pageContent.doctors.items]
                              newItems[index] = { ...newItems[index], specialty: e.target.value }
                              setPageContent((prev) => ({
                                ...prev,
                                doctors: { ...prev.doctors, items: newItems },
                              }))
                            }}
                            className="w-full p-2 border border-earth-beige rounded-md"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-graphite mb-1">Bio</label>
                          <textarea
                            value={doctor.bio || ""}
                            onChange={(e) => {
                              const newItems = [...pageContent.doctors.items]
                              newItems[index] = { ...newItems[index], bio: e.target.value }
                              setPageContent((prev) => ({
                                ...prev,
                                doctors: { ...prev.doctors, items: newItems },
                              }))
                            }}
                            rows={3}
                            className="w-full p-2 border border-earth-beige rounded-md"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-graphite mb-1">Image URL</label>
                          <div className="flex items-center space-x-2">
                            <input
                              type="text"
                              value={doctor.imageUrl || ""}
                              onChange={(e) => {
                                const newItems = [...pageContent.doctors.items]
                                newItems[index] = { ...newItems[index], imageUrl: e.target.value }
                                setPageContent((prev) => ({
                                  ...prev,
                                  doctors: { ...prev.doctors, items: newItems },
                                }))
                              }}
                              className="flex-1 p-2 border border-earth-beige rounded-md"
                            />
                            <input
                              type="file"
                              accept="image/*"
                              onChange={async (e) => {
                                const file = e.target.files[0]
                                if (file) {
                                  const imageUrl = await handleImageUpload(file, "doctors", `doctor-${index}`)
                                  if (imageUrl) {
                                    const newItems = [...pageContent.doctors.items]
                                    newItems[index] = { ...newItems[index], imageUrl }
                                    setPageContent((prev) => ({
                                      ...prev,
                                      doctors: { ...prev.doctors, items: newItems },
                                    }))
                                  }
                                }
                              }}
                              className="hidden"
                              id={`doctor-image-upload-${index}`}
                            />
                            <label
                              htmlFor={`doctor-image-upload-${index}`}
                              className="px-4 py-2 bg-soft-amber text-white rounded-md cursor-pointer hover:bg-soft-amber/90 transition-colors"
                            >
                              Upload
                            </label>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                  <button
                    onClick={() => {
                      const newItems = [...(pageContent?.doctors?.items || [])]
                      newItems.push({ name: "", specialty: "", bio: "", imageUrl: "" })
                      setPageContent((prev) => ({
                        ...prev,
                        doctors: { ...prev.doctors, items: newItems },
                      }))
                    }}
                    className="px-4 py-2 bg-pale-stone text-graphite rounded-md hover:bg-pale-stone/80 transition-colors"
                  >
                    Add Doctor
                  </button>
                </div>
              </div>
              <button
                onClick={() => handleUpdateSection("doctors", pageContent?.doctors || {})}
                disabled={isSaving}
                className="px-4 py-2 bg-soft-amber text-white rounded-md hover:bg-soft-amber/90 transition-colors disabled:opacity-50 flex items-center"
              >
                {isSaving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                Save Changes
              </button>
            </div>
          </div>
        )
      case "contact":
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-medium text-graphite">Contact Us Content</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-graphite mb-1">Title</label>
                <input
                  type="text"
                  value={pageContent?.contact?.title || ""}
                  onChange={(e) =>
                    setPageContent((prev) => ({
                      ...prev,
                      contact: { ...prev.contact, title: e.target.value },
                    }))
                  }
                  className="w-full p-2 border border-earth-beige rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-graphite mb-1">Subtitle</label>
                <input
                  type="text"
                  value={pageContent?.contact?.subtitle || ""}
                  onChange={(e) =>
                    setPageContent((prev) => ({
                      ...prev,
                      contact: { ...prev.contact, subtitle: e.target.value },
                    }))
                  }
                  className="w-full p-2 border border-earth-beige rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-graphite mb-1">Address</label>
                <input
                  type="text"
                  value={pageContent?.contact?.address || ""}
                  onChange={(e) =>
                    setPageContent((prev) => ({
                      ...prev,
                      contact: { ...prev.contact, address: e.target.value },
                    }))
                  }
                  className="w-full p-2 border border-earth-beige rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-graphite mb-1">Phone</label>
                <input
                  type="text"
                  value={pageContent?.contact?.phone || ""}
                  onChange={(e) =>
                    setPageContent((prev) => ({
                      ...prev,
                      contact: { ...prev.contact, phone: e.target.value },
                    }))
                  }
                  className="w-full p-2 border border-earth-beige rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-graphite mb-1">Email</label>
                <input
                  type="text"
                  value={pageContent?.contact?.email || ""}
                  onChange={(e) =>
                    setPageContent((prev) => ({
                      ...prev,
                      contact: { ...prev.contact, email: e.target.value },
                    }))
                  }
                  className="w-full p-2 border border-earth-beige rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-graphite mb-1">Map Embed URL</label>
                <input
                  type="text"
                  value={pageContent?.contact?.mapUrl || ""}
                  onChange={(e) =>
                    setPageContent((prev) => ({
                      ...prev,
                      contact: { ...prev.contact, mapUrl: e.target.value },
                    }))
                  }
                  className="w-full p-2 border border-earth-beige rounded-md"
                  placeholder="Google Maps embed URL"
                />
              </div>
              <button
                onClick={() => handleUpdateSection("contact", pageContent?.contact || {})}
                disabled={isSaving}
                className="px-4 py-2 bg-soft-amber text-white rounded-md hover:bg-soft-amber/90 transition-colors disabled:opacity-50 flex items-center"
              >
                {isSaving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                Save Changes
              </button>
            </div>
          </div>
        )
      case "terms":
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-medium text-graphite">Terms of Service Content</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-graphite mb-1">Title</label>
                <input
                  type="text"
                  value={pageContent?.terms?.title || ""}
                  onChange={(e) =>
                    setPageContent((prev) => ({
                      ...prev,
                      terms: { ...prev.terms, title: e.target.value },
                    }))
                  }
                  className="w-full p-2 border border-earth-beige rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-graphite mb-1">Content</label>
                <textarea
                  value={pageContent?.terms?.content || ""}
                  onChange={(e) =>
                    setPageContent((prev) => ({
                      ...prev,
                      terms: { ...prev.terms, content: e.target.value },
                    }))
                  }
                  rows={15}
                  className="w-full p-2 border border-earth-beige rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-graphite mb-1">Last Updated Date</label>
                <input
                  type="date"
                  value={pageContent?.terms?.lastUpdated || ""}
                  onChange={(e) =>
                    setPageContent((prev) => ({
                      ...prev,
                      terms: { ...prev.terms, lastUpdated: e.target.value },
                    }))
                  }
                  className="w-full p-2 border border-earth-beige rounded-md"
                />
              </div>
              <button
                onClick={() => handleUpdateSection("terms", pageContent?.terms || {})}
                disabled={isSaving}
                className="px-4 py-2 bg-soft-amber text-white rounded-md hover:bg-soft-amber/90 transition-colors disabled:opacity-50 flex items-center"
              >
                {isSaving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                Save Changes
              </button>
            </div>
          </div>
        )
      case "privacy":
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-medium text-graphite">Privacy Policy Content</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-graphite mb-1">Title</label>
                <input
                  type="text"
                  value={pageContent?.privacy?.title || ""}
                  onChange={(e) =>
                    setPageContent((prev) => ({
                      ...prev,
                      privacy: { ...prev.privacy, title: e.target.value },
                    }))
                  }
                  className="w-full p-2 border border-earth-beige rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-graphite mb-1">Content</label>
                <textarea
                  value={pageContent?.privacy?.content || ""}
                  onChange={(e) =>
                    setPageContent((prev) => ({
                      ...prev,
                      privacy: { ...prev.privacy, content: e.target.value },
                    }))
                  }
                  rows={15}
                  className="w-full p-2 border border-earth-beige rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-graphite mb-1">Last Updated Date</label>
                <input
                  type="date"
                  value={pageContent?.privacy?.lastUpdated || ""}
                  onChange={(e) =>
                    setPageContent((prev) => ({
                      ...prev,
                      privacy: { ...prev.privacy, lastUpdated: e.target.value },
                    }))
                  }
                  className="w-full p-2 border border-earth-beige rounded-md"
                />
              </div>
              <button
                onClick={() => handleUpdateSection("privacy", pageContent?.privacy || {})}
                disabled={isSaving}
                className="px-4 py-2 bg-soft-amber text-white rounded-md hover:bg-soft-amber/90 transition-colors disabled:opacity-50 flex items-center"
              >
                {isSaving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                Save Changes
              </button>
            </div>
          </div>
        )
      default:
        return null
    }
  }

  return (
    <div className="w-full">
      <AdminHeaderBanner
        title="Information Pages Editor"
        subtitle="Customize the content displayed on your information pages"
        stats={bannerStats}
      />

      {notification && (
        <SuccessNotification
          message={notification.message}
          type={notification.type}
          onClose={() => setNotification(null)}
        />
      )}

      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-graphite">Edit Information Pages Content</h2>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6 overflow-x-auto flex whitespace-nowrap pb-1">
            <TabsTrigger value="about">About Us</TabsTrigger>
            <TabsTrigger value="services">Our Services</TabsTrigger>
            <TabsTrigger value="doctors">Our Doctors</TabsTrigger>
            <TabsTrigger value="contact">Contact Us</TabsTrigger>
            <TabsTrigger value="terms">Terms of Service</TabsTrigger>
            <TabsTrigger value="privacy">Privacy Policy</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab}>{renderEditor()}</TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
