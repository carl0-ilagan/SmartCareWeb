export default function PatientPrescriptionsLoading() {
  return (
    <div className="space-y-6">
      {/* Header with gradient background */}
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-soft-amber/90 to-amber-500 p-6 shadow-md">
        <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10"></div>
        <div className="absolute -bottom-8 -left-8 h-24 w-24 rounded-full bg-white/10"></div>

        <div className="relative z-10">
          <div className="h-8 w-24 animate-pulse rounded-md bg-white/20 mb-4"></div>

          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div className="flex items-center">
              <div className="mr-4 h-16 w-16 animate-pulse rounded-full bg-white/20"></div>
              <div>
                <div className="h-7 w-48 animate-pulse rounded-md bg-white/20 mb-2"></div>
                <div className="h-5 w-32 animate-pulse rounded-md bg-white/20"></div>
              </div>
            </div>
            <div className="mt-4 md:mt-0 h-10 w-36 animate-pulse rounded-md bg-white/20"></div>
          </div>
        </div>
      </div>

      {/* Search and filters skeleton */}
      <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
        <div className="h-10 w-full max-w-md animate-pulse rounded-md bg-pale-stone"></div>
        <div className="flex space-x-2">
          <div className="h-10 w-28 animate-pulse rounded-md bg-pale-stone"></div>
          <div className="h-10 w-28 animate-pulse rounded-md bg-pale-stone"></div>
        </div>
      </div>

      {/* Prescriptions list skeleton */}
      <div className="space-y-4">
        {[...Array(3)].map((_, index) => (
          <div key={index} className="rounded-lg border border-pale-stone bg-white p-4 shadow-sm">
            <div className="flex items-start">
              <div className="mr-4 h-10 w-10 animate-pulse rounded-full bg-pale-stone"></div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <div className="h-5 w-48 animate-pulse rounded-md bg-pale-stone mb-2"></div>
                  <div className="h-5 w-16 animate-pulse rounded-full bg-pale-stone"></div>
                </div>
                <div className="h-4 w-64 animate-pulse rounded-md bg-pale-stone mb-2"></div>
                <div className="mt-2 flex items-center">
                  <div className="h-4 w-32 animate-pulse rounded-md bg-pale-stone mr-3"></div>
                  <div className="h-4 w-32 animate-pulse rounded-md bg-pale-stone"></div>
                </div>
              </div>
            </div>
            <div className="mt-3 flex justify-end">
              <div className="h-6 w-32 animate-pulse rounded-md bg-pale-stone"></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
