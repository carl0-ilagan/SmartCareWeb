"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { Loader2, MapPin, Phone, Mail } from "lucide-react"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"

export default function InformationPage({ params }) {
  const [pageContent, setPageContent] = useState({
    about: { title: "", subtitle: "", content: "", imageUrl: "" },
    services: { title: "", subtitle: "", items: [] },
    doctors: { title: "", subtitle: "", items: [] },
    contact: { title: "", subtitle: "", address: "", phone: "", email: "", mapUrl: "" },
    terms: { title: "", content: "", lastUpdated: "" },
    privacy: { title: "", content: "", lastUpdated: "" }
  })
  const [isLoading, setIsLoading] = useState(true)
  const section = params.section || "about"

  useEffect(() => {
    async function fetchContent() {
      try {
        // Initialize with empty content structure
        setPageContent(prev => ({
          ...prev,
          [section]: { ...prev[section] }
        }))
      } catch (error) {
        console.error("Error fetching information page content:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchContent()
  }, [section])

  if (isLoading) {
    return (
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 text-soft-amber animate-spin" />
          <span className="ml-2 text-graphite">Loading content...</span>
        </div>
        <Footer />
      </div>
    )
  }

  if (!pageContent || !pageContent[section]) {
    return (
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-graphite mb-2">Page Not Found</h1>
            <p className="text-drift-gray mb-4">The requested information page does not exist.</p>
            <Link href="/" className="text-soft-amber hover:underline">
              Return to Home
            </Link>
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  const renderContent = () => {
    switch (section) {
      case "about":
        return (
          <div className="max-w-4xl mx-auto px-4 py-12">
            <h1 className="text-3xl font-bold text-graphite mb-2">{pageContent.about.title}</h1>
            <h2 className="text-xl text-drift-gray mb-6">{pageContent.about.subtitle}</h2>
            <div className="flex flex-col md:flex-row gap-8 items-center">
              <div className="md:w-1/2">
                <div className="relative w-full h-64 md:h-80 rounded-lg overflow-hidden">
                  <Image
                    src={pageContent.about.imageUrl || "/placeholder.svg?height=400&width=600&query=healthcare%20team"}
                    alt="About Smart Care"
                    fill
                    className="object-cover"
                  />
                </div>
              </div>
              <div className="md:w-1/2">
                <div className="prose max-w-none">
                  {pageContent.about.content.split("\n").map((paragraph, index) => (
                    <p key={index} className="mb-4 text-graphite">
                      {paragraph}
                    </p>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )
      case "services":
        return (
          <div className="max-w-4xl mx-auto px-4 py-12">
            <h1 className="text-3xl font-bold text-graphite mb-2">{pageContent.services.title}</h1>
            <h2 className="text-xl text-drift-gray mb-8">{pageContent.services.subtitle}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {pageContent.services.items.map((service, index) => {
                const IconComponent = service.icon ? require("lucide-react")[service.icon] : null
                return (
                  <div key={index} className="bg-white rounded-lg shadow-sm p-6 border border-earth-beige">
                    <div className="flex items-center justify-center w-12 h-12 rounded-full bg-soft-amber/10 text-soft-amber mb-4">
                      {IconComponent ? <IconComponent className="h-6 w-6" /> : null}
                    </div>
                    <h3 className="text-lg font-semibold text-graphite mb-2">{service.title}</h3>
                    <p className="text-drift-gray">{service.description}</p>
                  </div>
                )
              })}
            </div>
          </div>
        )
      case "doctors":
        return (
          <div className="max-w-4xl mx-auto px-4 py-12">
            <h1 className="text-3xl font-bold text-graphite mb-2">{pageContent.doctors.title}</h1>
            <h2 className="text-xl text-drift-gray mb-8">{pageContent.doctors.subtitle}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {pageContent.doctors.items.map((doctor, index) => (
                <div key={index} className="bg-white rounded-lg shadow-sm p-6 border border-earth-beige">
                  <div className="flex flex-col sm:flex-row gap-4 items-center sm:items-start">
                    <div className="relative w-24 h-24 rounded-full overflow-hidden">
                      <Image
                        src={doctor.imageUrl || "/placeholder.svg?height=300&width=300&query=doctor"}
                        alt={doctor.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-graphite">{doctor.name}</h3>
                      <p className="text-soft-amber mb-2">{doctor.specialty}</p>
                      <p className="text-drift-gray">{doctor.bio}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )
      case "contact":
        return (
          <div className="max-w-4xl mx-auto px-4 py-12">
            <h1 className="text-3xl font-bold text-graphite mb-2">{pageContent.contact.title}</h1>
            <h2 className="text-xl text-drift-gray mb-8">{pageContent.contact.subtitle}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <div className="bg-white rounded-lg shadow-sm p-6 border border-earth-beige mb-6">
                  <h3 className="text-lg font-semibold text-graphite mb-4">Contact Information</h3>
                  <div className="space-y-4">
                    <div className="flex items-start">
                      <MapPin className="h-5 w-5 text-soft-amber mr-3 mt-0.5" />
                      <p className="text-drift-gray">{pageContent.contact.address}</p>
                    </div>
                    <div className="flex items-center">
                      <Phone className="h-5 w-5 text-soft-amber mr-3" />
                      <p className="text-drift-gray">{pageContent.contact.phone}</p>
                    </div>
                    <div className="flex items-center">
                      <Mail className="h-5 w-5 text-soft-amber mr-3" />
                      <p className="text-drift-gray">{pageContent.contact.email}</p>
                    </div>
                  </div>
                </div>
                <div className="bg-white rounded-lg shadow-sm p-6 border border-earth-beige">
                  <h3 className="text-lg font-semibold text-graphite mb-4">Send Us a Message</h3>
                  <form className="space-y-4">
                    <div>
                      <label htmlFor="name" className="block text-sm font-medium text-graphite mb-1">
                        Name
                      </label>
                      <input
                        type="text"
                        id="name"
                        className="w-full p-2 border border-earth-beige rounded-md"
                        placeholder="Your name"
                      />
                    </div>
                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-graphite mb-1">
                        Email
                      </label>
                      <input
                        type="email"
                        id="email"
                        className="w-full p-2 border border-earth-beige rounded-md"
                        placeholder="Your email"
                      />
                    </div>
                    <div>
                      <label htmlFor="message" className="block text-sm font-medium text-graphite mb-1">
                        Message
                      </label>
                      <textarea
                        id="message"
                        rows={4}
                        className="w-full p-2 border border-earth-beige rounded-md"
                        placeholder="Your message"
                      />
                    </div>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-soft-amber text-white rounded-md hover:bg-soft-amber/90 transition-colors"
                    >
                      Send Message
                    </button>
                  </form>
                </div>
              </div>
              <div className="bg-white rounded-lg shadow-sm p-2 border border-earth-beige h-[500px]">
                {pageContent.contact.mapUrl ? (
                  <iframe
                    src={pageContent.contact.mapUrl}
                    width="100%"
                    height="100%"
                    style={{ border: 0 }}
                    allowFullScreen=""
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    title="Smart Care Location"
                    className="rounded-md"
                  ></iframe>
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-pale-stone rounded-md">
                    <p className="text-drift-gray">Map not available</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )
      case "terms":
        return (
          <div className="max-w-4xl mx-auto px-4 py-12">
            <h1 className="text-3xl font-bold text-graphite mb-6">{pageContent.terms.title}</h1>
            <div className="bg-white rounded-lg shadow-sm p-6 border border-earth-beige">
              <div className="prose max-w-none">
                {pageContent.terms.content.split("\n\n").map((paragraph, index) => (
                  <p key={index} className="mb-4 text-graphite">
                    {paragraph}
                  </p>
                ))}
              </div>
              <div className="mt-6 pt-6 border-t border-earth-beige">
                <p className="text-sm text-drift-gray">
                  Last updated: {new Date(pageContent.terms.lastUpdated).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>
        )
      case "privacy":
        return (
          <div className="max-w-4xl mx-auto px-4 py-12">
            <h1 className="text-3xl font-bold text-graphite mb-6">{pageContent.privacy.title}</h1>
            <div className="bg-white rounded-lg shadow-sm p-6 border border-earth-beige">
              <div className="prose max-w-none">
                {pageContent.privacy.content.split("\n\n").map((paragraph, index) => (
                  <p key={index} className="mb-4 text-graphite">
                    {paragraph}
                  </p>
                ))}
              </div>
              <div className="mt-6 pt-6 border-t border-earth-beige">
                <p className="text-sm text-drift-gray">
                  Last updated: {new Date(pageContent.privacy.lastUpdated).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>
        )
      default:
        return (
          <div className="max-w-4xl mx-auto px-4 py-12">
            <h1 className="text-2xl font-bold text-graphite mb-2">Page Not Found</h1>
            <p className="text-drift-gray mb-4">The requested information page does not exist.</p>
            <Link href="/" className="text-soft-amber hover:underline">
              Return to Home
            </Link>
          </div>
        )
    }
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1 bg-pale-stone/30">{renderContent()}</main>
      <Footer />
    </div>
  )
}
