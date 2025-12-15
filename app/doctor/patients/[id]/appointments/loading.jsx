export default function PatientAppointmentsLoading() {
  return (
    <div className="space-y-6">
      {/* Header with gradient background */}
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-amber-500/90 to-amber-600 p-6 shadow-md">
        <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10"></div>
        <div className="absolute -bottom-8 -left-8 h-24 w-24 rounded-full bg-white/10"></div>

        <div className="relative z-10">
          <div className="mb-4 w-24 h-8 rounded-md bg-white/20 animate-pulse"></div>

          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div className="flex items-center">
              <div className="mr-4 h-16 w-16 animate-pulse rounded-full bg-white/20"></div>
              <div>
                <div className="h-8 w-48 animate-pulse rounded-md bg-white/20 mb-2"></div>
                <div className="h-5 w-64 animate-pulse rounded-md bg-white/20"></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Search and filters skeleton */}
      <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
        <div className="w-full max-w-md h-10 rounded-md bg-gray-200 animate-pulse"></div>
        <div className="w-28 h-10 rounded-md bg-gray-200 animate-pulse"></div>
      </div>

      {/* Content skeleton */}
      <div className="space-y-6">
        <div className="h-7 w-48 rounded-md bg-gray-200 animate-pulse"></div>

        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <div className="mb-3 sm:mb-0 space-y-2">
                  <div className="h-6 w-48 rounded-md bg-gray-200 animate-pulse"></div>
                  <div className="h-4 w-32 rounded-md bg-gray-200 animate-pulse"></div>
                </div>
                <div className="flex flex-wrap gap-3">
                  <div className="h-8 w-32 rounded-md bg-gray-200 animate-pulse"></div>
                  <div className="h-8 w-24 rounded-md bg-gray-200 animate-pulse"></div>
                </div>
              </div>
              <div className="mt-4 flex justify-end space-x-2">
                <div className="h-8 w-20 rounded-md bg-gray-200 animate-pulse"></div>
                <div className="h-8 w-20 rounded-md bg-gray-200 animate-pulse"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
