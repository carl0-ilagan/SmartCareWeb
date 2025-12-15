import { Skeleton } from "@/components/ui/skeleton"

export default function DoctorProfileLoading() {
  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Back Button */}
      <Skeleton className="h-6 w-24" />

      {/* Doctor Profile Header */}
      <div className="bg-white rounded-lg shadow-sm border border-pale-stone p-6">
        <div className="flex flex-col md:flex-row md:items-center">
          <div className="flex-shrink-0 mb-4 md:mb-0 md:mr-6">
            <Skeleton className="h-24 w-24 md:h-32 md:w-32 rounded-full" />
          </div>

          <div className="flex-grow">
            <Skeleton className="h-8 w-48 mb-2" />
            <Skeleton className="h-5 w-32 mb-3" />

            <div className="flex items-center mt-2 mb-4">
              <Skeleton className="h-5 w-5 mr-2" />
              <Skeleton className="h-5 w-24" />
            </div>

            <div className="flex flex-wrap gap-4 mt-4">
              <div className="flex items-center">
                <Skeleton className="h-5 w-5 mr-2" />
                <Skeleton className="h-5 w-32" />
              </div>
              <div className="flex items-center">
                <Skeleton className="h-5 w-5 mr-2" />
                <Skeleton className="h-5 w-32" />
              </div>
            </div>
          </div>

          <div className="mt-6 md:mt-0 flex flex-col space-y-3">
            <Skeleton className="h-10 w-40 rounded-md" />
            <Skeleton className="h-10 w-40 rounded-md" />
            <Skeleton className="h-10 w-40 rounded-md" />
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="border-b border-pale-stone">
        <nav className="flex space-x-8">
          <Skeleton className="h-10 w-16" />
          <Skeleton className="h-10 w-16" />
          <Skeleton className="h-10 w-16" />
        </nav>
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-lg shadow-sm border border-pale-stone p-6">
        <div className="space-y-6">
          <div>
            <Skeleton className="h-7 w-32 mb-3" />
            <Skeleton className="h-4 w-full mb-2" />
            <Skeleton className="h-4 w-full mb-2" />
            <Skeleton className="h-4 w-3/4" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i}>
                <Skeleton className="h-7 w-32 mb-3" />
                <div className="space-y-3">
                  <div className="flex items-start">
                    <Skeleton className="h-5 w-5 mr-3" />
                    <div className="flex-1">
                      <Skeleton className="h-5 w-48 mb-1" />
                      <Skeleton className="h-4 w-32" />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
