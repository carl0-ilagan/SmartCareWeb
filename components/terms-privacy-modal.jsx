"use client"

import { useState, useEffect } from "react"
import { FileText, Shield } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"

export function TermsPrivacyModal({ isOpen, onClose, type = "terms" }) {
  const [isVisible, setIsVisible] = useState(false)
  const [isClosing, setIsClosing] = useState(false)
  const [activeTab, setActiveTab] = useState(type) // "terms" or "privacy"
  const [isLoading, setIsLoading] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true)
      setIsClosing(false)
      setActiveTab(type)
    } else {
      const timer = setTimeout(() => {
        setIsVisible(false)
      }, 300)
      return () => clearTimeout(timer)
    }
  }, [isOpen, type])

  const handleTabChange = (newTab) => {
    if (newTab === activeTab) return
    
    setIsAnimating(true)
    setIsLoading(true)
    
    // Simulate loading with animation
    setTimeout(() => {
      setActiveTab(newTab)
      setIsLoading(false)
      setTimeout(() => {
        setIsAnimating(false)
      }, 200)
    }, 300)
  }

  const closeWithAnimation = () => {
    setIsClosing(true)
    setTimeout(() => {
      onClose?.()
    }, 300)
  }

  if (!isOpen && !isVisible) return null

  const termsContent = {
    title: "Terms of Service",
    icon: FileText,
    sections: [
      {
        title: "Acceptance",
        content: "By using Smart Care, you agree to these terms. If you don't agree, please don't use our service."
      },
      {
        title: "Medical Disclaimer",
        content: "Smart Care connects you with healthcare providers. Our service doesn't replace professional medical advice. Always consult your physician for medical conditions."
      },
      {
        title: "User Accounts",
        content: "You must provide accurate information and maintain account security. You're responsible for all activities under your account."
      },
      {
        title: "Account Approval",
        content: "New accounts require administrative approval. We reserve the right to approve or deny any registration."
      }
    ]
  }

  const privacyContent = {
    title: "Privacy Policy",
    icon: Shield,
    sections: [
      {
        title: "Information We Collect",
        content: "We collect personal and health information you provide, plus device and usage data when you use Smart Care."
      },
      {
        title: "Health Information Protection",
        content: "Your health information is protected under applicable laws including HIPAA. We implement safeguards to protect your data."
      },
      {
        title: "How We Use Information",
        content: "We use your information to provide services, facilitate communication with healthcare providers, process payments, and improve our platform."
      },
      {
        title: "Your Rights",
        content: "You can access, correct, or delete your personal information. Contact us at privacy@smartcare.com to exercise these rights."
      }
    ]
  }

  const currentContent = activeTab === "terms" ? termsContent : privacyContent
  const IconComponent = currentContent.icon

  return (
    <div className={`fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-6 transition-opacity duration-300 ${
      isVisible ? (isClosing ? "opacity-0" : "opacity-100") : "opacity-0"
    }`}>
      {/* Backdrop */}
      <div 
        className={`fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity duration-300 ${
          isVisible ? (isClosing ? "opacity-0" : "opacity-100") : "opacity-0"
        }`}
        onClick={closeWithAnimation}
      />
      
      {/* Modal */}
      <div 
        className={`relative w-full max-w-5xl mx-auto bg-white rounded-xl sm:rounded-2xl shadow-2xl transition-all duration-300 transform ${
          isVisible ? (isClosing ? "opacity-0 scale-95" : "opacity-100 scale-100") : "opacity-0 scale-95"
        } max-h-[90vh] overflow-hidden flex flex-col`}
      >
        {/* Header */}
        <div className="flex items-center p-4 sm:p-6 border-b border-earth-beige/30 bg-gradient-to-r from-pale-stone/50 to-white">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-amber-500/10 to-amber-50">
              <IconComponent className="h-5 w-5 sm:h-6 sm:w-6 text-amber-600" />
            </div>
            <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-graphite">
              {currentContent.title}
            </h2>
          </div>
        </div>

        {/* Content - Horizontal on desktop, vertical on mobile */}
        <div className="flex flex-col lg:flex-row flex-1 overflow-hidden">
          {/* Tabs Sidebar - Vertical on mobile, horizontal on desktop */}
          <div className="flex lg:flex-col gap-2 p-4 sm:p-6 border-b lg:border-b-0 lg:border-r border-earth-beige/30 bg-pale-stone/20">
            <button
              onClick={() => handleTabChange("terms")}
              disabled={isLoading}
              className={`flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg transition-all duration-300 transform ${
                activeTab === "terms"
                  ? "bg-white shadow-md border-2 border-amber-500/50 scale-105"
                  : "bg-white/50 hover:bg-white border-2 border-transparent hover:scale-105"
              } ${isLoading ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              <FileText className={`h-4 w-4 sm:h-5 sm:w-5 transition-colors duration-300 ${activeTab === "terms" ? "text-amber-600" : "text-drift-gray"}`} />
              <span className={`text-xs sm:text-sm font-medium transition-colors duration-300 ${activeTab === "terms" ? "text-amber-600" : "text-drift-gray"}`}>
                Terms
              </span>
            </button>
            <button
              onClick={() => handleTabChange("privacy")}
              disabled={isLoading}
              className={`flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg transition-all duration-300 transform ${
                activeTab === "privacy"
                  ? "bg-white shadow-md border-2 border-amber-500/50 scale-105"
                  : "bg-white/50 hover:bg-white border-2 border-transparent hover:scale-105"
              } ${isLoading ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              <Shield className={`h-4 w-4 sm:h-5 sm:w-5 transition-colors duration-300 ${activeTab === "privacy" ? "text-amber-600" : "text-drift-gray"}`} />
              <span className={`text-xs sm:text-sm font-medium transition-colors duration-300 ${activeTab === "privacy" ? "text-amber-600" : "text-drift-gray"}`}>
                Privacy
              </span>
            </button>
          </div>

          {/* Content Area */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8">
            <div 
              className={`space-y-4 sm:space-y-6 transition-all duration-300 ${
                isAnimating ? "opacity-0 translate-x-4" : "opacity-100 translate-x-0"
              }`}
            >
              {isLoading ? (
                // Skeleton Loading
                <>
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="p-4 sm:p-5 rounded-lg bg-gradient-to-br from-white to-pale-stone/20 border border-earth-beige/30">
                      <Skeleton className="h-6 w-32 mb-3" />
                      <Skeleton className="h-4 w-full mb-2" />
                      <Skeleton className="h-4 w-full mb-2" />
                      <Skeleton className="h-4 w-3/4" />
                    </div>
                  ))}
                  <div className="mt-6 sm:mt-8 pt-4 sm:pt-6 border-t border-earth-beige/30">
                    <Skeleton className="h-4 w-48 mx-auto mb-2" />
                    <Skeleton className="h-4 w-64 mx-auto" />
                  </div>
                </>
              ) : (
                // Actual Content
                <>
                  {currentContent.sections.map((section, index) => (
                    <div 
                      key={index} 
                      className="p-4 sm:p-5 rounded-lg bg-gradient-to-br from-white to-pale-stone/20 border border-earth-beige/30"
                      style={{ 
                        animation: `fadeIn 0.5s ease-out forwards`,
                        animationDelay: `${index * 100}ms`,
                        opacity: 0
                      }}
                    >
                      <h3 className="text-base sm:text-lg font-bold text-graphite mb-2 sm:mb-3">
                        {section.title}
                      </h3>
                      <p className="text-sm sm:text-base text-drift-gray leading-relaxed">
                        {section.content}
                      </p>
                    </div>
                  ))}

                  {/* Footer */}
                  <div className="mt-6 sm:mt-8 pt-4 sm:pt-6 border-t border-earth-beige/30">
                    <p className="text-xs sm:text-sm text-drift-gray text-center">
                      Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                    </p>
                    {activeTab === "privacy" && (
                      <p className="text-xs sm:text-sm text-drift-gray text-center mt-2">
                        Questions? Contact us at{" "}
                        <a href="mailto:privacy@smartcare.com" className="text-amber-600 hover:underline font-medium">
                          privacy@smartcare.com
                        </a>
                      </p>
                    )}
                    {activeTab === "terms" && (
                      <p className="text-xs sm:text-sm text-drift-gray text-center mt-2">
                        Questions? Contact us at{" "}
                        <a href="mailto:contact@smartcare.com" className="text-amber-600 hover:underline font-medium">
                          contact@smartcare.com
                        </a>
                      </p>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

