export default function RolesLoading() {
  return (
    <div className="space-y-6">
      {/* Header skeleton */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="h-8 w-48 bg-pale-stone rounded-md animate-pulse"></div>
          <div className="h-4 w-64 bg-pale-stone rounded-md animate-pulse mt-2"></div>
        </div>
        <div className="h-10 w-32 bg-pale-stone rounded-md animate-pulse"></div>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        {/* Roles sidebar skeleton */}
        <div className="w-full md:w-64 bg-white rounded-lg shadow-sm p-4">
          <div className="h-6 w-32 bg-pale-stone rounded-md animate-pulse mb-3"></div>
          <div className="space-y-2">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-10 bg-pale-stone rounded-md animate-pulse"></div>
            ))}
          </div>
        </div>

        {/* Permissions content skeleton */}
        <div className="flex-1 bg-white rounded-lg shadow-sm p-6">
          <div className="flex justify-between items-center mb-6">
            <div className="h-6 w-48 bg-pale-stone rounded-md animate-pulse"></div>
            <div className="flex space-x-2">
              <div className="h-8 w-8 bg-pale-stone rounded-md animate-pulse"></div>
              <div className="h-8 w-8 bg-pale-stone rounded-md animate-pulse"></div>
            </div>
          </div>

          {/* Permissions sections skeleton */}
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="border border-earth-beige rounded-md overflow-hidden">
                <div className="w-full h-12 bg-pale-stone animate-pulse"></div>
                <div className="p-3">
                  {[1, 2, 3, 4, 5].map((j) => (
                    <div key={j} className="py-2 flex items-center justify-between">
                      <div className="h-5 w-48 bg-pale-stone rounded-md animate-pulse"></div>
                      <div className="h-5 w-5 bg-pale-stone rounded-full animate-pulse"></div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Save button skeleton */}
          <div className="mt-6 flex justify-end">
            <div className="h-10 w-32 bg-pale-stone rounded-md animate-pulse"></div>
          </div>
        </div>
      </div>
    </div>
  )
}
