"use client"

import { useState, useRef } from "react"
import { ChevronLeft, ChevronRight, Clock, AlertCircle } from "lucide-react"

export function MiniCalendar({
  patientAppointments = [],
  unavailableDates = [],
  doctorUnavailability = [],
  onDateClick = null,
}) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [tooltipInfo, setTooltipInfo] = useState(null)
  const tooltipRef = useRef(null)

  const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ]

  // Get days in month
  const getDaysInMonth = (year, month) => {
    return new Date(year, month + 1, 0).getDate()
  }

  // Get first day of month (0 = Sunday, 1 = Monday, etc.)
  const getFirstDayOfMonth = (year, month) => {
    return new Date(year, month, 1).getDay()
  }

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()
  const daysInMonth = getDaysInMonth(year, month)
  const firstDayOfMonth = getFirstDayOfMonth(year, month)

  // Generate calendar days
  const generateCalendarDays = () => {
    const days = []

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(null)
    }

    // Add days of the month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i)
    }

    return days
  }

  const calendarDays = generateCalendarDays()

  // Navigate to previous month
  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1))
  }

  // Navigate to next month
  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1))
  }

  // Format date string for comparison
  const formatDateString = (day) => {
    if (!day) return ""
    return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`
  }

  // Check if a day has an appointment
  const getAppointmentsForDay = (day) => {
    if (!day) return []

    const dateString = formatDateString(day)
    return patientAppointments.filter((apt) => apt.date === dateString)
  }

  // Check if a day is unavailable
  const isUnavailable = (day) => {
    if (!day) return false

    const dateString = formatDateString(day)
    return unavailableDates.includes(dateString)
  }

  // Get doctor unavailability info for a day
  const getDoctorUnavailabilityForDay = (day) => {
    if (!day) return []

    const dateString = formatDateString(day)
    const unavailabilityInfo = doctorUnavailability.find((item) => item.date === dateString)
    return unavailabilityInfo ? unavailabilityInfo.doctors : []
  }

  // Check if a date is in the past
  const isPastDate = (day) => {
    if (!day) return false

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const checkDate = new Date(year, month, day)
    return checkDate < today
  }

  // Handle day click
  const handleDayClick = (day) => {
    if (!day || !onDateClick || isPastDate(day)) return

    const dateString = formatDateString(day)
    onDateClick(dateString)
  }

  // Show tooltip with appointment info
  const showTooltip = (day, event) => {
    if (!day) return

    const dateString = formatDateString(day)
    const appointments = getAppointmentsForDay(day)
    const unavailableDoctors = getDoctorUnavailabilityForDay(day)

    if (appointments.length === 0 && unavailableDoctors.length === 0) return

    // Calculate position
    const rect = event.currentTarget.getBoundingClientRect()
    const top = rect.bottom + window.scrollY
    const left = rect.left + window.scrollX

    setTooltipInfo({
      appointments,
      unavailableDoctors,
      position: { top, left },
    })
  }

  // Hide tooltip
  const hideTooltip = () => {
    setTooltipInfo(null)
  }

  return (
    <div className="w-full">
      <div className="mb-4 flex items-center justify-between">
        <button
          onClick={prevMonth}
          className="rounded-md p-1 text-drift-gray hover:bg-pale-stone hover:text-soft-amber"
        >
          <ChevronLeft className="h-5 w-5" />
          <span className="sr-only">Previous month</span>
        </button>

        <h3 className="text-lg font-medium text-graphite">
          {monthNames[month]} {year}
        </h3>

        <button
          onClick={nextMonth}
          className="rounded-md p-1 text-drift-gray hover:bg-pale-stone hover:text-soft-amber"
        >
          <ChevronRight className="h-5 w-5" />
          <span className="sr-only">Next month</span>
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1">
        {/* Days of week headers */}
        {daysOfWeek.map((day) => (
          <div key={day} className="text-center text-xs font-medium text-drift-gray">
            {day}
          </div>
        ))}

        {/* Calendar days */}
        {calendarDays.map((day, index) => {
          const appointments = day ? getAppointmentsForDay(day) : []
          const hasAppointment = appointments.length > 0
          const isToday =
            day === new Date().getDate() && month === new Date().getMonth() && year === new Date().getFullYear()
          const unavailableDoctors = day ? getDoctorUnavailabilityForDay(day) : []
          const hasUnavailableDoctors = unavailableDoctors.length > 0
          const isPast = isPastDate(day)

          // Determine status colors
          const hasUpcoming =
            hasAppointment &&
            appointments.some(
              (apt) => apt.status === "approved" || apt.status === "confirmed" || apt.status === "pending",
            )
          const hasCompleted = hasAppointment && appointments.some((apt) => apt.status === "completed")
          const hasCancelled = hasAppointment && appointments.some((apt) => apt.status === "cancelled")

          return (
            <div
              key={index}
              className={`relative flex h-8 items-center justify-center rounded-md text-sm ${
                day === null
                  ? "invisible"
                  : isPast
                    ? "cursor-default opacity-60" // Past dates are visible but dimmed and not clickable
                    : "cursor-pointer" // Future dates are clickable
              } ${
                day === null
                  ? ""
                  : isToday
                    ? "bg-soft-amber font-medium text-white"
                    : isUnavailable(day) || hasUnavailableDoctors
                      ? "bg-red-100 font-medium text-red-500"
                      : hasUpcoming
                        ? "bg-pale-stone font-medium text-soft-amber"
                        : hasCompleted
                          ? "bg-green-100 font-medium text-green-600"
                          : hasCancelled
                            ? "bg-red-50 font-medium text-red-400"
                            : isPast
                              ? "text-drift-gray"
                              : "text-graphite hover:bg-pale-stone"
              }`}
              onClick={() => handleDayClick(day)}
              onMouseEnter={(e) => showTooltip(day, e)}
              onMouseLeave={hideTooltip}
            >
              {day !== null && day}
              {day !== null && hasAppointment && (
                <div className="absolute bottom-1 left-1/2 flex -translate-x-1/2 space-x-0.5">
                  {hasUpcoming && <span className="h-1 w-1 rounded-full bg-soft-amber"></span>}
                  {hasCompleted && <span className="h-1 w-1 rounded-full bg-green-500"></span>}
                  {hasCancelled && <span className="h-1 w-1 rounded-full bg-red-500"></span>}
                </div>
              )}
              {day !== null && hasUnavailableDoctors && (
                <span className="absolute top-1 right-1 h-1 w-1 rounded-full bg-red-500"></span>
              )}
            </div>
          )
        })}
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-xs">
        <div className="flex items-center">
          <div className="mr-2 h-3 w-3 rounded-full bg-soft-amber"></div>
          <span className="text-drift-gray">Today</span>
        </div>
        <div className="flex items-center">
          <div className="mr-2 h-3 w-3 rounded-full bg-pale-stone border border-soft-amber"></div>
          <span className="text-drift-gray">Upcoming</span>
        </div>
        <div className="flex items-center">
          <div className="mr-2 h-3 w-3 rounded-full bg-green-100 border border-green-500"></div>
          <span className="text-drift-gray">Completed</span>
        </div>
        <div className="flex items-center">
          <div className="mr-2 h-3 w-3 rounded-full bg-red-50 border border-red-400"></div>
          <span className="text-drift-gray">Cancelled</span>
        </div>
        <div className="flex items-center">
          <div className="mr-2 h-3 w-3 rounded-full bg-red-100 border border-red-500"></div>
          <span className="text-drift-gray">Unavailable</span>
        </div>
      </div>

      {/* Tooltip */}
      {tooltipInfo && (
        <div
          ref={tooltipRef}
          className="absolute z-50 bg-white rounded-md shadow-lg border border-pale-stone p-3 text-xs max-w-xs"
          style={{
            top: `${tooltipInfo.position.top}px`,
            left: `${tooltipInfo.position.left}px`,
          }}
        >
          {tooltipInfo.appointments.length > 0 && (
            <div className="mb-2">
              <h4 className="font-medium text-graphite mb-1">Appointments:</h4>
              <ul className="space-y-1">
                {tooltipInfo.appointments.map((apt, i) => (
                  <li key={i} className="flex items-start">
                    <div className="flex-shrink-0 mr-1">
                      {apt.status === "completed" ? (
                        <div className="h-2 w-2 mt-1 rounded-full bg-green-500"></div>
                      ) : apt.status === "cancelled" ? (
                        <div className="h-2 w-2 mt-1 rounded-full bg-red-500"></div>
                      ) : (
                        <div className="h-2 w-2 mt-1 rounded-full bg-soft-amber"></div>
                      )}
                    </div>
                    <div>
                      <div className="flex items-center">
                        <Clock className="h-3 w-3 mr-1 text-drift-gray" />
                        <span>{apt.time}</span>
                      </div>
                      <div className="text-drift-gray">{apt.otherPartyName}</div>
                      <div className="capitalize text-xs text-drift-gray">{apt.status}</div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {tooltipInfo.unavailableDoctors.length > 0 && (
            <div>
              <h4 className="font-medium text-graphite mb-1">Unavailable Doctors:</h4>
              <ul className="space-y-1">
                {tooltipInfo.unavailableDoctors.map((doctor, i) => (
                  <li key={i} className="flex items-center">
                    <AlertCircle className="h-3 w-3 mr-1 text-red-500" />
                    <span>{doctor.doctorName}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
