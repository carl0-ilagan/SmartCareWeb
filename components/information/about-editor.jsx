"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Loader2 } from "lucide-react"

export function AboutEditor({ content, onUpdate, onImageUpload, isSaving }) {
  const [title, setTitle] = useState(content.title || "")
  const [subtitle, setSubtitle] = useState(content.subtitle || "")
  const [htmlContent, setHtmlContent] = useState(content.content || "")
  const [imageUrl, setImageUrl] = useState(content.imageUrl || "")
  const [isUploading, setIsUploading] = useState(false)

  const handleImageChange = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    setIsUploading(true)
    try {
      const url = await onImageUpload(file)
      if (url) {
        setImageUrl(url)
      }
    } catch (error) {
      console.error("Error uploading image:", error)
    } finally {
      setIsUploading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    const updatedContent = {
      title,
      subtitle,
      content: htmlContent,
      imageUrl,
    }

    await onUpdate(updatedContent)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="title">Title</Label>
        <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="About Us" required />
      </div>

      <div className="space-y-2">
        <Label htmlFor="subtitle">Subtitle</Label>
        <Input
          id="subtitle"
          value={subtitle}
          onChange={(e) => setSubtitle(e.target.value)}
          placeholder="Learn more about Smart Care and our mission"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="content">Content (HTML)</Label>
        <Textarea
          id="content"
          value={htmlContent}
          onChange={(e) => setHtmlContent(e.target.value)}
          placeholder="<h2>Our Mission</h2><p>At Smart Care, our mission is...</p>"
          className="min-h-[300px] font-mono"
          required
        />
        <p className="text-sm text-drift-gray">
          You can use HTML tags like &lt;h2&gt;, &lt;p&gt;, &lt;ul&gt;, &lt;li&gt;, etc.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="image">Featured Image</Label>
        <div className="flex items-center gap-4">
          <Input
            id="image"
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            className="max-w-sm"
            disabled={isUploading}
          />
          {isUploading && <Loader2 className="h-4 w-4 animate-spin" />}
        </div>
        {imageUrl && (
          <div className="mt-4">
            <p className="mb-2 text-sm font-medium">Current Image:</p>
            <img src={imageUrl || "/placeholder.svg"} alt="About" className="max-h-40 rounded-md" />
          </div>
        )}
      </div>

      <div className="flex justify-end">
        <Button type="submit" disabled={isSaving || isUploading}>
          {isSaving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            "Save Changes"
          )}
        </Button>
      </div>
    </form>
  )
}
