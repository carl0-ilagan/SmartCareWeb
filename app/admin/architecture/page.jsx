"use client"

import { useEffect, useState, useRef } from "react"
import Script from "next/script"
import { Download, FileImage, Layers, Database, GitBranch, Activity } from "lucide-react"
import { useRouter } from "next/navigation"
import { AdminHeaderBanner } from "@/components/admin-header-banner"

export default function ArchitecturePage() {
  const [mermaidLoaded, setMermaidLoaded] = useState(false)
  const [isDownloading, setIsDownloading] = useState(false)
  const diagramRef = useRef(null)
  const router = useRouter()

  useEffect(() => {
    if (mermaidLoaded && typeof window !== "undefined" && window.mermaid) {
      window.mermaid.initialize({ 
        startOnLoad: true,
        theme: "default",
        securityLevel: "loose",
        flowchart: {
          useMaxWidth: true,
          htmlLabels: true,
          curve: "basis"
        }
      })
      window.mermaid.run()
    }
  }, [mermaidLoaded])

// Unified download function for all diagrams
  const downloadDiagram = async (diagramIdOrRef, diagramName, format = 'png') => {
    if (!mermaidLoaded || !window.mermaid || isDownloading) return
    
    setIsDownloading(true)
    try {
      // Support both ref (for main diagram) and element ID (for activity diagrams)
      let diagramElement
      if (typeof diagramIdOrRef === 'string') {
        // Activity diagram - get by ID
        diagramElement = document.getElementById(diagramIdOrRef)
      } else {
        // Main diagram - use ref
        diagramElement = diagramRef.current?.querySelector('.mermaid')
      }

      if (!diagramElement) {
        alert('Diagram not found. Please wait for the diagram to load.')
        setIsDownloading(false)
        return
      }

      const svgElement = diagramElement.querySelector('svg')
      if (!svgElement) {
        alert('Diagram SVG not found. Please wait for the diagram to fully load.')
        setIsDownloading(false)
        return
      }

      if (format === 'svg') {
        // Download as SVG - direct export
        const svgData = new XMLSerializer().serializeToString(svgElement)
        const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' })
        const svgUrl = URL.createObjectURL(svgBlob)
        const downloadLink = document.createElement('a')
        downloadLink.href = svgUrl
        downloadLink.download = `${diagramName}.svg`
        document.body.appendChild(downloadLink)
        downloadLink.click()
        document.body.removeChild(downloadLink)
        URL.revokeObjectURL(svgUrl)
        setIsDownloading(false)
      } else {
        // For PNG and PDF, use a different approach to avoid CORS issues
        // Convert SVG to data URL and then to canvas
        const svgData = new XMLSerializer().serializeToString(svgElement)
        
        // Get SVG dimensions
        const svgWidth = svgElement.viewBox?.baseVal?.width || svgElement.clientWidth || 1200
        const svgHeight = svgElement.viewBox?.baseVal?.height || svgElement.clientHeight || 800
        
        // Create canvas with proper dimensions
        const canvas = document.createElement('canvas')
        // Higher resolution for DFD, activity, context, and database schema diagrams (needs to be larger for Word docs)
        const isActivityDiagram = diagramIdOrRef === 'activity-diagram'
        const isDFDDiagram = diagramIdOrRef === 'dfd-context-diagram' || diagramIdOrRef === 'dfd-level1-diagram'
        const isContextDiagram = diagramIdOrRef === 'context-diagram'
        const isDatabaseSchema = diagramIdOrRef === 'database-schema'
        const scale = isActivityDiagram ? 4 : (isDFDDiagram ? 4 : (isContextDiagram ? 3 : (isDatabaseSchema ? 3 : 2))) // 4x for activity and DFD, 3x for context and schema, 2x for architecture
        canvas.width = svgWidth * scale
        canvas.height = svgHeight * scale
        const ctx = canvas.getContext('2d')
        
        // Create image from SVG data URL
        const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' })
        const reader = new FileReader()
        
        reader.onload = (e) => {
          const img = new Image()
          
          img.onload = () => {
            // Scale context for higher resolution
            ctx.scale(scale, scale)
            ctx.drawImage(img, 0, 0, svgWidth, svgHeight)
            
            // Reset scale for export
            ctx.setTransform(1, 0, 0, 1, 0, 0)
            
            // Export canvas
            canvas.toBlob((blob) => {
              if (!blob) {
                alert('Failed to create image. Please try again.')
                setIsDownloading(false)
                return
              }
              
              const url = URL.createObjectURL(blob)
              const downloadLink = document.createElement('a')
              downloadLink.href = url
              
              const fileName = diagramName || 'smart-care-diagram'
              if (format === 'png') {
                downloadLink.download = `${fileName}.png`
              } else {
                downloadLink.download = `${fileName}.png`
              }
              
              document.body.appendChild(downloadLink)
              downloadLink.click()
              document.body.removeChild(downloadLink)
              URL.revokeObjectURL(url)
              
              if (format === 'pdf') {
                alert('PNG downloaded. For PDF, use browser Print to PDF feature (Ctrl+P or Cmd+P) or convert the PNG to PDF using an image editor.')
              }
              
              setIsDownloading(false)
            }, 'image/png', 1.0)
          }
          
          img.onerror = () => {
            setIsDownloading(false)
            alert('Failed to load SVG image. Please try again.')
          }
          
          // Use data URL directly to avoid CORS issues
          img.src = e.target.result
        }
        
        reader.onerror = () => {
          setIsDownloading(false)
          alert('Failed to read SVG file. Please try again.')
        }
        
        reader.readAsDataURL(svgBlob)
      }
    } catch (error) {
      console.error('Download error:', error)
      alert('Failed to download diagram. Please try again.')
      setIsDownloading(false)
    }
  }

  return (
    <>
      <Script
        src="https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.min.js"
        onLoad={() => setMermaidLoaded(true)}
        strategy="lazyOnload"
      />
      <div className="min-h-screen bg-pale-stone/30">
        <AdminHeaderBanner />
        

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
{/* Architecture Diagram */}
          <section id="architecture" className="mb-8 scroll-mt-32">
            <div className="bg-white rounded-xl shadow-md p-6 border border-earth-beige">
              <div className="mb-6 flex items-center justify-between flex-wrap gap-4">
                <div>
                  <h2 className="text-2xl font-bold text-deep-forest mb-2 flex items-center gap-2">
                    <Layers className="w-6 h-6 text-soft-amber" />
                    System Architecture Diagram
                  </h2>
                  <p className="text-drift-gray">Visual representation of how system components interact</p>
                </div>
                <div className="flex gap-2">
                  <div className="relative group">
                    <button
                      onClick={() => downloadDiagram(null, 'smart-care-system-architecture', 'png')}
                      disabled={isDownloading || !mermaidLoaded}
                      className="flex items-center gap-2 px-4 py-2 bg-soft-amber text-white rounded-lg hover:bg-amber-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium shadow-sm"
                    >
                      <Download className="w-4 h-4" />
                      {isDownloading ? 'Downloading...' : 'Download'}
                    </button>
                    <div className="absolute right-0 top-full mt-2 bg-white rounded-lg shadow-xl border border-earth-beige opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10 min-w-[180px]">
                      <div className="py-2">
                        <button
                          onClick={() => downloadDiagram(null, 'smart-care-system-architecture', 'png')}
                          disabled={isDownloading || !mermaidLoaded}
                          className="w-full px-4 py-2 text-left hover:bg-pale-stone flex items-center gap-2 text-graphite disabled:text-gray-400 disabled:cursor-not-allowed"
                        >
                          <FileImage className="w-4 h-4" />
                          Download as PNG
                        </button>
                        <button
                          onClick={() => downloadDiagram(null, 'smart-care-system-architecture', 'svg')}
                          disabled={isDownloading || !mermaidLoaded}
                          className="w-full px-4 py-2 text-left hover:bg-pale-stone flex items-center gap-2 text-graphite disabled:text-gray-400 disabled:cursor-not-allowed"
                        >
                          <FileImage className="w-4 h-4" />
                          Download as SVG
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Mermaid Diagram */}
              <div ref={diagramRef} className="bg-cream rounded-lg p-6 border-2 border-dashed border-earth-beige overflow-x-auto">
                <div className="mermaid min-w-full">
                  {`graph TB
    subgraph "User Layer"
        Patient[👤 Patient]
        Doctor[👤 Doctor]
        Admin[👤 Admin]
    end
    
    subgraph "Web Interface Layer"
        PatientUI[📱 Patient Web Interface<br/>Mobile/Desktop]
        DoctorUI[📱 Doctor Web Interface<br/>Mobile/Desktop]
        AdminUI[💻 Admin Web Interface<br/>Desktop]
    end
    
    subgraph "Authentication Layer"
        GoogleAuth[🔐 Google Authentication<br/>OAuth 2.0]
    end
    
    subgraph "Internet/Network Layer"
        Internet[🌐 Internet<br/>HTTPS/TLS]
    end
    
    subgraph "Backend Services Layer"
        Firebase[🔥 Firebase Platform<br/>Platform Auth & Firestore]
    end
    
    subgraph "Real-time Communication Layer"
        Signalling[📡 Signalling<br/>Session Coordination]
        WebRTC[☁️ WebRTC Network<br/>Peer-to-Peer Communication]
    end
    
    %% User to Interface Connections
    Patient <-->|"User Interaction"| PatientUI
    Doctor <-->|"User Interaction"| DoctorUI
    Admin <-->|"User Interaction"| AdminUI
    
    %% Interface to Authentication
    PatientUI <-->|"Authenticate"| GoogleAuth
    DoctorUI <-->|"Authenticate"| GoogleAuth
    AdminUI <-->|"Authenticate"| GoogleAuth
    
    %% Authentication to Internet
    GoogleAuth <-->|"OAuth Flow"| Internet
    
    %% Internet to Firebase
    Internet <-->|"API Calls<br/>Real-time Sync"| Firebase
    
    %% Firebase to Signalling
    Firebase <-->|"Signalling Data<br/>Session Management"| Signalling
    
    %% Signalling to WebRTC
    Signalling <-->|"ICE Candidates<br/>SDP Exchange"| WebRTC
    
    %% WebRTC to Interfaces (for video/voice)
    WebRTC <-->|"Media Streams<br/>Video/Audio"| PatientUI
    WebRTC <-->|"Media Streams<br/>Video/Audio"| DoctorUI
    
    %% Styling
    classDef userLayer fill:#e1f5ff,stroke:#01579b,stroke-width:2px
    classDef interfaceLayer fill:#f3e5f5,stroke:#4a148c,stroke-width:2px
    classDef authLayer fill:#fff3e0,stroke:#e65100,stroke-width:2px
    classDef networkLayer fill:#e8f5e9,stroke:#1b5e20,stroke-width:2px
    classDef backendLayer fill:#fff9c4,stroke:#f57f17,stroke-width:2px
    classDef commLayer fill:#fce4ec,stroke:#880e4f,stroke-width:2px
    
    class Patient,Doctor,Admin userLayer
    class PatientUI,DoctorUI,AdminUI interfaceLayer
    class GoogleAuth authLayer
    class Internet networkLayer
    class Firebase backendLayer
    class Signalling,WebRTC commLayer`}
                </div>
              </div>
            </div>
          </section>

          {/* DFD Section */}
          <section id="dfd" className="mb-8 scroll-mt-32">
            <div className="bg-white rounded-xl shadow-md p-6 border border-earth-beige">
              <div className="mb-6 flex items-center justify-between flex-wrap gap-4">
                <div>
                  <h2 className="text-2xl font-bold text-deep-forest mb-2 flex items-center gap-2">
                    <GitBranch className="w-6 h-6 text-soft-amber" />
                    Diagram 0 - Context Diagram (DFD Level 0)
                  </h2>
                  <p className="text-drift-gray">Shows the Smart Care system and its interactions with external entities</p>
                </div>
                <div className="flex gap-2">
                  <div className="relative group">
                    <button
                      onClick={() => downloadDiagram('dfd-context-diagram', 'smart-care-dfd-context-diagram', 'png')}
                      disabled={isDownloading || !mermaidLoaded}
                      className="flex items-center gap-2 px-4 py-2 bg-soft-amber text-white rounded-lg hover:bg-amber-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium shadow-sm"
                    >
                      <Download className="w-4 h-4" />
                      {isDownloading ? 'Downloading...' : 'Download'}
                    </button>
                    <div className="absolute right-0 top-full mt-2 bg-white rounded-lg shadow-xl border border-earth-beige opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10 min-w-[180px]">
                      <div className="py-2">
                        <button
                          onClick={() => downloadDiagram('dfd-context-diagram', 'smart-care-dfd-context-diagram', 'png')}
                          disabled={isDownloading || !mermaidLoaded}
                          className="w-full px-4 py-2 text-left hover:bg-pale-stone flex items-center gap-2 text-graphite disabled:text-gray-400 disabled:cursor-not-allowed"
                        >
                          <FileImage className="w-4 h-4" />
                          Download as PNG
                        </button>
                        <button
                          onClick={() => downloadDiagram('dfd-context-diagram', 'smart-care-dfd-context-diagram', 'svg')}
                          disabled={isDownloading || !mermaidLoaded}
                          className="w-full px-4 py-2 text-left hover:bg-pale-stone flex items-center gap-2 text-graphite disabled:text-gray-400 disabled:cursor-not-allowed"
                        >
                          <FileImage className="w-4 h-4" />
                          Download as SVG
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Diagram 0 - Context Diagram */}
              <div id="dfd-context-diagram" className="bg-cream rounded-lg p-6 border-2 border-dashed border-earth-beige overflow-x-auto">
                <style jsx>{`
                  #dfd-context-diagram .mermaid svg {
                    width: 100% !important;
                    height: auto !important;
                    min-height: 1500px;
                    max-width: 100%;
                  }
                  #dfd-context-diagram .mermaid svg text {
                    font-size: 22px !important;
                    font-weight: 600;
                  }
                  #dfd-context-diagram .mermaid svg .nodeLabel {
                    font-size: 22px !important;
                    font-weight: 600;
                  }
                  #dfd-context-diagram .mermaid svg .edgeLabel {
                    font-size: 18px !important;
                    font-weight: 500;
                  }
                  #dfd-context-diagram .mermaid svg .node rect,
                  #dfd-context-diagram .mermaid svg .node circle,
                  #dfd-context-diagram .mermaid svg .node ellipse {
                    stroke-width: 5px !important;
                  }
                  #dfd-context-diagram .mermaid svg .edgePath path {
                    stroke-width: 4px !important;
                  }
                  #dfd-context-diagram .mermaid svg .edgePath marker {
                    fill: #01579b !important;
                  }
                  #dfd-context-diagram .mermaid svg .node {
                    min-width: 250px !important;
                    min-height: 80px !important;
                  }
                `}</style>
                <div className="mermaid min-w-full">
                  {`graph TB
    %% Top Layer - External Entities (Users) - Spaced out
    Patient[👤 Patient]
    Doctor[👨‍⚕️ Doctor]
    Admin[👨‍💼 Admin]
    
    %% Middle Layer - Smart Care System (Larger, more prominent)
    System[🏥 Smart Care<br/>Telehealth Platform]
    
    %% Bottom Layer - External Systems (Spaced out)
    Firebase[(🔥 Firebase<br/>Auth & Firestore)]
    GmailAPI[📧 Gmail API]
    SMTP[✉️ SMTP Server]
    MapsAPI[🗺️ Google Maps API]
    
    %% Patient Inputs to System (Grouped for clarity)
    Patient -->|"User Actions:<br/>Register/Login<br/>Book Appointments<br/>Send Messages<br/>Upload Records<br/>View Prescriptions<br/>Join Video Calls<br/>Submit Feedback"| System
    
    %% Doctor Inputs to System (Grouped for clarity)
    Doctor -->|"Doctor Actions:<br/>Register/Login<br/>Manage Availability<br/>Create Prescriptions<br/>Send Messages<br/>Create Video Rooms<br/>View Patient Records"| System
    
    %% Admin Inputs to System (Grouped for clarity)
    Admin -->|"Admin Actions:<br/>Login<br/>Approve/Reject Accounts<br/>Manage Content<br/>View Analytics<br/>Reply to Messages"| System
    
    %% System to External Systems (Clear, grouped connections)
    System -->|"Authentication &<br/>Data Storage"| Firebase
    System -->|"Email Fetching"| GmailAPI
    System -->|"Email Sending"| SMTP
    System -->|"Map Display"| MapsAPI
    
    %% System Outputs to Users (Grouped for clarity)
    System -->|"Notifications:<br/>Appointments<br/>Prescriptions<br/>Messages"| Patient
    System -->|"Notifications:<br/>Appointments<br/>Messages"| Doctor
    System -->|"System Alerts"| Admin
    
    %% Styling - Color-coded like System Architecture with thicker strokes for visibility
    classDef externalEntity fill:#e1f5ff,stroke:#01579b,stroke-width:5px
    classDef system fill:#f3e5f5,stroke:#4a148c,stroke-width:6px
    classDef dataStore fill:#fff9c4,stroke:#f57f17,stroke-width:5px
    classDef api fill:#e8f5e9,stroke:#1b5e20,stroke-width:5px
    
    class Patient,Doctor,Admin externalEntity
    class System system
    class Firebase dataStore
    class GmailAPI,SMTP,MapsAPI api`}
                </div>
              </div>
            </div>

            {/* DFD Level 1 */}
            <div className="bg-white rounded-xl shadow-md p-6 border border-earth-beige mt-8">
              <div className="mb-6 flex items-center justify-between flex-wrap gap-4">
                <div>
                  <h2 className="text-2xl font-bold text-deep-forest mb-2 flex items-center gap-2">
                    <GitBranch className="w-6 h-6 text-soft-amber" />
                    DFD Level 1 - Data Flow Diagram
                  </h2>
                  <p className="text-drift-gray">Shows the main processes and data stores within the Smart Care system</p>
                </div>
                <div className="flex gap-2">
                  <div className="relative group">
                    <button
                      onClick={() => downloadDiagram('dfd-level1-diagram', 'smart-care-dfd-level1-diagram', 'png')}
                      disabled={isDownloading || !mermaidLoaded}
                      className="flex items-center gap-2 px-4 py-2 bg-soft-amber text-white rounded-lg hover:bg-amber-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium shadow-sm"
                    >
                      <Download className="w-4 h-4" />
                      {isDownloading ? 'Downloading...' : 'Download'}
                    </button>
                    <div className="absolute right-0 top-full mt-2 bg-white rounded-lg shadow-xl border border-earth-beige opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10 min-w-[180px]">
                      <div className="py-2">
                        <button
                          onClick={() => downloadDiagram('dfd-level1-diagram', 'smart-care-dfd-level1-diagram', 'png')}
                          disabled={isDownloading || !mermaidLoaded}
                          className="w-full px-4 py-2 text-left hover:bg-pale-stone flex items-center gap-2 text-graphite disabled:text-gray-400 disabled:cursor-not-allowed"
                        >
                          <FileImage className="w-4 h-4" />
                          Download as PNG
                        </button>
                        <button
                          onClick={() => downloadDiagram('dfd-level1-diagram', 'smart-care-dfd-level1-diagram', 'svg')}
                          disabled={isDownloading || !mermaidLoaded}
                          className="w-full px-4 py-2 text-left hover:bg-pale-stone flex items-center gap-2 text-graphite disabled:text-gray-400 disabled:cursor-not-allowed"
                        >
                          <FileImage className="w-4 h-4" />
                          Download as SVG
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* DFD Level 1 Diagram */}
              <div id="dfd-level1-diagram" className="bg-cream rounded-lg p-6 border-2 border-dashed border-earth-beige overflow-x-auto">
                <style jsx>{`
                  #dfd-level1-diagram .mermaid svg {
                    width: 100% !important;
                    height: auto !important;
                    min-height: 3000px;
                    max-width: 100%;
                  }
                  #dfd-level1-diagram .mermaid svg text {
                    font-size: 32px !important;
                    font-weight: 700;
                  }
                  #dfd-level1-diagram .mermaid svg .nodeLabel {
                    font-size: 32px !important;
                    font-weight: 700;
                  }
                  #dfd-level1-diagram .mermaid svg .edgeLabel {
                    font-size: 28px !important;
                    font-weight: 700;
                  }
                  #dfd-level1-diagram .mermaid svg .edgeLabel text {
                    font-size: 28px !important;
                    font-weight: 700;
                  }
                  #dfd-level1-diagram .mermaid svg .node rect,
                  #dfd-level1-diagram .mermaid svg .node circle,
                  #dfd-level1-diagram .mermaid svg .node ellipse {
                    stroke-width: 8px !important;
                  }
                  #dfd-level1-diagram .mermaid svg .edgePath path {
                    stroke-width: 5px !important;
                  }
                  #dfd-level1-diagram .mermaid svg .edgePath marker {
                    fill: #01579b !important;
                    stroke-width: 2px;
                  }
                  #dfd-level1-diagram .mermaid svg .node {
                    min-width: 500px !important;
                    min-height: 180px !important;
                  }
                  #dfd-level1-diagram .mermaid svg .edgePath {
                    stroke-width: 8px !important;
                  }
                  #dfd-level1-diagram .mermaid svg .edgePath path {
                    stroke-width: 8px !important;
                  }
                  #dfd-level1-diagram .mermaid svg .cluster rect {
                    stroke-width: 4px !important;
                  }
                `}</style>
                <div className="mermaid min-w-full">
                  {`graph TB
    %% Top Layer - External Entities (Spaced out)
    Patient[👤 Patient]
    Doctor[👨‍⚕️ Doctor]
    Admin[👨‍💼 Admin]
    
    %% Middle Layer - System Processes (Well spaced, larger)
    P1[1.0<br/>🔐 User<br/>Authentication]
    P2[2.0<br/>📅 Appointment<br/>Management]
    P3[3.0<br/>💬 Communication<br/>Management]
    P4[4.0<br/>💊 Prescription<br/>Management]
    P5[5.0<br/>📋 Record<br/>Management]
    P6[6.0<br/>⚙️ Admin<br/>Management]
    P7[7.0<br/>🔔 Notification<br/>Service]
    
    %% Bottom Layer - Data Stores (Spaced out)
    D1[(D1: 👥 Users)]
    D2[(D2: 📅 Appointments)]
    D3[(D3: 💬 Messages)]
    D4[(D4: 💊 Prescriptions)]
    D5[(D5: 📋 Medical Records)]
    D6[(D6: 📊 System Logs)]
    
    %% External APIs (Side placement)
    GmailAPI[📧 Gmail API]
    SMTP[✉️ SMTP Server]
    
    %% User Inputs to Processes (Clear, organized flows)
    Patient -->|"Login<br/>Credentials"| P1
    Patient -->|"Appointment<br/>Request"| P2
    Patient -->|"Message"| P3
    Patient -->|"Record<br/>Upload"| P5
    
    Doctor -->|"Login<br/>Credentials"| P1
    Doctor -->|"Availability"| P2
    Doctor -->|"Message"| P3
    Doctor -->|"Prescription<br/>Data"| P4
    
    Admin -->|"Login<br/>Credentials"| P1
    Admin -->|"Approval<br/>Decision"| P6
    
    %% Processes to Data Stores (Simplified - only main stores)
    P1 <-->|"User<br/>Data"| D1
    P2 <-->|"Appointment<br/>Data"| D2
    P3 <-->|"Message<br/>Data"| D3
    P4 <-->|"Prescription<br/>Data"| D4
    P5 <-->|"Record<br/>Data"| D5
    P7 <-->|"Log<br/>Data"| D6
    P6 <-->|"System<br/>Data"| D6
    
    %% Process to Process Flows (Simplified - only essential)
    P1 -->|"User<br/>Status"| P2
    P1 -->|"User<br/>Status"| P3
    P2 -->|"Appointment<br/>Info"| P7
    P3 -->|"Message<br/>Info"| P7
    P4 -->|"Prescription<br/>Info"| P7
    P6 -->|"Approval<br/>Status"| P1
    
    %% External System Flows (Simplified)
    P3 -->|"Fetch<br/>Emails"| GmailAPI
    GmailAPI -->|"Email<br/>Data"| P3
    P7 -->|"Send<br/>Email"| SMTP
    
    %% Process Outputs to Users (Simplified - only main outputs)
    P1 -->|"Auth<br/>Status"| Patient
    P1 -->|"Auth<br/>Status"| Doctor
    P1 -->|"Auth<br/>Status"| Admin
    P2 -->|"Appointment<br/>Confirmation"| Patient
    P2 -->|"Appointment<br/>Notification"| Doctor
    P3 -->|"Message"| Patient
    P3 -->|"Message"| Doctor
    P4 -->|"Prescription"| Patient
    P5 -->|"Record<br/>Access"| Doctor
    P6 -->|"Approval<br/>Status"| Patient
    P7 -->|"Notification"| Patient
    P7 -->|"Notification"| Doctor
    
    %% Styling - Color-coded like System Architecture with thicker strokes for visibility
    classDef externalEntity fill:#e1f5ff,stroke:#01579b,stroke-width:6px
    classDef process fill:#f3e5f5,stroke:#4a148c,stroke-width:6px
    classDef dataStore fill:#fff9c4,stroke:#f57f17,stroke-width:6px
    classDef api fill:#e8f5e9,stroke:#1b5e20,stroke-width:6px
    
    class Patient,Doctor,Admin externalEntity
    class P1,P2,P3,P4,P5,P6,P7 process
    class D1,D2,D3,D4,D5,D6 dataStore
    class GmailAPI,SMTP api`}
                </div>
              </div>
            </div>
          </section>

          {/* Context Diagram Section */}
          <section id="context" className="mb-8 scroll-mt-32">
            <div className="bg-white rounded-xl shadow-md p-6 border border-earth-beige">
              <div className="mb-6 flex items-center justify-between flex-wrap gap-4">
                <div>
                  <h2 className="text-2xl font-bold text-deep-forest mb-2 flex items-center gap-2">
                    <GitBranch className="w-6 h-6 text-soft-amber" />
                    Context Diagram (Yourdon Style)
                  </h2>
                  <p className="text-drift-gray">High-level overview showing Smart Care system and its interactions with external entities</p>
                </div>
                <div className="flex gap-2">
                  <div className="relative group">
                    <button
                      onClick={() => downloadDiagram('context-diagram', 'smart-care-context-diagram', 'png')}
                      disabled={isDownloading || !mermaidLoaded}
                      className="flex items-center gap-2 px-4 py-2 bg-soft-amber text-white rounded-lg hover:bg-amber-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium shadow-sm"
                    >
                      <Download className="w-4 h-4" />
                      {isDownloading ? 'Downloading...' : 'Download'}
                    </button>
                    <div className="absolute right-0 top-full mt-2 bg-white rounded-lg shadow-xl border border-earth-beige opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10 min-w-[180px]">
                      <div className="py-2">
                        <button
                          onClick={() => downloadDiagram('context-diagram', 'smart-care-context-diagram', 'png')}
                          disabled={isDownloading || !mermaidLoaded}
                          className="w-full px-4 py-2 text-left hover:bg-pale-stone flex items-center gap-2 text-graphite disabled:text-gray-400 disabled:cursor-not-allowed"
                        >
                          <FileImage className="w-4 h-4" />
                          Download as PNG
                        </button>
                        <button
                          onClick={() => downloadDiagram('context-diagram', 'smart-care-context-diagram', 'svg')}
                          disabled={isDownloading || !mermaidLoaded}
                          className="w-full px-4 py-2 text-left hover:bg-pale-stone flex items-center gap-2 text-graphite disabled:text-gray-400 disabled:cursor-not-allowed"
                        >
                          <FileImage className="w-4 h-4" />
                          Download as SVG
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Context Diagram */}
              <div id="context-diagram" className="bg-cream rounded-lg p-6 border-2 border-dashed border-earth-beige overflow-x-auto">
                <style jsx>{`
                  #context-diagram .mermaid svg {
                    width: 100% !important;
                    height: auto !important;
                    min-height: 1000px;
                    max-width: 100%;
                  }
                  #context-diagram .mermaid svg text {
                    font-size: 20px !important;
                    font-weight: 600;
                  }
                  #context-diagram .mermaid svg .nodeLabel {
                    font-size: 20px !important;
                    font-weight: 600;
                  }
                  #context-diagram .mermaid svg .edgeLabel {
                    font-size: 18px !important;
                    font-weight: 500;
                  }
                  #context-diagram .mermaid svg .node rect,
                  #context-diagram .mermaid svg .node circle,
                  #context-diagram .mermaid svg .node ellipse {
                    stroke-width: 4px !important;
                  }
                  #context-diagram .mermaid svg .edgePath path {
                    stroke-width: 3px !important;
                  }
                  #context-diagram .mermaid svg .node circle {
                    r: 80px !important;
                  }
                `}</style>
                <div className="mermaid min-w-full">
                  {`graph TB
    %% External Entities - Rectangles (Yourdon Style: Terminators)
    Patients[Patients]
    Doctors[Doctors]
    Administrators[Administrators]
    GoogleAuth[Google Authentication<br/>Service]
    
    %% Central System - Circle (Yourdon Style: Process/Bubble)
    System((Smart Care: A Real-Time<br/>Telehealth Platform with<br/>E-Prescriptions and<br/>Secure Medical Record Sharing))
    
    %% Data Flows from System to External Entities (Yourdon Style: Labeled Data Flows)
    System -->|"Authentication processes<br/>Notification delivery Email/SMS<br/>Communication services"| Patients
    System -->|"Professional profile management<br/>Schedule management<br/>Patient care documentation<br/>Prescription management"| Doctors
    System -->|"System configuration<br/>User management<br/>Access control<br/>Content management<br/>System monitoring<br/>Analytics and reporting"| Administrators
    System -->|"Authentication requests<br/>User verification"| GoogleAuth
    
    %% Data Flows from External Entities to System (Yourdon Style: Labeled Data Flows)
    Patients -->|"User requests<br/>Appointment bookings<br/>Medical inquiries<br/>Profile updates"| System
    Doctors -->|"Patient consultations<br/>Prescription creation<br/>Medical records updates<br/>Schedule updates"| System
    Administrators -->|"System configurations<br/>User approvals<br/>Content updates<br/>Access management"| System
    GoogleAuth -->|"Authentication processes<br/>User verification<br/>OAuth tokens"| System
    
    %% Yourdon Style Notation:
    %% - External Entities (Terminators) = Rectangles [ ]
    %% - Process = Circle ( )
    %% - Data Flows = Arrows with labels
    classDef externalEntity fill:#e1f5ff,stroke:#01579b,stroke-width:5px
    classDef system fill:#fff9c4,stroke:#f57f17,stroke-width:6px
    
    class Patients,Doctors,Administrators,GoogleAuth externalEntity
    class System system`}
                </div>
              </div>
            </div>
          </section>

          {/* Database Schema Section */}
          <section id="database" className="mb-8 scroll-mt-32">
            <div className="bg-white rounded-xl shadow-md p-6 border border-earth-beige">
              <div className="mb-6 flex items-center justify-between flex-wrap gap-4">
                <div>
                  <h2 className="text-2xl font-bold text-deep-forest mb-2 flex items-center gap-2">
                    <Database className="w-6 h-6 text-soft-amber" />
                    Database Schema (NoSQL - Firebase Firestore)
                  </h2>
                  <p className="text-drift-gray">Document-based database structure showing collections, documents, and relationships</p>
                </div>
                <div className="flex gap-2">
                  <div className="relative group">
                    <button
                      onClick={() => downloadDiagram('database-schema', 'smart-care-database-schema', 'png')}
                      disabled={isDownloading || !mermaidLoaded}
                      className="flex items-center gap-2 px-4 py-2 bg-soft-amber text-white rounded-lg hover:bg-amber-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium shadow-sm"
                    >
                      <Download className="w-4 h-4" />
                      {isDownloading ? 'Downloading...' : 'Download'}
                    </button>
                    <div className="absolute right-0 top-full mt-2 bg-white rounded-lg shadow-xl border border-earth-beige opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10 min-w-[180px]">
                      <div className="py-2">
                        <button
                          onClick={() => downloadDiagram('database-schema', 'smart-care-database-schema', 'png')}
                          disabled={isDownloading || !mermaidLoaded}
                          className="w-full px-4 py-2 text-left hover:bg-pale-stone flex items-center gap-2 text-graphite disabled:text-gray-400 disabled:cursor-not-allowed"
                        >
                          <FileImage className="w-4 h-4" />
                          Download as PNG
                        </button>
                        <button
                          onClick={() => downloadDiagram('database-schema', 'smart-care-database-schema', 'svg')}
                          disabled={isDownloading || !mermaidLoaded}
                          className="w-full px-4 py-2 text-left hover:bg-pale-stone flex items-center gap-2 text-graphite disabled:text-gray-400 disabled:cursor-not-allowed"
                        >
                          <FileImage className="w-4 h-4" />
                          Download as SVG
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Database Schema Diagram */}
              <div id="database-schema" className="bg-cream rounded-lg p-6 border-2 border-dashed border-earth-beige overflow-x-auto">
                <style jsx>{`
                  #database-schema .mermaid svg {
                    width: 100% !important;
                    height: auto !important;
                    min-height: 3000px;
                    max-width: 100%;
                  }
                  #database-schema .mermaid svg text {
                    font-size: 22px !important;
                    font-weight: 600;
                  }
                  #database-schema .mermaid svg .nodeLabel {
                    font-size: 22px !important;
                    font-weight: 600;
                  }
                  #database-schema .mermaid svg .edgeLabel {
                    font-size: 20px !important;
                    font-weight: 500;
                  }
                  #database-schema .mermaid svg .node rect,
                  #database-schema .mermaid svg .node circle,
                  #database-schema .mermaid svg .node ellipse {
                    stroke-width: 4px !important;
                  }
                  #database-schema .mermaid svg .edgePath path {
                    stroke-width: 3px !important;
                  }
                  #database-schema .mermaid svg .node {
                    min-width: 400px !important;
                    min-height: 100px !important;
                  }
                `}</style>
                <div className="mermaid min-w-full">
                  {`graph TB
    %% Core Collections
    subgraph Core["Core Collections"]
        USERS["users Collection<br/>━━━━━━━━━━━━━━━━━━━━<br/>id: string<br/>email: string<br/>name: string<br/>role: patient|doctor|admin<br/>status: pending|approved|rejected<br/>phoneNumber: string<br/>address: string<br/>profileImage: object<br/>createdAt: timestamp<br/>updatedAt: timestamp"]
        
        APPOINTMENTS["appointments Collection<br/>━━━━━━━━━━━━━━━━━━━━<br/>id: string<br/>patientId: string<br/>doctorId: string<br/>date: timestamp<br/>time: string<br/>type: online|in-person<br/>status: pending|approved|rejected|completed<br/>reason: string<br/>notes: string<br/>createdAt: timestamp<br/>updatedAt: timestamp"]
        
        PRESCRIPTIONS["prescriptions Collection<br/>━━━━━━━━━━━━━━━━━━━━<br/>id: string<br/>patientId: string<br/>doctorId: string<br/>appointmentId: string<br/>medications: array<br/>instructions: string<br/>signature: string<br/>status: active|expired<br/>createdAt: timestamp<br/>expiresAt: timestamp"]
        
        MEDICAL_RECORDS["medicalRecords Collection<br/>━━━━━━━━━━━━━━━━━━━━<br/>id: string<br/>patientId: string<br/>doctorId: string<br/>title: string<br/>description: string<br/>files: array<br/>sharedWith: array<br/>type: string<br/>createdAt: timestamp<br/>updatedAt: timestamp"]
    end
    
    %% Communication Collections
    subgraph Communication["Communication Collections"]
        CONVERSATIONS["conversations Collection<br/>━━━━━━━━━━━━━━━━━━━━<br/>id: string<br/>participants: array userIds<br/>lastMessage: string<br/>lastMessageAt: timestamp<br/>lastMessageBy: object<br/>unread: boolean<br/>createdAt: timestamp<br/>updatedAt: timestamp"]
        
        MESSAGES["messages Subcollection<br/>conversations/messages<br/>━━━━━━━━━━━━━━━━━━━━<br/>id: string<br/>conversationId: string<br/>senderId: string<br/>content: string<br/>type: text|image|voice|file<br/>attachments: object<br/>read: boolean<br/>readAt: timestamp<br/>createdAt: timestamp"]
        
        CALLS["calls Collection<br/>━━━━━━━━━━━━━━━━━━━━<br/>id: string<br/>callerId: string<br/>receiverId: string<br/>appointmentId: string<br/>type: video|voice<br/>status: calling|active|ended<br/>startedAt: timestamp<br/>endedAt: timestamp<br/>roomData: object"]
        
        CANDIDATES["candidates Subcollection<br/>calls/candidates<br/>━━━━━━━━━━━━━━━━━━━━<br/>id: string<br/>callId: string<br/>candidate: string<br/>type: offer|answer|candidate<br/>createdAt: timestamp"]
    end
    
    %% System Collections
    subgraph System["System Collections"]
        NOTIFICATIONS["notifications Collection<br/>━━━━━━━━━━━━━━━━━━━━<br/>id: string<br/>userId: string<br/>type: string<br/>title: string<br/>message: string<br/>link: string<br/>read: boolean<br/>createdAt: timestamp"]
        
        LOGS["logs Collection<br/>━━━━━━━━━━━━━━━━━━━━<br/>id: string<br/>userId: string<br/>action: string<br/>userRole: string<br/>details: object<br/>createdAt: timestamp"]
        
        SESSIONS["sessions Collection<br/>━━━━━━━━━━━━━━━━━━━━<br/>id: string<br/>userId: string<br/>deviceId: string<br/>ipAddress: string<br/>userAgent: string<br/>lastActivity: timestamp<br/>expiresAt: timestamp<br/>trusted: boolean"]
        
        SUSPICIOUS_LOGINS["suspiciousLogins Collection<br/>━━━━━━━━━━━━━━━━━━━━<br/>id: string<br/>userId: string<br/>email: string<br/>ipAddress: string<br/>userAgent: string<br/>reason: string<br/>createdAt: timestamp"]
    end
    
    %% Content & Management Collections
    subgraph Content["Content & Management Collections"]
        TESTIMONIALS["testimonials Collection<br/>━━━━━━━━━━━━━━━━━━━━<br/>id: string<br/>userId: string<br/>userRole: patient|doctor<br/>content: string<br/>rating: number<br/>approved: boolean<br/>featured: boolean<br/>createdAt: timestamp"]
        
        CONTACT_MESSAGES["contact_messages Collection<br/>━━━━━━━━━━━━━━━━━━━━<br/>id: string<br/>name: string<br/>email: string<br/>subject: string<br/>message: string<br/>read: boolean<br/>replyStatus: string<br/>createdAt: timestamp"]
        
        AVAILABILITY["availability Collection<br/>━━━━━━━━━━━━━━━━━━━━<br/>id: string<br/>doctorId: string<br/>dayOfWeek: string<br/>startTime: string<br/>endTime: string<br/>available: boolean<br/>createdAt: timestamp"]
        
        ACCESS_LOGS["accessLogs Collection<br/>━━━━━━━━━━━━━━━━━━━━<br/>id: string<br/>userId: string<br/>recordId: string<br/>action: view|download|share<br/>createdAt: timestamp"]
        
        ACCESS_REQUESTS["accessRequests Collection<br/>━━━━━━━━━━━━━━━━━━━━<br/>id: string<br/>requesterId: string<br/>recordId: string<br/>status: pending|approved|rejected<br/>createdAt: timestamp<br/>updatedAt: timestamp"]
        
        ROLES["roles Collection<br/>━━━━━━━━━━━━━━━━━━━━<br/>id: string<br/>name: string<br/>permissions: array<br/>createdAt: timestamp"]
        
        REPORTS["reports Collection<br/>━━━━━━━━━━━━━━━━━━━━<br/>id: string<br/>type: string<br/>generatedBy: string<br/>data: object<br/>createdAt: timestamp"]
        
        SYSTEM_METRICS["system_metrics Collection<br/>━━━━━━━━━━━━━━━━━━━━<br/>id: string<br/>totalUsers: number<br/>totalAppointments: number<br/>activeSessions: number<br/>timestamp: timestamp"]
    end
    
    %% Styling - Color-coded (NoSQL has no connections, just collections)
    classDef coreCollection fill:#e1f5ff,stroke:#01579b,stroke-width:4px
    classDef commCollection fill:#f3e5f5,stroke:#4a148c,stroke-width:4px
    classDef systemCollection fill:#fff9c4,stroke:#f57f17,stroke-width:4px
    classDef contentCollection fill:#e8f5e9,stroke:#1b5e20,stroke-width:4px
    
    class USERS,APPOINTMENTS,PRESCRIPTIONS,MEDICAL_RECORDS coreCollection
    class CONVERSATIONS,MESSAGES,CALLS,CANDIDATES commCollection
    class NOTIFICATIONS,LOGS,SESSIONS,SUSPICIOUS_LOGINS systemCollection
    class TESTIMONIALS,CONTACT_MESSAGES,AVAILABILITY,ACCESS_LOGS,ACCESS_REQUESTS,ROLES,REPORTS,SYSTEM_METRICS contentCollection`}
                </div>
              </div>
            </div>
          </section>

          {/* Activity Diagram */}
          <section id="activity" className="mb-8 scroll-mt-32">
            <div className="bg-white rounded-xl shadow-md p-6 border border-earth-beige">
              <div className="mb-6 flex items-center justify-between flex-wrap gap-4">
                <div>
                  <h2 className="text-2xl font-bold text-deep-forest mb-2 flex items-center gap-2">
                    <Activity className="w-6 h-6 text-soft-amber" />
                    Activity Diagram
                  </h2>
                  <p className="text-drift-gray">Comprehensive process flow showing all major system activities</p>
                </div>
                <div className="flex gap-2">
                  <div className="relative group">
                    <button
                      onClick={() => downloadDiagram('activity-diagram', 'smart-care-activity-diagram', 'png')}
                      disabled={isDownloading || !mermaidLoaded}
                      className="flex items-center gap-2 px-4 py-2 bg-soft-amber text-white rounded-lg hover:bg-amber-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium shadow-sm"
                    >
                      <Download className="w-4 h-4" />
                      {isDownloading ? 'Downloading...' : 'Download'}
                    </button>
                    <div className="absolute right-0 top-full mt-2 bg-white rounded-lg shadow-xl border border-earth-beige opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10 min-w-[180px]">
                      <div className="py-2">
                        <button
                          onClick={() => downloadDiagram('activity-diagram', 'smart-care-activity-diagram', 'png')}
                          disabled={isDownloading || !mermaidLoaded}
                          className="w-full px-4 py-2 text-left hover:bg-pale-stone flex items-center gap-2 text-graphite disabled:text-gray-400 disabled:cursor-not-allowed"
                        >
                          <FileImage className="w-4 h-4" />
                          Download as PNG
                        </button>
                        <button
                          onClick={() => downloadDiagram('activity-diagram', 'smart-care-activity-diagram', 'svg')}
                          disabled={isDownloading || !mermaidLoaded}
                          className="w-full px-4 py-2 text-left hover:bg-pale-stone flex items-center gap-2 text-graphite disabled:text-gray-400 disabled:cursor-not-allowed"
                        >
                          <FileImage className="w-4 h-4" />
                          Download as SVG
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Unified Activity Diagram */}
              <div id="activity-diagram" className="bg-cream rounded-lg p-6 border-2 border-dashed border-earth-beige overflow-y-auto">
                <style jsx>{`
                  #activity-diagram .mermaid svg {
                    width: 100% !important;
                    height: auto !important;
                    min-height: 3000px;
                    max-width: 100%;
                  }
                  #activity-diagram .mermaid svg text {
                    font-size: 18px !important;
                    font-weight: 500;
                  }
                  #activity-diagram .mermaid svg .nodeLabel {
                    font-size: 18px !important;
                  }
                  #activity-diagram .mermaid svg .edgeLabel {
                    font-size: 15px !important;
                  }
                  #activity-diagram .mermaid svg .node rect,
                  #activity-diagram .mermaid svg .node circle,
                  #activity-diagram .mermaid svg .node ellipse {
                    stroke-width: 4px !important;
                  }
                  #activity-diagram .mermaid svg .node {
                    min-width: 200px !important;
                    min-height: 50px !important;
                  }
                `}</style>
                <div className="mermaid min-w-full">
                  {`flowchart TB
    %% User Registration & Authentication Flow
    Start([User Starts Registration]) --> FillForm[Fill Registration Form]
    FillForm --> Submit[Submit Registration]
    Submit --> Validate{Validate Data}
    Validate -->|Invalid| ShowError[Show Error Message]
    ShowError --> FillForm
    Validate -->|Valid| CreateAccount[Create Account in Firebase]
    CreateAccount --> SetPending[Set Status: Pending]
    SetPending --> NotifyAdmin[Notify Admin]
    NotifyAdmin --> WaitApproval{Wait for Admin Approval}
    WaitApproval -->|Pending| WaitApproval
    WaitApproval -->|Approved| SendApprovalEmail[Send Approval Email]
    WaitApproval -->|Rejected| EndReject([Account Rejected])
    SendApprovalEmail --> LoginPage[Redirect to Login]
    
    LoginPage --> EnterCredentials[Enter Login Credentials]
    EnterCredentials --> CheckDevice{New Device?}
    CheckDevice -->|Yes| DeviceAuth[Device Authentication Required]
    CheckDevice -->|No| Authenticate[Authenticate with Firebase]
    DeviceAuth --> SendDeviceEmail[Send Device Approval Email]
    SendDeviceEmail --> WaitDevice{Wait Device Approval}
    WaitDevice -->|Pending| WaitDevice
    WaitDevice -->|Approved| Authenticate
    WaitDevice -->|Denied| EndDenied([Login Denied])
    
    Authenticate --> CheckRole{Check User Role}
    CheckRole -->|Patient| PatientDashboard[Patient Dashboard]
    CheckRole -->|Doctor| DoctorDashboard[Doctor Dashboard]
    CheckRole -->|Admin| AdminDashboard[Admin Dashboard]
    
    %% Appointment Booking Flow (from Patient Dashboard)
    PatientDashboard --> BookAppointment[Book Appointment]
    BookAppointment --> SelectDoctor[Select Doctor]
    SelectDoctor --> ViewAvailability[View Doctor Availability]
    ViewAvailability --> SelectDate[Select Date & Time]
    SelectDate --> SelectType{Appointment Type?}
    SelectType -->|Online| SetOnline[Set Type: Online]
    SelectType -->|In-Person| SetInPerson[Set Type: In-Person]
    SetOnline --> FillDetails[Fill Appointment Details]
    SetInPerson --> FillDetails
    FillDetails --> SubmitBooking[Submit Booking Request]
    SubmitBooking --> CreateAppointment[Create Appointment Record]
    CreateAppointment --> SetStatusPending[Set Status: Pending]
    SetStatusPending --> NotifyDoctor2[Notify Doctor]
    NotifyDoctor2 --> WaitApproval2{Doctor Reviews}
    WaitApproval2 -->|Approve| SetApproved[Set Status: Approved]
    WaitApproval2 -->|Reject| SetRejected[Set Status: Rejected]
    WaitApproval2 -->|Pending| WaitApproval2
    SetApproved --> SendConfirmation[Send Confirmation to Patient]
    SetRejected --> SendRejection[Send Rejection to Patient]
    SendConfirmation --> ReminderCheck{Time for Reminder?}
    ReminderCheck -->|Yes| SendReminder[Send Appointment Reminder]
    ReminderCheck -->|No| WaitAppointment
    SendReminder --> WaitAppointment{Appointment Time}
    WaitAppointment --> AppointmentDay[Appointment Day]
    AppointmentDay --> CheckType{Appointment Type?}
    CheckType -->|Online| StartVideoCall[Start Video Call]
    CheckType -->|In-Person| MarkCompleted[Mark as Completed]
    
    %% Video Call Flow
    StartVideoCall --> CreateRoom[Create Video Room]
    CreateRoom --> SetRoomStatus[Set Room Status: Active]
    SetRoomStatus --> InvitePatient[Invite Patient to Room]
    InvitePatient --> SendNotification[Send Notification to Patient]
    SendNotification --> PatientReceives{Patient Receives?}
    PatientReceives -->|No| WaitPatient[Wait for Patient]
    WaitPatient --> PatientReceives
    PatientReceives -->|Yes| PatientJoins[Patient Joins Room]
    PatientJoins --> WebRTCSetup[WebRTC Connection Setup]
    WebRTCSetup --> ExchangeSignals[Exchange ICE Candidates & SDP]
    ExchangeSignals --> EstablishConnection{Connection Established?}
    EstablishConnection -->|No| RetryConnection[Retry Connection]
    RetryConnection --> ExchangeSignals
    EstablishConnection -->|Yes| MediaStream[Start Media Stream]
    MediaStream --> VideoActive[Video Call Active]
    VideoActive --> Controls{User Actions}
    Controls -->|Mute/Unmute| ToggleAudio[Toggle Audio]
    Controls -->|Camera On/Off| ToggleVideo[Toggle Video]
    Controls -->|Screen Share| StartScreenShare[Start Screen Sharing]
    Controls -->|End Call| EndCall[End Call]
    ToggleAudio --> VideoActive
    ToggleVideo --> VideoActive
    StartScreenShare --> VideoActive
    EndCall --> UpdateRoomStatus[Update Room Status: Ended]
    UpdateRoomStatus --> RedirectDoctor[Redirect Doctor to Dashboard]
    UpdateRoomStatus --> RedirectPatient[Redirect Patient to Dashboard]
    RedirectDoctor --> SaveCallLog[Save Call Log]
    RedirectPatient --> SaveCallLog
    SaveCallLog --> MarkCompleted
    MarkCompleted --> EndAppointment([Appointment Completed])
    
    %% Prescription Creation Flow (from Doctor Dashboard)
    DoctorDashboard --> CreatePrescription[Create Prescription]
    CreatePrescription --> SelectPatient[Select Patient]
    SelectPatient --> ViewHistory[View Patient Medical History]
    ViewHistory --> CreatePrescription2[Create New Prescription]
    CreatePrescription2 --> AddMedication[Add Medication Details]
    AddMedication --> MedicationDetails{More Medications?}
    MedicationDetails -->|Yes| AddMedication
    MedicationDetails -->|No| AddInstructions[Add Instructions]
    AddInstructions --> ReviewPrescription[Review Prescription]
    ReviewPrescription --> DigitalSign[Apply Digital Signature]
    DigitalSign --> ValidatePrescription{Validate Prescription}
    ValidatePrescription -->|Invalid| ReviewPrescription
    ValidatePrescription -->|Valid| SavePrescription[Save Prescription to Database]
    SavePrescription --> SetStatus[Set Status: Active]
    SetStatus --> NotifyPatient[Notify Patient]
    NotifyPatient --> SendEmail[Send Email Notification]
    SendEmail --> UpdateHistory[Update Patient Prescription History]
    UpdateHistory --> EndPrescription([Prescription Created])
    
    %% Admin Account Approval Flow (from Admin Dashboard)
    AdminDashboard --> ViewPending[View Pending Accounts]
    ViewPending --> SelectAccount[Select Account to Review]
    SelectAccount --> ViewDetails[View Account Details]
    ViewDetails --> ReviewInfo{Review Information}
    ReviewInfo --> CheckDocuments[Check Submitted Documents]
    CheckDocuments --> VerifyData{Verify Data}
    VerifyData -->|Incomplete| RequestMore[Request More Information]
    RequestMore --> NotifyUser[Notify User]
    NotifyUser --> ViewPending
    VerifyData -->|Complete| MakeDecision{Approve or Reject?}
    MakeDecision -->|Approve| ApproveAccount[Approve Account]
    MakeDecision -->|Reject| RejectAccount[Reject Account]
    ApproveAccount --> UpdateStatus2[Update Status: Approved]
    UpdateStatus2 --> ActivateAccount[Activate User Account]
    ActivateAccount --> SendApprovalEmail2[Send Approval Email]
    SendApprovalEmail2 --> LogAction[Log Approval Action]
    LogAction --> UpdateMetrics[Update System Metrics]
    UpdateMetrics --> EndApprove([Account Approved])
    RejectAccount --> UpdateStatusReject[Update Status: Rejected]
    UpdateStatusReject --> SendRejectionEmail2[Send Rejection Email]
    SendRejectionEmail2 --> LogRejection[Log Rejection Action]
    LogRejection --> UpdateMetrics
    UpdateMetrics --> EndReject2([Account Rejected])
    
    %% End States
    PatientDashboard --> End([User Logged In])
    DoctorDashboard --> End
    AdminDashboard --> End
    
    %% Styling - Color-coded like System Architecture (larger for Word documentation)
    classDef authFlow fill:#fff3e0,stroke:#e65100,stroke-width:3px
    classDef appointmentFlow fill:#e8f5e9,stroke:#1b5e20,stroke-width:3px
    classDef videoFlow fill:#fce4ec,stroke:#880e4f,stroke-width:3px
    classDef prescriptionFlow fill:#e1f5ff,stroke:#01579b,stroke-width:3px
    classDef adminFlow fill:#fff9c4,stroke:#f57f17,stroke-width:3px
    classDef dashboard fill:#f3e5f5,stroke:#4a148c,stroke-width:4px
    classDef endState fill:#e0f2f1,stroke:#004d40,stroke-width:4px
    
    class Start,FillForm,Submit,Validate,ShowError,CreateAccount,SetPending,NotifyAdmin,WaitApproval,SendApprovalEmail,SendRejectionEmail,LoginPage,EnterCredentials,CheckDevice,DeviceAuth,SendDeviceEmail,WaitDevice,Authenticate,CheckRole authFlow
    class BookAppointment,SelectDoctor,ViewAvailability,SelectDate,SelectType,SetOnline,SetInPerson,FillDetails,SubmitBooking,CreateAppointment,SetStatusPending,NotifyDoctor2,WaitApproval2,SetApproved,SetRejected,SendConfirmation,SendRejection,ReminderCheck,SendReminder,WaitAppointment,AppointmentDay,CheckType,MarkCompleted appointmentFlow
    class StartVideoCall,CreateRoom,SetRoomStatus,InvitePatient,SendNotification,PatientReceives,WaitPatient,PatientJoins,WebRTCSetup,ExchangeSignals,EstablishConnection,RetryConnection,MediaStream,VideoActive,Controls,ToggleAudio,ToggleVideo,StartScreenShare,EndCall,UpdateRoomStatus,RedirectDoctor,RedirectPatient,SaveCallLog videoFlow
    class CreatePrescription,SelectPatient,ViewHistory,CreatePrescription2,AddMedication,MedicationDetails,AddInstructions,ReviewPrescription,DigitalSign,ValidatePrescription,SavePrescription,SetStatus,NotifyPatient,SendEmail,UpdateHistory prescriptionFlow
    class ViewPending,SelectAccount,ViewDetails,ReviewInfo,CheckDocuments,VerifyData,RequestMore,NotifyUser,MakeDecision,ApproveAccount,RejectAccount,UpdateStatus2,ActivateAccount,SendApprovalEmail2,LogAction,UpdateMetrics,UpdateStatusReject,SendRejectionEmail2,LogRejection adminFlow
    class PatientDashboard,DoctorDashboard,AdminDashboard dashboard
    class End,EndReject,EndDenied,EndAppointment,EndPrescription,EndApprove,EndReject2 endState`}
                </div>
              </div>
            </div>
          </section>
        </main>
      </div>
    </>
  )
}



