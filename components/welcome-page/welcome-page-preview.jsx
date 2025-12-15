"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ChevronRight, Users, Lightbulb, Clock, Star, ArrowRight, Stethoscope } from "lucide-react"

export function WelcomePagePreview({ content }) {
  const [activeSection, setActiveSection] = useState("all")

  if (!content) {
    return <div className="text-center p-6">No content available for preview</div>
  }

  const renderSection = (section) => {
    switch (section) {
      case "all":
        return (
          <div className="preview-all">
            <PreviewNavigation navigation={content.navigation} />
            <PreviewHero hero={content.hero} />
            <PreviewFeatures features={content.features} />
            <PreviewHowItWorks howItWorks={content.howItWorks} />
            <PreviewTestimonials testimonials={content.testimonials} />
            <PreviewCTA cta={content.cta} />
            <PreviewForDoctors forDoctors={content.forDoctors} />
          </div>
        )
      case "navigation":
        return <PreviewNavigation navigation={content.navigation} />
      case "hero":
        return <PreviewHero hero={content.hero} />
      case "features":
        return <PreviewFeatures features={content.features} />
      case "howItWorks":
        return <PreviewHowItWorks howItWorks={content.howItWorks} />
      case "testimonials":
        return <PreviewTestimonials testimonials={content.testimonials} />
      case "cta":
        return <PreviewCTA cta={content.cta} />
      case "forDoctors":
        return <PreviewForDoctors forDoctors={content.forDoctors} />
      default:
        return <div>Select a section to preview</div>
    }
  }

  return (
    <div className="bg-white rounded-lg border overflow-hidden">
      <div className="p-4 border-b bg-gray-50">
        <div className="flex flex-wrap gap-2">
          <Button
            variant={activeSection === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveSection("all")}
          >
            All Sections
          </Button>
          <Button
            variant={activeSection === "navigation" ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveSection("navigation")}
          >
            Navigation
          </Button>
          <Button
            variant={activeSection === "hero" ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveSection("hero")}
          >
            Hero
          </Button>
          <Button
            variant={activeSection === "features" ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveSection("features")}
          >
            Features
          </Button>
          <Button
            variant={activeSection === "howItWorks" ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveSection("howItWorks")}
          >
            How It Works
          </Button>
          <Button
            variant={activeSection === "testimonials" ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveSection("testimonials")}
          >
            Testimonials
          </Button>
          <Button
            variant={activeSection === "cta" ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveSection("cta")}
          >
            CTA
          </Button>
          <Button
            variant={activeSection === "forDoctors" ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveSection("forDoctors")}
          >
            For Doctors
          </Button>
        </div>
      </div>

      <div className="preview-container overflow-y-auto max-h-[600px]">{renderSection(activeSection)}</div>
    </div>
  )
}

