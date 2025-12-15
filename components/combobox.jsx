"use client"

import { useState, useRef, useEffect } from "react"
import { ChevronDown } from "lucide-react"

export function Combobox({
  options = [],
  value,
  onChange,
  placeholder = "Select or type...",
  required = false,
  id,
  className = "",
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [filteredOptions, setFilteredOptions] = useState(options)
  const [inputValue, setInputValue] = useState(value || "")
  const [highlightedIndex, setHighlightedIndex] = useState(-1)
  const containerRef = useRef(null)
  const inputRef = useRef(null)
  const dropdownRef = useRef(null)
  const optionsRef = useRef(options)

  // Update input value when external value changes
  useEffect(() => {
    setInputValue(value || "")
  }, [value])

  // Keep optionsRef in sync with options prop without including in dependency arrays
  useEffect(() => {
    optionsRef.current = options
  })

  // Filter options based on input - show all when dropdown opens, filter when typing
  // Note: We intentionally don't include options in deps to avoid dependency array size changes
  // Instead, we use a ref to track the latest options

  useEffect(() => {
    if (!isOpen) {
      // When closed, don't update filtered options (keep current state)
      return
    }
    
    // Use ref to get latest options without including in dependency array
    const currentOptions = Array.isArray(optionsRef.current) ? optionsRef.current : []
    
    if (inputValue.trim() === "") {
      // When dropdown is open with no input, show all options
      setFilteredOptions(currentOptions)
    } else {
      // Filter based on input when typing
      const filtered = currentOptions.filter((option) =>
        String(option).toLowerCase().includes(inputValue.toLowerCase())
      )
      setFilteredOptions(filtered)
    }
    setHighlightedIndex(-1)
  }, [inputValue, isOpen])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  // Handle input change
  const handleInputChange = (e) => {
    const newValue = e.target.value
    setInputValue(newValue)
    onChange(newValue)
    setIsOpen(true)
  }

  // Handle option select
  const handleSelectOption = (option) => {
    setInputValue(option)
    onChange(option)
    setIsOpen(false)
    inputRef.current?.blur()
  }

  // Handle input focus
  const handleFocus = (e) => {
    // When clicking on input, show all options
    const currentOptions = Array.isArray(optionsRef.current) ? optionsRef.current : []
    setFilteredOptions(currentOptions)
    setIsOpen(true)
    // Select all text when focusing on existing value
    if (inputValue) {
      e.target.select()
    }
  }

  // Handle button click - show all options
  const handleButtonClick = () => {
    if (!isOpen) {
      // When opening, show all options
      const currentOptions = Array.isArray(optionsRef.current) ? optionsRef.current : []
      setFilteredOptions(currentOptions)
    }
    setIsOpen(!isOpen)
  }

  // Handle key navigation
  const handleKeyDown = (e) => {
    if (!isOpen && (e.key === "ArrowDown" || e.key === "Enter")) {
      setIsOpen(true)
      return
    }

    if (e.key === "ArrowDown") {
      e.preventDefault()
      setHighlightedIndex((prev) =>
        prev < filteredOptions.length - 1 ? prev + 1 : prev
      )
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : -1))
    } else if (e.key === "Enter" && highlightedIndex >= 0) {
      e.preventDefault()
      handleSelectOption(filteredOptions[highlightedIndex])
    } else if (e.key === "Escape") {
      setIsOpen(false)
      inputRef.current?.blur()
    }
  }

  // Scroll highlighted option into view
  useEffect(() => {
    if (highlightedIndex >= 0 && dropdownRef.current) {
      const optionElement = dropdownRef.current.children[highlightedIndex]
      if (optionElement) {
        optionElement.scrollIntoView({ block: "nearest" })
      }
    }
  }, [highlightedIndex])

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          id={id}
          value={inputValue}
          onChange={handleInputChange}
          onFocus={handleFocus}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          required={required}
          className={`${className} pr-10`}
        />
        <button
          type="button"
          onClick={handleButtonClick}
          className="absolute right-0 top-0 flex h-full items-center px-3 text-drift-gray hover:text-graphite focus:outline-none transition-colors"
          tabIndex={-1}
        >
          <ChevronDown
            className={`h-4 w-4 transition-transform duration-200 ${
              isOpen ? "rotate-180" : ""
            }`}
          />
        </button>
      </div>

      {/* Dropdown */}
      <div
        ref={dropdownRef}
        className={`absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-md border border-earth-beige bg-white shadow-lg transition-all duration-200 ease-out ${
          isOpen
            ? "opacity-100 translate-y-0 pointer-events-auto"
            : "opacity-0 -translate-y-2 pointer-events-none"
        }`}
      >
        {filteredOptions.length > 0 ? (
          <ul className="py-1">
            {filteredOptions.map((option, index) => (
              <li
                key={option}
                onClick={() => handleSelectOption(option)}
                className={`cursor-pointer px-3 py-2 text-sm text-graphite transition-all duration-150 ${
                  index === highlightedIndex
                    ? "bg-soft-amber/20 text-soft-amber font-medium"
                    : "hover:bg-pale-stone"
                }`}
                onMouseEnter={() => setHighlightedIndex(index)}
              >
                {option}
              </li>
            ))}
          </ul>
        ) : (
          <div className="px-3 py-2 text-sm text-drift-gray italic">
            No options found
          </div>
        )}
      </div>
    </div>
  )
}

