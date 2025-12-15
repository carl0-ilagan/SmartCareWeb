import { Skeleton } from "@/components/ui/skeleton"

export default function ProfileLoading() {
  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div>
        <Skeleton className="h-8 w-48 mb-2" />
        <Skeleton className="h-4 w-64" />
      </div>

      {/* Profile Header Card */}
      <div className="bg-white rounded-lg border border-pale-stone p-6 shadow-sm">
        <div className="flex flex-col md:flex-row items-center gap-6">
          <Skeleton className="h-32 w-32 rounded-full" />
          <div className="flex-1 text-center md:text-left w-full">
            <Skeleton className="h-8 w-48 mx-auto md:mx-0 mb-2" />
            <Skeleton className="h-4 w-32 mx-auto md:mx-0 mb-4" />
            <div className="flex flex-col md:flex-row gap-2 md:gap-4">
              <Skeleton className="h-4 w-48 mx-auto md:mx-0" />
              <Skeleton className="h-4 w-32 mx-auto md:mx-0" />
              <Skeleton className="h-4 w-24 mx-auto md:mx-0" />
            </div>
          </div>
          <Skeleton className="h-10 w-24 rounded-md" />
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-earth-beige">
        <div className="flex space-x-4">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-8 w-24" />
          <Skeleton className="h-8 w-32" />
        </div>
      </div>

      {/* Content Sections */}
      <div className="bg-white rounded-lg border border-pale-stone p-6 shadow-sm">
        <div className="space-y-6">
          {/* Personal Information */}
          <div>
            <Skeleton className="h-6 w-48 mb-4" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i}>
                  <Skeleton className="h-4 w-24 mb-2" />
                  <Skeleton className="h-10 w-full rounded-md" />
                </div>
              ))}
            </div>
          </div>

          {/* Medical Information */}
          <div className="pt-6 border-t border-pale-stone">
            <Skeleton className="h-6 w-48 mb-4" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i}>
                  <Skeleton className="h-4 w-32 mb-2" />
                  <Skeleton className="h-10 w-full rounded-md" />
                </div>
              ))}
            </div>
          </div>

          {/* Emergency Contact */}
          <div className="pt-6 border-t border-pale-stone">
            <Skeleton className="h-6 w-48 mb-4" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i}>
                  <Skeleton className="h-4 w-32 mb-2" />
                  <Skeleton className="h-10 w-full rounded-md" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

