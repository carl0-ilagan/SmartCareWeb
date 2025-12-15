"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/auth-context"
import { 
  getPageContent, 
  updatePageContent, 
  uploadContentImage, 
  CONTENT_TYPES 
} from "@/lib/content-utils"
import { Loader2, Save, Upload, AlertCircle } from 'lucide-react'

export function ContentEditor({ pageType, onSave }) {
  const { user } = useAuth()
  const [content, setContent] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState(null)
  const [successMessage, setSuccessMessage] = useState(null)

  useEffect(() => {
    async function loadContent() {
      try {
        setIsLoading(true)
        setError(null)
        const pageContent = await getPageContent(pageType)
        setContent(pageContent)
      } catch (err) {
        console.error("Error loading content:", err)
        setError("Failed to load content. Please try again.")
      } finally {
        setIsLoading(false)
      }
    }

    loadContent()
  }, [pageType])

  const handleContentChange = (section, field, value) => {
    setContent(prevContent => ({
      ...prevContent,
      [section]: {
        ...prevContent[section],
        [field]: value
      }
    }))
  }

  const handleNestedContentChange = (section, subsection, field, value) => {
    setContent(prevContent => ({
      ...prevContent,
      [section]: {
        ...prevContent[section],
        [subsection]: {
          ...prevContent[section][subsection],
          [field]: value
        }
      }
    }))
  }

  const handleImageUpload = async (section, field, file) => {
    if (!file) return

    try {
      setIsSaving(true)
      const imageUrl = await uploadContentImage(file, `${pageType}/${section}`, user.uid)
      
      // Update content with new image URL
      handleContentChange(section, field, imageUrl)
      
      setSuccessMessage("Image uploaded successfully")
      setTimeout(() => setSuccessMessage(null), 3000)
    } catch (err) {
      console.error("Error uploading image:", err)
      setError("Failed to upload image. Please try again.")
      setTimeout(() => setError(null), 5000)
    } finally {
      setIsSaving(false)
    }
  }

  const handleSave = async () => {
    try {
      setIsSaving(true)
      setError(null)
      
      await updatePageContent(pageType, content, user.uid)
      
      setSuccessMessage("Content saved successfully")
      setTimeout(() => setSuccessMessage(null), 3000)
      
      if (onSave) {
        onSave(content)
      }
    } catch (err) {
      console.error("Error saving content:", err)
      setError("Failed to save content. Please try again.")
      setTimeout(() => setError(null), 5000)
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-soft-amber" />
        <span className="ml-2 text-drift-gray">Loading content...</span>
      </div>
    )
  }

  if (!content) {
    return (
      <div className="p-6 text-center">
        <AlertCircle className="mx-auto h-12 w-12 text-red-500" />
        <h3 className="mt-2 text-lg font-medium text-graphite">Content Not Found</h3>
        <p className="mt-1 text-drift-gray">Unable to load content for this page.</p>
      </div>
    )
  }

  // Render different editors based on page type
  return (
    <div className="space-y-8 p-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-graphite">
          {pageType === CONTENT_TYPES.WELCOME_PAGE ? "Welcome Page Content" : "Information Page Content"}
        </h2>
        <div className="flex items-center gap-4">
          {error && (
            <div className="text-sm text-red-500 flex items-center">
              <AlertCircle className="h-4 w-4 mr-1" />
              {error}
            </div>
          )}
          {successMessage && (
            <div className="text-sm text-green-500">
              {successMessage}
            </div>
          )}
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="inline-flex items-center rounded-md bg-soft-amber px-4 py-2 text-sm font-medium text-white hover:bg-soft-amber/90 focus:outline-none focus:ring-2 focus:ring-soft-amber focus:ring-offset-2 disabled:opacity-50"
          >
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Changes
              </>
            )}
          </button>
        </div>
      </div>

      {pageType === CONTENT_TYPES.WELCOME_PAGE && (
        <WelcomePageEditor 
          content={content} 
          onChange={handleContentChange} 
          onNestedChange={handleNestedContentChange}
          onImageUpload={handleImageUpload}
          isSaving={isSaving}
        />
      )}

      {pageType === CONTENT_TYPES.INFORMATION_PAGE && (
        <InformationPageEditor 
          content={content} 
          onChange={handleContentChange} 
          onNestedChange={handleNestedContentChange}
          onImageUpload={handleImageUpload}
          isSaving={isSaving}
        />
      )}
    </div>
  )
}

