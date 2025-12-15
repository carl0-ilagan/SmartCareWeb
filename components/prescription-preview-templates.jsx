"use client"

export function PrescriptionPreviewTemplate({ template, formData, doctorInfo, formatDate, isMobile = false, isModal = false }) {
  switch (template) {
    case "classic":
      return <ClassicTemplate formData={formData} doctorInfo={doctorInfo} formatDate={formatDate} isMobile={isMobile} isModal={isModal} />
    case "modern":
      return <ModernTemplate formData={formData} doctorInfo={doctorInfo} formatDate={formatDate} isMobile={isMobile} isModal={isModal} />
    case "compact":
      return <CompactTemplate formData={formData} doctorInfo={doctorInfo} formatDate={formatDate} isMobile={isMobile} isModal={isModal} />
    default:
      return <ClassicTemplate formData={formData} doctorInfo={doctorInfo} formatDate={formatDate} isMobile={isMobile} isModal={isModal} />
  }
}

// Classic Template - Traditional format
function ClassicTemplate({ formData, doctorInfo, formatDate, isMobile = false, isModal = false }) {
  return (
    <>
      {/* Watermark - Smart Care */}
      <div
        className="absolute inset-0 flex items-center justify-center pointer-events-none"
        style={{ zIndex: 0 }}
      >
        <div
          className="text-7xl font-bold"
          style={{
            transform: "rotate(-45deg)",
            fontFamily: "serif",
            color: "#d1d5db",
            opacity: 0.4,
          }}
        >
          Smart Care
        </div>
      </div>

      {/* Content */}
      <div className="relative z-10">
        {/* Header Section */}
        <div className="border-b-2 border-gray-300 pb-4 mb-4 text-center">
          {doctorInfo?.province && (
            <div className="text-sm text-gray-700 mb-1">Province of {doctorInfo.province}</div>
          )}
          {doctorInfo?.healthOffice && (
            <div className="text-sm text-gray-700 mb-1">{doctorInfo.healthOffice}</div>
          )}
          {(doctorInfo?.clinicAddress || doctorInfo?.hospitalName) && (
            <div className="text-sm text-gray-700 mb-1 font-medium">
              {doctorInfo?.clinicAddress || doctorInfo?.hospitalName}
            </div>
          )}
          {doctorInfo?.contactNumber && (
            <div className="text-sm text-gray-700 mb-1">Telephone No.: {doctorInfo.contactNumber}</div>
          )}
          {doctorInfo?.email && (
            <div className="text-sm text-gray-700">Email Address: {doctorInfo.email}</div>
          )}
        </div>

        {/* Patient Information Section */}
        <div className="mb-4">
          <div className="flex items-start justify-between">
            <div className="flex flex-1 min-w-0">
              <span className="text-sm text-gray-700 font-medium w-20 flex-shrink-0">Name:</span>
              <span className="text-sm text-gray-900 flex-1 border-b border-gray-300 pb-0.5 min-h-[18px]">
                {formData.patientName || "_______________________"}
              </span>
            </div>
            <div className="ml-4 flex items-center gap-2">
              <span className="text-sm text-gray-700 font-medium">Date:</span>
              <span className="text-sm text-gray-700">{formatDate(new Date())}</span>
            </div>
          </div>
          <div className="flex">
            <span className="text-sm text-gray-700 font-medium w-20">Address:</span>
            <span className="text-sm text-gray-900 flex-1 border-b border-gray-300 pb-0.5 min-h-[18px]">
              {formData.patientAddress || "_______________________"}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <span className="text-sm text-gray-700 font-medium w-12">Age:</span>
              <span className="text-sm text-gray-900 w-16 border-b border-gray-300 pb-0.5 min-h-[18px] text-center">
                {formData.patientAge || "____"}
              </span>
            </div>
            <div className="flex items-center">
              <span className="text-sm text-gray-700 font-medium w-12">Sex:</span>
              <span className="text-sm text-gray-900 w-20 border-b border-gray-300 pb-0.5 min-h-[18px]">
                {formData.patientGender || "____"}
              </span>
            </div>
          </div>
        </div>

        {/* Prescription Section */}
        <div className="relative flex">
          <div className="relative flex-shrink-0 mr-4">
            <span
              className="text-7xl font-normal text-soft-amber opacity-35"
              style={{
                fontFamily: "serif",
                fontStyle: "normal",
                letterSpacing: "-0.05em",
                lineHeight: "1",
                display: "inline-block",
                transform: "translateY(0.1em)",
                filter: "drop-shadow(1px 1px 2px rgba(0,0,0,0.1))",
              }}
            >
              ℞
            </span>
          </div>
          <div className="flex-1 min-h-[120px]">
            {formData.medications && formData.medications.length > 0 ? (
              <div>
                {formData.medications.map((med, index) => (
                  <div key={index} className="text-sm text-gray-900">
                    {med.instructions ? (
                      <div>
                        <div>{med.instructions}</div>
                        {med.name && (
                          <div className="ml-4">
                            {med.name} {med.dosage && `- ${med.dosage}`}
                            {med.frequency && `, ${med.frequency}`}
                            {med.duration && `, ${med.duration}`}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div>
                        {med.name && (
                          <div>
                            {med.name} {med.dosage && `- ${med.dosage}`}
                            {med.frequency && `, ${med.frequency}`}
                            {med.duration && `, ${med.duration}`}
                          </div>
                        )}
                        {med.instructions && (
                          <div className="ml-4 italic">({med.instructions})</div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-sm text-gray-400 italic">(No medications added yet)</div>
            )}
          </div>
        </div>

        {/* Additional Notes Section */}
        {formData.notes && (
          <div className="mt-6 pt-4 border-t border-gray-200">
            <div className="text-sm">
              <span className="font-medium text-gray-700">Notes: </span>
              <span className="text-gray-900">{formData.notes}</span>
            </div>
          </div>
        )}

        {/* Footer Section */}
        <div className="mt-6 pt-4 border-t-2 border-gray-300">
          <div className="flex justify-end">
            <div className="text-right">
              <div className="flex flex-col items-end w-full">
                <div className="flex items-end gap-3 mb-2 w-full">
                  <span className="text-sm text-gray-700 w-20 text-right flex-shrink-0">Physician:</span>
                  <div className="relative flex-1 min-w-0 overflow-visible" style={{ minHeight: isMobile ? "48px" : "32px" }}>
                    {formData.signature ? (
                      <div className="relative" style={{ display: "block" }}>
                        <div className="absolute bottom-0 left-0 right-0 border-b border-gray-400" style={{ zIndex: 1 }}></div>
                        <img
                          key={formData.signature}
                          src={formData.signature}
                          alt="Doctor's Signature"
                          className={`${isMobile ? "h-12" : "h-8"} w-auto relative`}
                          data-signature-blur="true"
                          style={{
                            imageRendering: "auto",
                            display: "block",
                            position: "relative",
                            zIndex: 2,
                            maxWidth: "none",
                            filter: "blur(8px)", // Blur signature in preview for security
                          }}
                          onLoad={(e) => {
                            const img = e.target
                            try {
                              const canvas = document.createElement("canvas")
                              const ctx = canvas.getContext("2d")
                              const width = img.naturalWidth || img.width || 500
                              const height = img.naturalHeight || img.height || 200

                              canvas.width = width
                              canvas.height = height

                              ctx.drawImage(img, 0, 0)
                              const imageData = ctx.getImageData(0, 0, width, height)
                              const data = imageData.data

                              for (let i = 0; i < data.length; i += 4) {
                                const r = data[i]
                                const g = data[i + 1]
                                const b = data[i + 2]
                                const avg = (r + g + b) / 3

                                if (avg > 200) {
                                  data[i + 3] = 0
                                } else if (avg > 180) {
                                  data[i + 3] = 0
                                } else if (avg > 160) {
                                  data[i + 3] = Math.floor((160 - avg) / 20 * 255)
                                }
                              }

                              ctx.putImageData(imageData, 0, 0)
                              ctx.imageSmoothingEnabled = true
                              ctx.imageSmoothingQuality = "high"
                              img.src = canvas.toDataURL("image/png")
                            } catch (error) {
                              console.error("Error processing signature:", error)
                            }
                          }}
                        />
                      </div>
                    ) : (
                      <div className="border-b border-gray-400 w-full h-7"></div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-700 w-20 text-right">License No.:</span>
                  <span className="border-b border-gray-300 pb-0.5 inline-block min-w-[200px] text-left">
                    {doctorInfo?.licenseNumber
                      ? doctorInfo.licenseNumber.toLowerCase().startsWith("prc")
                        ? doctorInfo.licenseNumber.replace(/^prc-?/i, "PRC-")
                        : `PRC-${doctorInfo.licenseNumber}`
                      : "_______________________"}
                  </span>
                </div>
              </div>
            </div>
          </div>
          <div className="mt-3 text-center">
            <span className="text-xs text-gray-500 italic">e prescription</span>
          </div>
        </div>
      </div>
    </>
  )
}

// Modern Template - Clean layout
function ModernTemplate({ formData, doctorInfo, formatDate, isMobile = false, isModal = false }) {
  // Compact styling for modal view
  const headerSpacing = isModal ? "pb-2 mb-2" : "pb-6 mb-6"
  const sectionSpacing = isModal ? "mb-2" : "mb-6"
  const patientSpacing = isModal ? "space-y-1.5" : "space-y-3"
  const medSpacing = isModal ? "space-y-1.5" : "space-y-3"
  const footerSpacing = isModal ? "mt-3 pt-3" : "mt-8 pt-6"
  const rxSize = isModal ? "text-2xl" : "text-5xl"
  const clinicTextSize = isModal ? "text-sm" : "text-xl"
  const sectionTitleSize = isModal ? "text-sm" : "text-lg"
  const labelTextSize = isModal ? "text-[10px]" : "text-xs"
  const valueTextSize = isModal ? "text-[10px]" : "text-sm"
  const notesPadding = isModal ? "p-1.5" : "p-3"
  
  return (
    <>
      {/* Watermark */}
      <div
        className="absolute inset-0 flex items-center justify-center pointer-events-none"
        style={{ zIndex: 0 }}
      >
        <div
          className={isModal ? "text-4xl" : "text-7xl"}
          style={{
            transform: "rotate(-45deg)",
            fontFamily: "serif",
            color: "#d1d5db",
            opacity: isModal ? 0.2 : 0.3,
            fontWeight: "bold",
          }}
        >
          Smart Care
        </div>
      </div>

      <div className="relative z-10">
        {/* Modern Header */}
        <div className={`border-b border-gray-200 ${headerSpacing}`}>
          <div className={`flex items-start ${isModal ? "gap-2" : "gap-4"}`}>
            <div className={`${rxSize} font-bold text-soft-amber opacity-50`}>℞</div>
            <div className="flex-1">
              <div className={`${clinicTextSize} font-bold text-gray-900 ${isModal ? "mb-0.5" : "mb-1"}`}>
                {doctorInfo?.clinicAddress || doctorInfo?.hospitalName || "Clinic Name"}
              </div>
              <div className={`${valueTextSize} text-gray-600 ${isModal ? "space-y-0.5" : "space-y-1"}`}>
                {doctorInfo?.contactNumber && <div>📞 {doctorInfo.contactNumber}</div>}
                {doctorInfo?.email && <div>✉️ {doctorInfo.email}</div>}
              </div>
            </div>
          </div>
        </div>

        {/* Patient Info - Modern Layout */}
        <div className={`${sectionSpacing} ${patientSpacing}`}>
          <div className="flex justify-between items-center">
            <div className="flex-1">
              <div className={`${labelTextSize} text-gray-500 ${isModal ? "mb-0.5" : "mb-1"}`}>Patient Name</div>
              <div className={`${valueTextSize} font-medium text-gray-900 border-b-2 border-gray-300 ${isModal ? "pb-0.5" : "pb-1"}`}>
                {formData.patientName || "_______________________"}
              </div>
            </div>
            <div className={isModal ? "ml-2" : "ml-4"}>
              <div className={`${labelTextSize} text-gray-500 ${isModal ? "mb-0.5" : "mb-1"}`}>Date</div>
              <div className={`${valueTextSize} text-gray-700`}>{formatDate(new Date())}</div>
            </div>
          </div>

          <div>
            <div className={`${labelTextSize} text-gray-500 ${isModal ? "mb-0.5" : "mb-1"}`}>Address</div>
            <div className={`${valueTextSize} text-gray-900 border-b-2 border-gray-300 ${isModal ? "pb-0.5" : "pb-1"}`}>
              {formData.patientAddress || "_______________________"}
            </div>
          </div>

          <div className={isModal ? "flex gap-3" : "flex gap-6"}>
            <div>
              <div className={`${labelTextSize} text-gray-500 ${isModal ? "mb-0.5" : "mb-1"}`}>Age</div>
              <div className={`${valueTextSize} font-medium text-gray-900 border-b-2 border-gray-300 ${isModal ? "pb-0.5 w-12" : "pb-1 w-16"}`}>
                {formData.patientAge || "____"}
              </div>
            </div>
            <div>
              <div className={`${labelTextSize} text-gray-500 ${isModal ? "mb-0.5" : "mb-1"}`}>Sex</div>
              <div className={`${valueTextSize} font-medium text-gray-900 border-b-2 border-gray-300 ${isModal ? "pb-0.5 w-16" : "pb-1 w-20"}`}>
                {formData.patientGender || "____"}
              </div>
            </div>
          </div>
        </div>

        {/* Medications */}
        <div className={sectionSpacing}>
          <div className={`${sectionTitleSize} font-semibold text-gray-900 ${isModal ? "mb-1.5" : "mb-3"}`}>Prescription</div>
          <div className={medSpacing}>
            {formData.medications && formData.medications.length > 0 ? (
              formData.medications.map((med, index) => (
                <div key={index} className={`border-l-4 border-soft-amber ${isModal ? "pl-2 py-0.5" : "pl-3 py-1"}`}>
                  <div className={`${isModal ? "text-[10px]" : "font-medium"} text-gray-900`}>
                    {med.name} {med.dosage && `(${med.dosage})`}
                  </div>
                  <div className={`${valueTextSize} text-gray-600`}>
                    {med.frequency && `${med.frequency}`}
                    {med.duration && ` • ${med.duration}`}
                  </div>
                  {med.instructions && (
                    <div className={`${valueTextSize} text-gray-500 italic ${isModal ? "mt-0.5" : "mt-1"}`}>{med.instructions}</div>
                  )}
                </div>
              ))
            ) : (
              <div className={`${valueTextSize} text-gray-400 italic`}>(No medications added yet)</div>
            )}
          </div>
        </div>

        {/* Notes */}
        {formData.notes && (
          <div className={`${sectionSpacing} ${notesPadding} bg-gray-50 rounded border-l-4 border-gray-300`}>
            <div className={`${labelTextSize} text-gray-500 ${isModal ? "mb-0.5" : "mb-1"}`}>Notes</div>
            <div className={valueTextSize + " text-gray-900"}>{formData.notes}</div>
          </div>
        )}

        {/* Footer */}
        <div className={`${footerSpacing} border-t-2 border-gray-300`}>
          <div className="flex justify-end">
            <div className="text-right">
              <div className={`flex flex-col items-end ${isModal ? "gap-1" : "gap-2"}`}>
                <div className={`flex items-end ${isModal ? "gap-2" : "gap-3"}`}>
                  <span className={valueTextSize + " text-gray-700"}>Physician:</span>
                  <div className="relative" style={{ minWidth: isModal ? "120px" : "200px", minHeight: isModal ? "24px" : (isMobile ? "48px" : "32px") }}>
                    {formData.signature ? (
                      <div className="relative">
                        <div className="absolute bottom-0 left-0 right-0 border-b border-gray-400" style={{ zIndex: 1 }}></div>
                        <img
                          src={formData.signature}
                          alt="Signature"
                          className={`${isModal ? "h-6" : (isMobile ? "h-12" : "h-8")} w-auto relative`}
                          data-signature-blur="true"
                          style={{ 
                            zIndex: 2, 
                            maxWidth: "none",
                            filter: "blur(8px)", // Blur signature in preview for security
                          }}
                          onLoad={(e) => {
                            const img = e.target
                            try {
                              const canvas = document.createElement("canvas")
                              const ctx = canvas.getContext("2d")
                              canvas.width = img.naturalWidth || 500
                              canvas.height = img.naturalHeight || 200
                              ctx.drawImage(img, 0, 0)
                              const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
                              const data = imageData.data
                              for (let i = 0; i < data.length; i += 4) {
                                const avg = (data[i] + data[i + 1] + data[i + 2]) / 3
                                if (avg > 200) data[i + 3] = 0
                                else if (avg > 160) data[i + 3] = Math.floor((160 - avg) / 20 * 255)
                              }
                              ctx.putImageData(imageData, 0, 0)
                              img.src = canvas.toDataURL("image/png")
                            } catch (error) {
                              console.error("Error processing signature:", error)
                            }
                          }}
                        />
                      </div>
                    ) : (
                      <div className={`border-b border-gray-400 w-full ${isModal ? "h-5" : "h-7"}`}></div>
                    )}
                  </div>
                </div>
                <div className={valueTextSize + " text-gray-700"}>
                  License No.:{" "}
                  {doctorInfo?.licenseNumber
                    ? doctorInfo.licenseNumber.toLowerCase().startsWith("prc")
                      ? doctorInfo.licenseNumber.replace(/^prc-?/i, "PRC-")
                      : `PRC-${doctorInfo.licenseNumber}`
                    : "_______________________"}
                </div>
              </div>
            </div>
          </div>
          <div className={isModal ? "mt-2 text-center" : "mt-4 text-center"}>
            <span className={labelTextSize + " text-gray-400 italic"}>e prescription</span>
          </div>
        </div>
      </div>
    </>
  )
}

// Compact Template - Space efficient
function CompactTemplate({ formData, doctorInfo, formatDate, isMobile = false, isModal = false }) {
  return (
    <>
      {/* Watermark */}
      <div
        className="absolute inset-0 flex items-center justify-center pointer-events-none"
        style={{ zIndex: 0 }}
      >
        <div
          className="text-6xl font-bold"
          style={{
            transform: "rotate(-45deg)",
            fontFamily: "serif",
            color: "#d1d5db",
            opacity: 0.25,
          }}
        >
          Smart Care
        </div>
      </div>

      <div className="relative z-10">
        {/* Compact Header */}
        <div className="border-b border-gray-200 pb-3 mb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-3xl text-soft-amber opacity-40">℞</span>
              <div>
                <div className="text-sm font-bold text-gray-900">
                  {doctorInfo?.clinicAddress || doctorInfo?.hospitalName || "Clinic"}
                </div>
                <div className="text-xs text-gray-600">
                  {doctorInfo?.contactNumber && doctorInfo.contactNumber}
                  {doctorInfo?.email && ` • ${doctorInfo.email}`}
                </div>
              </div>
            </div>
            <div className="text-xs text-gray-600">{formatDate(new Date())}</div>
          </div>
        </div>

        {/* Compact Patient Info */}
        <div className="mb-4 grid grid-cols-2 gap-3 text-xs">
          <div>
            <span className="text-gray-500">Name:</span>{" "}
            <span className="border-b border-gray-300 inline-block min-w-[120px]">
              {formData.patientName || "_______"}
            </span>
          </div>
          <div>
            <span className="text-gray-500">Age:</span>{" "}
            <span className="border-b border-gray-300 inline-block min-w-[40px]">
              {formData.patientAge || "____"}
            </span>
            <span className="text-gray-500 ml-3">Sex:</span>{" "}
            <span className="border-b border-gray-300 inline-block min-w-[50px]">
              {formData.patientGender || "____"}
            </span>
          </div>
          <div className="col-span-2">
            <span className="text-gray-500">Address:</span>{" "}
            <span className="border-b border-gray-300 inline-block flex-1">
              {formData.patientAddress || "_______________________"}
            </span>
          </div>
        </div>

        {/* Compact Medications */}
        <div className="mb-4">
          <div className="text-sm font-semibold text-gray-900 mb-2">Rx:</div>
          <div className="space-y-2 text-xs">
            {formData.medications && formData.medications.length > 0 ? (
              formData.medications.map((med, index) => (
                <div key={index} className="flex gap-2">
                  <span className="text-gray-500">{index + 1}.</span>
                  <div className="flex-1">
                    <span className="font-medium">{med.name}</span>
                    {med.dosage && <span className="text-gray-600"> {med.dosage}</span>}
                    {med.frequency && <span className="text-gray-600">, {med.frequency}</span>}
                    {med.duration && <span className="text-gray-600">, {med.duration}</span>}
                    {med.instructions && (
                      <div className="text-gray-500 italic ml-3">({med.instructions})</div>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-gray-400 italic">(No medications added yet)</div>
            )}
          </div>
        </div>

        {/* Compact Notes */}
        {formData.notes && (
          <div className="mb-3 text-xs p-2 bg-gray-50 rounded">
            <span className="font-medium text-gray-700">Notes:</span>{" "}
            <span className="text-gray-900">{formData.notes}</span>
          </div>
        )}

        {/* Compact Footer */}
        <div className="mt-4 pt-3 border-t border-gray-300">
          <div className="flex justify-between items-end text-xs">
            <div>
              <div className="flex items-end gap-2 mb-1">
                <span className="text-gray-700">Physician:</span>
                <div className="relative" style={{ minWidth: "150px" }}>
                  {formData.signature ? (
                    <div className="relative">
                      <div className="absolute bottom-0 left-0 right-0 border-b border-gray-400" style={{ zIndex: 1 }}></div>
                        <img
                        src={formData.signature}
                        alt="Signature"
                        className={`${isMobile ? "h-12" : "h-6"} w-auto relative`}
                        data-signature-blur="true"
                        style={{ 
                          zIndex: 2, 
                          maxWidth: "none",
                          filter: "blur(8px)", // Blur signature in preview for security
                        }}
                        onLoad={(e) => {
                          const img = e.target
                          try {
                            const canvas = document.createElement("canvas")
                            const ctx = canvas.getContext("2d")
                            canvas.width = img.naturalWidth || 500
                            canvas.height = img.naturalHeight || 200
                            ctx.drawImage(img, 0, 0)
                            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
                            const data = imageData.data
                            for (let i = 0; i < data.length; i += 4) {
                              const avg = (data[i] + data[i + 1] + data[i + 2]) / 3
                              if (avg > 200) data[i + 3] = 0
                              else if (avg > 160) data[i + 3] = Math.floor((160 - avg) / 20 * 255)
                            }
                            ctx.putImageData(imageData, 0, 0)
                            img.src = canvas.toDataURL("image/png")
                          } catch (error) {
                            console.error("Error processing signature:", error)
                          }
                        }}
                      />
                    </div>
                  ) : (
                    <div className="border-b border-gray-400 w-full h-6"></div>
                  )}
                </div>
              </div>
              <div className="text-gray-700">
                License:{" "}
                {doctorInfo?.licenseNumber
                  ? doctorInfo.licenseNumber.toLowerCase().startsWith("prc")
                    ? doctorInfo.licenseNumber.replace(/^prc-?/i, "PRC-")
                    : `PRC-${doctorInfo.licenseNumber}`
                  : "_______"}
              </div>
            </div>
            <div className="text-gray-400 italic text-xs">e prescription</div>
          </div>
        </div>
      </div>
    </>
  )
}

