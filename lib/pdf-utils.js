import { jsPDF } from "jspdf"
import "jspdf-autotable"

// Function to calculate age from birthdate
export const calculateAge = (birthdate) => {
  const today = new Date()
  const birthDate = new Date(birthdate)
  let age = today.getFullYear() - birthDate.getFullYear()
  const monthDifference = today.getMonth() - birthDate.getMonth()

  if (monthDifference < 0 || (monthDifference === 0 && today.getDate() < birthDate.getDate())) {
    age--
  }

  return age
}

// Function to format date as Month DD, YYYY
export const formatDate = (date) => {
  const options = { year: "numeric", month: "long", day: "numeric" }
  return new Date(date).toLocaleDateString("en-US", options)
}

// Function to format date as MM/DD/YYYY (same as doctor's preview)
const formatDateMMDDYYYY = (date) => {
  const d = date?.seconds ? new Date(date.seconds * 1000) : date?.toDate ? date.toDate() : new Date(date || new Date())
  const month = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  const year = d.getFullYear()
  return `${month}/${day}/${year}`
}

// Function to generate prescription PDF matching the template format
export const generatePrescriptionPDF = (prescription, doctorInfo, patientInfo) => {
  // Get template format from prescription or default to classic
  const template = prescription.template || "classic"
  
  // Use saved prescription data (exact same as doctor's preview)
  const patientName = prescription.patientName || patientInfo?.name || ""
  const patientAddress = prescription.patientAddress || patientInfo?.address || ""
  const patientAge = prescription.patientAge || patientInfo?.age || ""
  const patientGender = prescription.patientGender || patientInfo?.gender || ""
  
  // Get prescription date
  const prescriptionDate = prescription.startDate || prescription.createdAt || new Date()
  const formattedDate = formatDateMMDDYYYY(prescriptionDate)
  
  // Set PDF size based on template format
  let pdfFormat = "a5" // Default: 148mm x 210mm
  let pageWidth = 148
  
  // Adjust size based on template
  if (template === "compact") {
    pdfFormat = [148, 180] // Smaller, more compact
  } else if (template === "modern") {
    pdfFormat = "a5" // Standard size
  } else {
    pdfFormat = "a5" // Classic - standard size
  }
  
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: pdfFormat,
  })
  
  pageWidth = doc.internal.pageSize.getWidth()

  // Classic Template
  if (template === "classic") {
    // Watermark background (subtle)
    doc.setTextColor(209, 213, 219) // gray-300
    doc.setFontSize(60)
    doc.setFont("helvetica", "bold")
    doc.text("Smart Care", pageWidth / 2, 105, { 
      align: "center",
      angle: -45,
      opacity: 0.1
    })
    
    // Reset text color
    doc.setTextColor(0, 0, 0)
    
    // Header Section
    doc.setFontSize(10)
    doc.setFont("helvetica", "normal")
    if (doctorInfo.province) {
      doc.text(`Province of ${doctorInfo.province}`, pageWidth / 2, 15, { align: "center" })
    }
    if (doctorInfo.healthOffice) {
      doc.text(doctorInfo.healthOffice, pageWidth / 2, 20, { align: "center" })
    }
    if (doctorInfo.clinicAddress) {
      doc.setFont("helvetica", "bold")
      doc.text(doctorInfo.clinicAddress, pageWidth / 2, 25, { align: "center" })
      doc.setFont("helvetica", "normal")
    }
    if (doctorInfo.contactNumber) {
      doc.text(`Telephone No.: ${doctorInfo.contactNumber}`, pageWidth / 2, 30, { align: "center" })
    }
    if (doctorInfo.email) {
      doc.text(`Email Address: ${doctorInfo.email}`, pageWidth / 2, 35, { align: "center" })
    }
    
    // Separator
    doc.setLineWidth(0.5)
    doc.line(10, 40, pageWidth - 10, 40)
    
    let yPos = 50
    
    // Patient Information
    doc.setFontSize(10)
    doc.text("Name:", 10, yPos)
    doc.text(patientName || "_______________________", 35, yPos)
    doc.text(`Date: ${formattedDate}`, pageWidth - 30, yPos)
    
    yPos += 8
    doc.text("Address:", 10, yPos)
    doc.text(patientAddress || "_______________________", 35, yPos)
    
    yPos += 8
    doc.text("Age:", 10, yPos)
    doc.text(patientAge || "____", 35, yPos)
    doc.text("Sex:", pageWidth / 2, yPos)
    doc.text(patientGender || "____", pageWidth / 2 + 15, yPos)
    
    yPos += 15
    
    // Prescription Section with Rx symbol
    doc.setFontSize(50)
    doc.setTextColor(217, 119, 6) // soft-amber
    doc.text("℞", 15, yPos)
    doc.setTextColor(0, 0, 0)
    
    doc.setFontSize(10)
    yPos += 8
    const startX = 35
    
    // Medications
    prescription.medications?.forEach((med, index) => {
      if (med.instructions) {
        doc.text(med.instructions, startX, yPos)
        yPos += 5
        if (med.name) {
          doc.text(`${med.name} ${med.dosage ? `- ${med.dosage}` : ""}${med.frequency ? `, ${med.frequency}` : ""}${med.duration ? `, ${med.duration}` : ""}`, startX + 10, yPos)
          yPos += 5
        }
      } else {
        if (med.name) {
          doc.text(`${med.name} ${med.dosage ? `- ${med.dosage}` : ""}${med.frequency ? `, ${med.frequency}` : ""}${med.duration ? `, ${med.duration}` : ""}`, startX, yPos)
          yPos += 5
        }
        if (med.instructions) {
          doc.setFont("helvetica", "italic")
          doc.text(`(${med.instructions})`, startX + 10, yPos)
          doc.setFont("helvetica", "normal")
          yPos += 5
        }
      }
      yPos += 2
    })
    
    // Notes
    if (prescription.notes) {
      yPos += 5
      doc.setFont("helvetica", "bold")
      doc.text("Notes: ", 10, yPos)
      doc.setFont("helvetica", "normal")
      doc.text(prescription.notes, 30, yPos)
      yPos += 8
    }
    
    // Footer - Physician and License
    yPos = doc.internal.pageSize.getHeight() - 40
    doc.setLineWidth(0.5)
    doc.line(10, yPos, pageWidth - 10, yPos)
    yPos += 8
    
    doc.setFontSize(10)
    doc.text("Physician:", pageWidth - 70, yPos)
    if (prescription.signature) {
      try {
        doc.addImage(prescription.signature, "PNG", pageWidth - 60, yPos - 8, 50, 10)
      } catch (error) {
        doc.setLineWidth(0.5)
        doc.line(pageWidth - 60, yPos - 2, pageWidth - 10, yPos - 2)
      }
    } else {
      doc.setLineWidth(0.5)
      doc.line(pageWidth - 60, yPos - 2, pageWidth - 10, yPos - 2)
    }
    
    yPos += 8
    doc.text("License No.:", pageWidth - 70, yPos)
    const licenseText = doctorInfo.licenseNumber?.toLowerCase().startsWith("prc")
      ? doctorInfo.licenseNumber.replace(/^prc-?/i, "PRC-")
      : `PRC-${doctorInfo.licenseNumber || ""}`
    doc.text(licenseText, pageWidth - 40, yPos)
    
    yPos += 5
    doc.setFontSize(8)
    doc.setTextColor(128, 128, 128)
    doc.text("e prescription", pageWidth / 2, yPos, { align: "center" })
  }
  
  // Modern Template (similar structure, different layout)
  else if (template === "modern") {
    // Similar implementation but with modern layout
    // Header with Rx on left
    doc.setFontSize(30)
    doc.setTextColor(217, 119, 6)
    doc.text("℞", 15, 25)
    doc.setTextColor(0, 0, 0)
    
    doc.setFontSize(14)
    doc.setFont("helvetica", "bold")
    doc.text(doctorInfo.clinicAddress || "Clinic Name", 35, 20)
    
    doc.setFontSize(10)
    doc.setFont("helvetica", "normal")
    if (doctorInfo.contactNumber) {
      doc.text(`📞 ${doctorInfo.contactNumber}`, 35, 25)
    }
    if (doctorInfo.email) {
      doc.text(`✉️ ${doctorInfo.email}`, 35, 30)
    }
    
    doc.setLineWidth(0.5)
    doc.line(10, 40, pageWidth - 10, 40)
    
    let yPos = 50
    
    // Patient info - modern layout
    doc.setFontSize(8)
    doc.text("Patient Name", 10, yPos)
    doc.setFontSize(10)
    doc.setFont("helvetica", "bold")
    doc.text(patientName || "_______________________", 10, yPos + 5)
    doc.setFont("helvetica", "normal")
    doc.setFontSize(8)
    doc.text("Date", pageWidth - 30, yPos)
    doc.setFontSize(10)
    doc.text(formattedDate, pageWidth - 30, yPos + 5)
    
    yPos += 12
    doc.setFontSize(8)
    doc.text("Address", 10, yPos)
    doc.setFontSize(10)
    doc.setFont("helvetica", "bold")
    doc.text(patientAddress || "_______________________", 10, yPos + 5)
    
    yPos += 12
    doc.setFontSize(8)
    doc.text("Age", 10, yPos)
    doc.setFontSize(10)
    doc.text(patientAge || "____", 10, yPos + 5)
    doc.setFontSize(8)
    doc.text("Sex", 40, yPos)
    doc.setFontSize(10)
    doc.text(patientGender || "____", 40, yPos + 5)
    
    yPos += 15
    doc.setFontSize(12)
    doc.setFont("helvetica", "bold")
    doc.text("Prescription", 10, yPos)
    
    yPos += 8
    doc.setFontSize(10)
    doc.setFont("helvetica", "normal")
    
    prescription.medications?.forEach((med) => {
      doc.setLineWidth(1)
      doc.setDrawColor(217, 119, 6)
      doc.line(10, yPos - 3, 12, yPos - 3)
      
      doc.setFont("helvetica", "bold")
      doc.text(`${med.name} ${med.dosage ? `(${med.dosage})` : ""}`, 15, yPos)
      yPos += 5
      doc.setFont("helvetica", "normal")
      doc.text(`${med.frequency || ""}${med.duration ? ` • ${med.duration}` : ""}`, 15, yPos)
      yPos += 5
      if (med.instructions) {
        doc.setFont("helvetica", "italic")
        doc.text(med.instructions, 15, yPos)
        doc.setFont("helvetica", "normal")
        yPos += 5
      }
      yPos += 3
    })
    
    if (prescription.notes) {
      yPos += 5
      doc.setFillColor(240, 240, 240)
      doc.rect(10, yPos - 5, pageWidth - 20, 10, "F")
      doc.setFontSize(8)
      doc.text("Notes", 12, yPos)
      doc.setFontSize(10)
      doc.text(prescription.notes, 12, yPos + 5)
      yPos += 12
    }
    
    // Footer
    yPos = doc.internal.pageSize.getHeight() - 40
    doc.setLineWidth(0.5)
    doc.line(10, yPos, pageWidth - 10, yPos)
    yPos += 8
    
    doc.setFontSize(10)
    doc.text("Physician:", pageWidth - 70, yPos)
    if (prescription.signature) {
      try {
        doc.addImage(prescription.signature, "PNG", pageWidth - 50, yPos - 8, 40, 10)
      } catch (error) {
        doc.setLineWidth(0.5)
        doc.line(pageWidth - 50, yPos - 2, pageWidth - 10, yPos - 2)
      }
    } else {
      doc.setLineWidth(0.5)
      doc.line(pageWidth - 50, yPos - 2, pageWidth - 10, yPos - 2)
    }
    
    yPos += 8
    const licenseText = doctorInfo.licenseNumber?.toLowerCase().startsWith("prc")
      ? doctorInfo.licenseNumber.replace(/^prc-?/i, "PRC-")
      : `PRC-${doctorInfo.licenseNumber || ""}`
    doc.text(`License No.: ${licenseText}`, pageWidth - 70, yPos)
    
    yPos += 8
    doc.setFontSize(8)
    doc.setTextColor(128, 128, 128)
    doc.text("e prescription", pageWidth / 2, yPos, { align: "center" })
  }
  
  // Compact Template
  else {
    doc.setFontSize(20)
    doc.setTextColor(217, 119, 6)
    doc.text("℞", 10, 15)
    doc.setTextColor(0, 0, 0)
    
    doc.setFontSize(10)
    doc.setFont("helvetica", "bold")
    doc.text(doctorInfo.clinicAddress || "Clinic", 25, 12)
    doc.setFont("helvetica", "normal")
    doc.setFontSize(8)
    if (doctorInfo.contactNumber) {
      doc.text(doctorInfo.contactNumber, 25, 17)
    }
    doc.text(formattedDate, pageWidth - 30, 15)
    
    doc.setLineWidth(0.3)
    doc.line(10, 22, pageWidth - 10, 22)
    
    let yPos = 30
    
    doc.setFontSize(8)
    doc.text("Name:", 10, yPos)
    doc.text(patientName || "_______", 25, yPos)
    yPos += 6
    doc.text("Age:", 10, yPos)
    doc.text(patientAge || "____", 25, yPos)
    doc.text("Sex:", 45, yPos)
    doc.text(patientGender || "____", 55, yPos)
    yPos += 6
    doc.text("Address:", 10, yPos)
    doc.text(patientAddress || "_______________________", 30, yPos)
    
    yPos += 10
    doc.setFontSize(9)
    doc.setFont("helvetica", "bold")
    doc.text("Rx:", 10, yPos)
    
    yPos += 6
    doc.setFontSize(8)
    doc.setFont("helvetica", "normal")
    prescription.medications?.forEach((med, index) => {
      doc.text(`${index + 1}. ${med.name}`, 15, yPos)
      yPos += 4
      doc.text(`   ${med.dosage || ""}${med.frequency ? `, ${med.frequency}` : ""}${med.duration ? `, ${med.duration}` : ""}`, 15, yPos)
      yPos += 4
      if (med.instructions) {
        doc.setFont("helvetica", "italic")
        doc.text(`   (${med.instructions})`, 18, yPos)
        doc.setFont("helvetica", "normal")
        yPos += 4
      }
      yPos += 2
    })
    
    if (prescription.notes) {
      yPos += 3
      doc.setFillColor(240, 240, 240)
      doc.rect(10, yPos - 4, pageWidth - 20, 6, "F")
      doc.setFont("helvetica", "bold")
      doc.text("Notes:", 12, yPos)
      doc.setFont("helvetica", "normal")
      doc.text(prescription.notes, 30, yPos)
      yPos += 6
    }
    
    // Footer
    yPos = doc.internal.pageSize.getHeight() - 25
    doc.setLineWidth(0.3)
    doc.line(10, yPos, pageWidth - 10, yPos)
    yPos += 5
    
    doc.setFontSize(8)
    doc.text("Physician:", 10, yPos)
    if (prescription.signature) {
      try {
        doc.addImage(prescription.signature, "PNG", 35, yPos - 5, 35, 8)
      } catch (error) {
        doc.setLineWidth(0.3)
        doc.line(35, yPos - 1, 70, yPos - 1)
      }
    } else {
      doc.setLineWidth(0.3)
      doc.line(35, yPos - 1, 70, yPos - 1)
    }
    
    yPos += 5
    const licenseText = doctorInfo.licenseNumber?.toLowerCase().startsWith("prc")
      ? doctorInfo.licenseNumber.replace(/^prc-?/i, "PRC-")
      : `PRC-${doctorInfo.licenseNumber || ""}`
    doc.text(`License: ${licenseText}`, 10, yPos)
    doc.setFontSize(7)
    doc.setTextColor(128, 128, 128)
    doc.text("e prescription", pageWidth - 25, yPos)
  }

  return doc
}

// Function to save prescription template
export const savePrescriptionTemplate = async (templateData, userId) => {
  try {
    // In a real app, this would save to a database
    console.log("Saving template:", templateData)
    // Mock successful save
    return {
      success: true,
      templateId: `template_${Date.now()}`,
      message: "Template saved successfully",
    }
  } catch (error) {
    console.error("Error saving template:", error)
    return {
      success: false,
      message: "Failed to save template",
    }
  }
}