function WelcomePageEditor({ content, onChange, onNestedChange, onImageUpload, isSaving }) {
  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <EditorSection title="Hero Section">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-4">
            <EditorField
              label="Title"
              value={content.hero?.title || ""}
              onChange={(value) => onChange('hero', 'title', value)}
            />
            <EditorField
              label="Subtitle"
              value={content.hero?.subtitle || ""}
              onChange={(value) => onChange('hero', 'subtitle', value)}
              multiline
            />
            <EditorField
              label="Badge Text"
              value={content.hero?.badge || ""}
              onChange={(value) => onChange('hero', 'badge', value)}
            />
          </div>
          <div>
            <EditorImageUpload
              label="Hero Image"
              currentImage={content.hero?.imageUrl}
              onUpload={(file) => onImageUpload('hero', 'imageUrl', file)}
              disabled={isSaving}
            />
          </div>
        </div>
      </EditorSection>

      {/* Features Section */}
      <EditorSection title="Features Section">
        <div className="space-y-4">
          <EditorField
            label="Title"
            value={content.features?.title || ""}
            onChange={(value) => onChange('features', 'title', value)}
          />
          <EditorField
            label="Subtitle"
            value={content.features?.subtitle || ""}
            onChange={(value) => onChange('features', 'subtitle', value)}
            multiline
          />
        </div>
      </EditorSection>

      {/* How It Works Section */}
      <EditorSection title="How It Works Section">
        <div className="space-y-4">
          <EditorField
            label="Title"
            value={content.howItWorks?.title || ""}
            onChange={(value) => onChange('howItWorks', 'title', value)}
          />
          <EditorField
            label="Subtitle"
            value={content.howItWorks?.subtitle || ""}
            onChange={(value) => onChange('howItWorks', 'subtitle', value)}
            multiline
          />
        </div>
      </EditorSection>

      {/* Health Tips Section */}
      <EditorSection title="Health Tips Section">
        <div className="space-y-4">
          <EditorField
            label="Title"
            value={content.healthTips?.title || ""}
            onChange={(value) => onChange('healthTips', 'title', value)}
          />
          <EditorField
            label="Subtitle"
            value={content.healthTips?.subtitle || ""}
            onChange={(value) => onChange('healthTips', 'subtitle', value)}
            multiline
          />
        </div>
      </EditorSection>

      {/* Testimonials Section */}
      <EditorSection title="Testimonials Section">
        <div className="space-y-4">
          <EditorField
            label="Title"
            value={content.testimonials?.title || ""}
            onChange={(value) => onChange('testimonials', 'title', value)}
          />
          <EditorField
            label="Subtitle"
            value={content.testimonials?.subtitle || ""}
            onChange={(value) => onChange('testimonials', 'subtitle', value)}
            multiline
          />
        </div>
      </EditorSection>

      {/* CTA Section */}
      <EditorSection title="CTA Section">
        <div className="space-y-4">
          <EditorField
            label="Title"
            value={content.cta?.title || ""}
            onChange={(value) => onChange('cta', 'title', value)}
          />
          <EditorField
            label="Subtitle"
            value={content.cta?.subtitle || ""}
            onChange={(value) => onChange('cta', 'subtitle', value)}
            multiline
          />
          <EditorField
            label="Badge Text"
            value={content.cta?.badge || ""}
            onChange={(value) => onChange('cta', 'badge', value)}
          />
        </div>
      </EditorSection>

      {/* For Doctors Section */}
      <EditorSection title="For Doctors Section">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-4">
            <EditorField
              label="Title"
              value={content.forDoctors?.title || ""}
              onChange={(value) => onChange('forDoctors', 'title', value)}
            />
            <EditorField
              label="Subtitle"
              value={content.forDoctors?.subtitle || ""}
              onChange={(value) => onChange('forDoctors', 'subtitle', value)}
              multiline
            />
          </div>
          <div>
            <EditorImageUpload
              label="Doctor Image"
              currentImage={content.forDoctors?.imageUrl}
              onUpload={(file) => onImageUpload('forDoctors', 'imageUrl', file)}
              disabled={isSaving}
            />
          </div>
        </div>
      </EditorSection>
    </div>
  )
}

