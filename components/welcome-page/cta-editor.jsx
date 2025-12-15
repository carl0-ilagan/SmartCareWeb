"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { updateWelcomePageContent } from "@/lib/content-utils"

export function CTAEditor({ content, onUpdate }) {
  const [ctaContent, setCtaContent] = useState(
    content || {
      title: "Ready to Transform Your Healthcare Experience?",
      subtitle: "Join thousands of satisfied users who have made Smart Care their go-to healthcare solution.",
      primaryButton: { label: "Get Started", url: "/signup" },
      secondaryButton: { label: "Learn More", url: "/information?section=about" },
    },
  )
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleContentChange = (field, value) => {
    setCtaContent({
      ...ctaContent,
      [field]: value,
    })
  }

  const handleButtonChange = (buttonType, field, value) => {
    setCtaContent({
      ...ctaContent,
      [buttonType]: {
        ...ctaContent[buttonType],
        [field]: value,
      },
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      await updateWelcomePageContent(ctaContent, "cta")
      onUpdate(ctaContent)
    } catch (error) {
      console.error("Error updating CTA section:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="cta-title">CTA Title</Label>
          <Input
            id="cta-title"
            value={ctaContent.title}
            onChange={(e) => handleContentChange("title", e.target.value)}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="cta-subtitle">CTA Subtitle</Label>
          <Textarea
            id="cta-subtitle"
            value={ctaContent.subtitle}
            onChange={(e) => handleContentChange("subtitle", e.target.value)}
            rows={2}
            required
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4 border p-4 rounded-md">
            <h4 className="font-medium">Primary Button</h4>
            <div className="space-y-2">
              <Label htmlFor="cta-primary-button-label">Label</Label>
              <Input
                id="cta-primary-button-label"
                value={ctaContent.primaryButton?.label || ""}
                onChange={(e) => handleButtonChange("primaryButton", "label", e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cta-primary-button-url">URL</Label>
              <Input
                id="cta-primary-button-url"
                value={ctaContent.primaryButton?.url || ""}
                onChange={(e) => handleButtonChange("primaryButton", "url", e.target.value)}
                required
              />
            </div>
          </div>

          <div className="space-y-4 border p-4 rounded-md">
            <h4 className="font-medium">Secondary Button</h4>
            <div className="space-y-2">
              <Label htmlFor="cta-secondary-button-label">Label</Label>
              <Input
                id="cta-secondary-button-label"
                value={ctaContent.secondaryButton?.label || ""}
                onChange={(e) => handleButtonChange("secondaryButton", "label", e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cta-secondary-button-url">URL</Label>
              <Input
                id="cta-secondary-button-url"
                value={ctaContent.secondaryButton?.url || ""}
                onChange={(e) => handleButtonChange("secondaryButton", "url", e.target.value)}
                required
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end mt-6">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </div>
    </form>
  )
}
