"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Loader2 } from "lucide-react"

export function TermsEditor({ content, onUpdate, isSaving }) {
  const [title, setTitle] = useState(content.title || "")
  const [subtitle, setSubtitle] = useState(content.subtitle || "")
  const [htmlContent, setHtmlContent] = useState(content.content || "")

  const handleSubmit = async (e) => {
    e.preventDefault()

    const updatedContent = {
      title,
      subtitle,
      content: htmlContent,
    }

    await onUpdate(updatedContent)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="title">Title</Label>
        <Input
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Terms of Service"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="subtitle">Subtitle</Label>
        <Input
          id="subtitle"
          value={subtitle}
          onChange={(e) => setSubtitle(e.target.value)}
          placeholder="Please read these terms carefully before using our services"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="content">Terms Content (HTML)</Label>
        <Textarea
          id="content"
          value={htmlContent}
          onChange={(e) => setHtmlContent(e.target.value)}
          placeholder="<h2>1. Acceptance of Terms</h2><p>By accessing or using Smart Care's services, you agree to be bound by these Terms of Service...</p>"
          className="min-h-[500px] font-mono"
          required
        />
        <p className="text-sm text-drift-gray">
          You can use HTML tags like &lt;h2&gt;, &lt;p&gt;, &lt;ul&gt;, &lt;li&gt;, etc.
        </p>
      </div>

      <div className="flex justify-end">
        <Button type="submit" disabled={isSaving}>
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
    