function InformationPageEditor({ content, onChange, onNestedChange, onImageUpload, isSaving }) {
  return (
    <div className="space-y-8">
      {/* About Section */}
      <EditorSection title="About Section">
        <div className="space-y-4">
          <EditorField
            label="Title"
            value={content.about?.title || ""}
            onChange={(value) => onChange('about', 'title', value)}
          />
          <EditorImageUpload
            label="About Image"
            currentImage={content.about?.imageUrl}
            onUpload={(file) => onImageUpload('about', 'imageUrl', file)}
            disabled={isSaving}
          />
          
          <h3 className="text-lg font-medium text-graphite mt-6">Mission</h3>
          <EditorField
            label="Mission Title"
            value={content.about?.mission?.title || ""}
            onChange={(value) => onNestedChange('about', 'mission', 'title', value)}
          />
          <EditorField
            label="Mission Content"
            value={content.about?.mission?.content || ""}
            onChange={(value) => onNestedChange('about', 'mission', 'content', value)}
            multiline
          />
          
          <h3 className="text-lg font-medium text-graphite mt-6">Story</h3>
          <EditorField
            label="Story Title"
            value={content.about?.story?.title || ""}
            onChange={(value) => onNestedChange('about', 'story', 'title', value)}
          />
          <EditorField
            label="Story Content"
            value={content.about?.story?.content || ""}
            onChange={(value) => onNestedChange('about', 'story', 'content', value)}
            multiline
          />
          
          <h3 className="text-lg font-medium text-graphite mt-6">Values</h3>
          <EditorField
            label="Values Title"
            value={content.about?.values?.title || ""}
            onChange={(value) => onNestedChange('about', 'values', 'title', value)}
          />
        </div>
      </EditorSection>

      {/* Terms Section */}
      <EditorSection title="Terms of Service">
        <div className="space-y-4">
          <EditorField
            label="Title"
            value={content.terms?.title || ""}
            onChange={(value) => onChange('terms', 'title', value)}
          />
          <EditorField
            label="Last Updated Date"
            value={content.terms?.lastUpdated || ""}
            onChange={(value) => onChange('terms', 'lastUpdated', value)}
          />
          <EditorField
            label="Introduction"
            value={content.terms?.intro || ""}
            onChange={(value) => onChange('terms', 'intro', value)}
            multiline
          />
        </div>
      </EditorSection>

      {/* Privacy Section */}
      <EditorSection title="Privacy Policy">
        <div className="space-y-4">
          <EditorField
            label="Title"
            value={content.privacy?.title || ""}
            onChange={(value) => onChange('privacy', 'title', value)}
          />
          <EditorField
            label="Last Updated Date"
            value={content.privacy?.lastUpdated || ""}
            onChange={(value) => onChange('privacy', 'lastUpdated', value)}
          />
          <EditorField
            label="Introduction"
            value={content.privacy?.intro || ""}
            onChange={(value) => onChange('privacy', 'intro', value)}
            multiline
          />
        </div>
      </EditorSection>
    </div>
  )
}

function EditorSection({ title, children }) {
  return (
    <div className="rounded-lg border border-earth-beige p-6">
      <h3 className="mb-4 text-xl font-medium text-graphite">{title}</h3>
      <div className="space-y-4">
        {children}
      </div>
    </div>
  )
}

function EditorField({ label, value, onChange, multiline = false }) {
  return (
    <div className="space-y-1">
      <label className="block text-sm font-medium text-graphite">{label}</label>
      {multiline ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full rounded-md border border-earth-beige px-3 py-2 text-graphite focus:border-soft-amber focus:outline-none focus:ring-1 focus:ring-soft-amber"
          rows={4}
        />
      ) : (
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full rounded-md border border-earth-beige px-3 py-2 text-graphite focus:border-soft-amber focus:outline-none focus:ring-1 focus:ring-soft-amber"
        />
      )}
    </div>
  )
}

function EditorImageUpload({ label, currentImage, onUpload, disabled }) {
  const [previewUrl, setPreviewUrl] = useState(currentImage || "")
  
  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      // Create a preview
      const reader = new FileReader()
      reader.onload = () => {
        setPreviewUrl(reader.result)
      }
      reader.readAsDataURL(file)
      
      // Upload the file
      onUpload(file)
    }
  }
  
  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-graphite">{label}</label>
      <div className="rounded-lg border border-dashed border-earth-beige p-4">
        {previewUrl ? (
          <div className="relative">
            <img 
              src={previewUrl || "/placeholder.svg"} 
              alt={label} 
              className="mx-auto h-48 w-full rounded-md object-cover"
            />
            <div className="mt-2 text-center text-xs text-drift-gray">
              {currentImage && currentImage.startsWith("http") ? (
                <span>Current image URL: {currentImage.substring(0, 30)}...</span>
              ) : (
                <span>Preview image</span>
              )}
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-4">
            <Upload className="h-10 w-10 text-drift-gray" />
            <p className="mt-2 text-sm text-drift-gray">No image selected</p>
          </div>
        )}
        <div className="mt-4">
          <label className="flex w-full cursor-pointer items-center justify-center rounded-md bg-pale-stone px-4 py-2 text-sm font-medium text-graphite hover:bg-earth-beige/30 focus:outline-none focus:ring-2 focus:ring-soft-amber focus:ring-offset-2 disabled:opacity-50">
            <input
              type="file"
              className="hidden"
              accept="image/*"
              onChange={handleFileChange}
              disabled={disabled}
            />
            <Upload className="mr-2 h-4 w-4" />
            {previewUrl ? "Change Image" : "Upload Image"}
          </label>
        </div>
      </div>
    </div>
  )
}
