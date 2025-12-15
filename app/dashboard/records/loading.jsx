"use client"

import { Skeleton } from "@/components/ui/skeleton"
import { useEffect, useState } from "react"

export default function RecordsLoading() {
  const [viewMode, setViewMode] = useState("grid")

  useEffect(() => {
    // Check localStorage for viewMode preference
    if (typeof window !== "undefined") {
      const savedViewMode = localStorage.getItem("records_viewMode")
      if (savedViewMode === "list" || savedViewMode === "grid") {
        setViewMode(savedViewMode)
      }
    }
  }, [])

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-soft-amber to-orange-500 rounded-lg p-6">
        <Skeleton className="h-8 w-64 mb-2 bg-white/20" />
        <Skeleton className="h-4 w-96 bg-white/20" />
      </div>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-10 w-40 rounded-md" />
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-pale-stone">
        {[1, 2].map((i) => (
          <Skeleton key={i} className="h-10 w-24 mb-2" />
        ))}
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col md:flex-row gap-4">
        <Skeleton className="h-10 flex-1 rounded-md" />
        <Skeleton className="h-10 w-32 rounded-md" />
        <Skeleton className="h-10 w-24 rounded-md" />
      </div>

      {/* View Mode Toggle */}
      <div className="flex items-center justify-end gap-2">
        <Skeleton className="h-10 w-10 rounded-md" />
        <Skeleton className="h-10 w-10 rounded-md" />
      </div>

      {/* Records - Grid or List View */}
      {viewMode === "grid" ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="group relative overflow-hidden rounded-2xl border border-amber-200/50 bg-gradient-to-br from-white to-amber-50/30 shadow-lg">
              <div className="h-2 w-full bg-gradient-to-r from-soft-amber via-amber-500 to-soft-amber" />
              <div className="aspect-[4/3] overflow-hidden bg-gradient-to-br from-pale-stone to-amber-50/50">
                <Skeleton className="h-full w-full" />
              </div>
              <div className="p-5">
                <div className="mb-3">
                  <Skeleton className="h-5 w-32 mb-2" />
                  <div className="flex items-center gap-2 flex-wrap">
                    <Skeleton className="h-5 w-20 rounded-full" />
                    <Skeleton className="h-4 w-16" />
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <Skeleton className="h-8 w-24 rounded-lg" />
                  <Skeleton className="h-8 w-20 rounded-lg" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-3 sm:space-y-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="rounded-lg sm:rounded-2xl border-l-4 border-soft-amber border border-amber-200/30 sm:border-amber-200/50 bg-white sm:bg-gradient-to-br sm:from-white sm:to-amber-50/30 p-3 sm:p-6 shadow-sm sm:shadow-lg">
              <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
                <Skeleton className="h-16 w-16 sm:h-20 sm:w-20 rounded-lg sm:rounded-xl flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center flex-wrap gap-1.5 sm:gap-2 mb-1 sm:mb-2">
                    <Skeleton className="h-4 sm:h-5 w-40" />
                    <Skeleton className="h-5 w-20 rounded-full" />
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5 sm:gap-3">
                    <Skeleton className="h-8 w-24 rounded-md sm:rounded-lg" />
                    <Skeleton className="h-8 w-20 rounded-md sm:rounded-lg hidden sm:block" />
                  </div>
                </div>
                <div className="flex gap-2 sm:gap-3">
                  <Skeleton className="h-9 w-9 rounded-full" />
                  <Skeleton className="h-9 w-9 rounded-full" />
                  <Skeleton className="h-9 w-9 rounded-full" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      <div className="flex justify-center items-center gap-2">
        <Skeleton className="h-10 w-10 rounded-md" />
        <Skeleton className="h-6 w-24" />
        <Skeleton className="h-10 w-10 rounded-md" />
      </div>
    </div>
  )
}
