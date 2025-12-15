"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { updateWelcomePageContent, uploadWelcomePageImage } from "@/lib/content-utils"
import { ImageIcon, Upload } from "lucide-react"

export function HeroEditor({ content, onUpdate }) {
  const [heroContent, setHeroContent] = useState(
    content || {
      title: "",
      subtitle: "",
      imageUrl: "",
      primaryButton: { label: "", url: "" },
      secondaryButton: { label: "", url: "" },
    },
  )
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState(heroContent.imageUrl)

  const handleContentChange = (field, value) => {
    setHeroContent({
      ...heroContent,
      [field]: value,
    })
  }

  const handleButtonChange = (buttonType, field, value) => {
    setHeroContent({
      ...heroContent,
      [buttonType]: {
        ...heroContent[buttonType],
        [field]: value,
      },
    })
  }

  const handleImageChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      setImageFile(file)
      setImagePreview(URL.createObjectURL(file))
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const updatedContent = { ...heroContent }

      // Upload image if a new one is selected
      if (imageFile) {
        const imageUrl = await uploadWelcomePageImage(imageFile, "hero")
        updatedContent.imageUrl = imageUrl
      }

      await updateWelcomePageContent(updatedContent, "hero")
      onUpdate(updatedContent)
    } catch (error) {
      console.error("Error updating hero section:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="hero-title">Title</Label>
          <Input
            id="hero-title"
            value={heroContent.title}
            onChange={(e) => handleContentChange("title", e.target.value)}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="hero-subtitle">Subtitle</Label>
          <Textarea
            id="hero-subtitle"
            value={heroContent.subtitle}
            onChange={(e) => handleContentChange("subtitle", e.target.value)}
            rows={3}
            required
          />
        </div>

        <div className="space-y-2">
          <Label>Hero Image</Label>
          <div className="flex flex-col gap-4">
            {imagePreview && (
              <div className="relative w-full max-w-md h-48 border rounded-md overflow-hidden">
                <ImageIcon
                  src={imagePreview || "/placeholder.svg"}
                  alt="Hero preview"
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            <div className="flex items-center gap-2">
              <Input id="hero-image" type="file" accept="image/*" onChange={handleImageChange} className="max-w-md" />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => document.getElementById("hero-image").click()}
              >
                <Upload className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4 border p-4 rounded-md">
            <h4 className="font-medium">Primary Button</h4>
            <div className="space-y-2">
              <Label htmlFor="primary-button-label">Label</Label>
              <Input
                id="primary-button-label"
                value={heroContent.primaryButton?.label || ""}
                onChange={(e) => handleButtonChange("primaryButton", "label", e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="primary-button-url">URL</Label>
              <Input
                id="primary-button-url"
                value={heroContent.primaryButton?.url || ""}
                onChange={(e) => handleButtonChange("primaryButton", "url", e.target.value)}
                required
              />
            </div>
          </div>

          <div className="space-y-4 border p-4 rounded-md">
            <h4 className="font-medium">Secondary Button</h4>
            <div className="space-y-2">
              <Label htmlFor="secondary-button-label">Label</Label>
              <Input
                id="secondary-button-label"
                value={heroContent.secondaryButton?.label || ""}
                onChange={(e) => handleButtonChange("secondaryButton", "label", e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="secondary-button-url">URL</Label>
              <Input
                id="secondary-button-url"
                value={heroContent.secondaryButton?.url || ""}
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
