"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Loader2 } from "lucide-react"

export function ContactEditor({ content, onUpdate, isSaving }) {
  const [title, setTitle] = useState(content.title || "")
  const [subtitle, setSubtitle] = useState(content.subtitle || "")
  const [htmlContent, setHtmlContent] = useState(content.content || "")
  const [contactInfo, setContactInfo] = useState(
    content.contactInfo || {
      address: "",
      phone: "",
      email: "",
      hours: "",
    },
  )
  const [formEnabled, setFormEnabled] = useState(content.formEnabled || true)

  const handleContactInfoChange = (field, value) => {
    setContactInfo({
      ...contactInfo,
      [field]: value,
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    const updatedContent = {
      title,
      subtitle,
      content: htmlContent,
      contactInfo,
      formEnabled,
    }

    await onUpdate(updatedContent)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="title">Title</Label>
        <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Contact Us" required />
      </div>

      <div className="space-y-2">
        <Label htmlFor="subtitle">Subtitle</Label>
        <Input
          id="subtitle"
          value={subtitle}
          onChange={(e) => setSubtitle(e.target.value)}
          placeholder="We're here to help. Reach out to us with any questions or concerns."
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="content">Introduction (HTML)</Label>
        <Textarea
          id="content"
          value={htmlContent}
          onChange={(e) => setHtmlContent(e.target.value)}
          placeholder="<p>We value your feedback and are always here to assist you...</p>"
          className="min-h-[150px] font-mono"
          required
        />
        <p className="text-sm text-drift-gray">You can use HTML tags like &lt;p&gt;, &lt;strong&gt;, etc.</p>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-medium">Contact Information</h3>

        <div className="space-y-2">
          <Label htmlFor="address">Address</Label>
          <Input
            id="address"
            value={contactInfo.address}
            onChange={(e) => handleContactInfoChange("address", e.target.value)}
            placeholder="123 Healthcare Avenue, Medical District, CA 90210"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone">Phone</Label>
          <Input
            id="phone"
            value={contactInfo.phone}
            onChange={(e) => handleContactInfoChange("phone", e.target.value)}
            placeholder="+1 (555) 123-4567"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            value={contactInfo.email}
            onChange={(e) => handleContactInfoChange("email", e.target.value)}
            placeholder="contact@smartcare.com"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="hours">Business Hours</Label>
          <Textarea
            id="hours"
            value={contactInfo.hours}
            onChange={(e) => handleContactInfoChange("hours", e.target.value)}
            placeholder="Monday - Friday: 8:00 AM - 8:00 PM&#10;Saturday - Sunday: 9:00 AM - 5:00 PM"
            required
          />
          <p className="text-sm text-drift-gray">Use line breaks to separate days.</p>
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <Switch id="form-enabled" checked={formEnabled} onCheckedChange={setFormEnabled} />
        <Label htmlFor="form-enabled">Enable contact form</Label>
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