// Navigation Preview Component
function PreviewNavigation({ navigation }) {
  if (!navigation || navigation.length === 0) {
    return <div className="text-center p-4">No navigation items available</div>
  }

  return (
    <div className="border-b p-4">
      <h3 className="text-sm font-medium text-gray-500 mb-2">NAVIGATION PREVIEW</h3>
      <div className="bg-white p-4 rounded-lg shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-soft-amber rounded-md flex items-center justify-center text-white font-bold">
              SC
            </div>
            <span className="ml-2 font-semibold">Smart Care</span>
          </div>
          <div className="hidden md:flex space-x-6">
            {navigation.map((item, index) => (
              <div key={index} className="text-sm font-medium hover:text-soft-amber cursor-pointer">
                {item.label}
              </div>
            ))}
          </div>
          <div>
            <Button size="sm" variant="outline" className="mr-2">
              Log In
            </Button>
            <Button size="sm" className="bg-soft-amber hover:bg-soft-amber/90">
              Sign Up
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

// Hero Preview Component
function PreviewHero({ hero }) {
  if (!hero) {
    return <div className="text-center p-4">No hero content available</div>
  }

  return (
    <div className="border-b p-4">
      <h3 className="text-sm font-medium text-gray-500 mb-2">HERO PREVIEW</h3>
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <div className="grid md:grid-cols-2 gap-6 items-center">
          <div>
            <h1 className="text-3xl font-bold mb-4">{hero.title || "Healthcare Made Simple"}</h1>
            <p className="text-gray-600 mb-6">
              {hero.subtitle ||
                "Connect with doctors, manage appointments, and access your medical records all in one place."}
            </p>
            <div className="flex space-x-4">
              <Button className="bg-soft-amber hover:bg-soft-amber/90">
                {hero.primaryButton?.label || "Get Started"}
              </Button>
              <Button variant="outline" className="flex items-center">
                {hero.secondaryButton?.label || "Learn More"} <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </div>
          </div>
          <div className="flex justify-center">
            <div className="bg-gray-200 rounded-lg w-full h-64 flex items-center justify-center">
              {hero.imageUrl ? (
                <img
                  src={hero.imageUrl || "/placeholder.svg"}
                  alt="Hero"
                  className="object-cover w-full h-full rounded-lg"
                />
              ) : (
                <span className="text-gray-400">Hero Image</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Features Preview Component
function PreviewFeatures({ features }) {
  if (!features || !features.length) {
    return <div className="text-center p-4">No features available</div>
  }

  const getIconComponent = (iconName) => {
    switch (iconName) {
      case "Users":
        return <Users className="h-6 w-6 text-soft-amber" />
      case "Lightbulb":
        return <Lightbulb className="h-6 w-6 text-soft-amber" />
      case "Clock":
        return <Clock className="h-6 w-6 text-soft-amber" />
      default:
        return <Star className="h-6 w-6 text-soft-amber" />
    }
  }

  return (
    <div className="border-b p-4">
      <h3 className="text-sm font-medium text-gray-500 mb-2">FEATURES PREVIEW</h3>
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <h2 className="text-2xl font-bold text-center mb-8">Key Features</h2>
        <div className="grid md:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <Card key={index} className="overflow-hidden">
              <CardContent className="p-6">
                <div className="mb-4">{getIconComponent(feature.icon)}</div>
                <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                <p className="text-gray-600 text-sm">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}

// How It Works Preview Component
function PreviewHowItWorks({ howItWorks }) {
  if (!howItWorks || !howItWorks.steps || !howItWorks.steps.length) {
    return <div className="text-center p-4">No "How It Works" content available</div>
  }

  return (
    <div className="border-b p-4">
      <h3 className="text-sm font-medium text-gray-500 mb-2">HOW IT WORKS PREVIEW</h3>
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <h2 className="text-2xl font-bold text-center mb-2">{howItWorks.title || "How It Works"}</h2>
        <p className="text-gray-600 text-center mb-8">
          {howItWorks.subtitle || "Simple steps to get started with Smart Care"}
        </p>

        <div className="space-y-8">
          {howItWorks.steps.map((step, index) => (
            <div key={index} className="flex items-start">
              <div className="flex-shrink-0 bg-soft-amber text-white rounded-full w-8 h-8 flex items-center justify-center font-bold">
                {step.number || index + 1}
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold">{step.title}</h3>
                <p className="text-gray-600">{step.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// Testimonials Preview Component
function PreviewTestimonials({ testimonials }) {
  if (!testimonials || !testimonials.length) {
    return <div className="text-center p-4">No testimonials available</div>
  }

  return (
    <div className="border-b p-4">
      <h3 className="text-sm font-medium text-gray-500 mb-2">TESTIMONIALS PREVIEW</h3>
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <h2 className="text-2xl font-bold text-center mb-8">What Our Users Say</h2>
        <div className="grid md:grid-cols-2 gap-6">
          {testimonials.slice(0, 2).map((testimonial, index) => (
            <Card key={index}>
              <CardContent className="p-6">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 rounded-full bg-gray-200 overflow-hidden">
                    {testimonial.avatarUrl ? (
                      <img
                        src={testimonial.avatarUrl || "/placeholder.svg"}
                        alt={testimonial.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        {testimonial.name?.charAt(0) || "U"}
                      </div>
                    )}
                  </div>
                  <div className="ml-4">
                    <h4 className="font-semibold">{testimonial.name}</h4>
                    <p className="text-gray-500 text-sm">{testimonial.role}</p>
                  </div>
                </div>
                <p className="text-gray-600 italic">"{testimonial.testimonial || testimonial.quote}"</p>
                <div className="flex mt-2">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`h-4 w-4 ${i < (testimonial.rating || 5) ? "text-yellow-400" : "text-gray-300"}`}
                      fill={i < (testimonial.rating || 5) ? "currentColor" : "none"}
                    />
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}

// CTA Preview Component
function PreviewCTA({ cta }) {
  if (!cta) {
    return <div className="text-center p-4">No CTA content available</div>
  }

  return (
    <div className="border-b p-4">
      <h3 className="text-sm font-medium text-gray-500 mb-2">CTA PREVIEW</h3>
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <div className="bg-soft-amber/10 p-8 rounded-lg text-center">
          <h2 className="text-2xl font-bold mb-4">{cta.title || "Ready to Get Started?"}</h2>
          <p className="text-gray-600 mb-6 max-w-lg mx-auto">
            {cta.subtitle || "Join thousands of patients and doctors who trust Smart Care for their healthcare needs."}
          </p>
          <Button className="bg-soft-amber hover:bg-soft-amber/90">
            {cta.primaryButton?.label || "Sign Up Now"} <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}

// For Doctors Preview Component
function PreviewForDoctors({ forDoctors }) {
  if (!forDoctors) {
    return <div className="text-center p-4">No "For Doctors" content available</div>
  }

  return (
    <div className="p-4">
      <h3 className="text-sm font-medium text-gray-500 mb-2">FOR DOCTORS PREVIEW</h3>
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <div className="grid md:grid-cols-2 gap-6 items-center">
          <div>
            <div className="flex items-center mb-4">
              <Stethoscope className="h-6 w-6 text-soft-amber mr-2" />
              <h3 className="text-lg font-semibold">{forDoctors.title || "For Healthcare Providers"}</h3>
            </div>
            <p className="text-gray-600 mb-6">
              {forDoctors.description ||
                "Smart Care provides tools to help you manage patients, appointments, and records efficiently."}
            </p>
            <Button className="bg-soft-amber hover:bg-soft-amber/90">
              {forDoctors.button?.label || "Join as a Doctor"}
            </Button>
          </div>
          <div className="flex justify-center">
            <div className="bg-gray-200 rounded-lg w-full h-64 flex items-center justify-center">
              {forDoctors.imageUrl ? (
                <img
                  src={forDoctors.imageUrl || "/placeholder.svg"}
                  alt="For Doctors"
                  className="object-cover w-full h-full rounded-lg"
                />
              ) : (
                <span className="text-gray-400">Doctor Image</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
