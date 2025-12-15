export default function Loading() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Orange Banner Skeleton */}
      <div className="relative overflow-hidden bg-gradient-to-r from-soft-amber to-amber-600 px-6 py-8 text-white shadow-md">
        <div className="container mx-auto">
          <div className="h-8 w-64 animate-pulse rounded-md bg-white/20"></div>
          <div className="mt-2 h-4 w-96 animate-pulse rounded-md bg-white/20"></div>

          {/* Decorative elements */}
          <div className="absolute -right-12 -top-12 h-40 w-40 rounded-full bg-white opacity-10"></div>
          <div className="absolute -bottom-8 right-20 h-24 w-24 rounded-full bg-white opacity-10"></div>
          <div className="absolute bottom-4 right-40 h-12 w-12 rounded-full bg-white opacity-10"></div>
        </div>
      </div>

      <div className="container mx-auto flex-1 px-4 py-8">
        {/* Stats summary skeletons */}
        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="flex items-center rounded-lg bg-white p-4 shadow-md">
              <div className="mr-4 h-12 w-12 animate-pulse rounded-full bg-gray-200"></div>
              <div className="flex-1">
                <div className="mb-2 h-3 w-20 animate-pulse rounded bg-gray-200"></div>
                <div className="h-6 w-12 animate-pulse rounded bg-gray-200"></div>
              </div>
            </div>
          ))}
        </div>

        {/* Records grid skeletons */}
        <div className="mb-6 flex items-center justify-between">
          <div className="h-6 w-40 animate-pulse rounded bg-gray-200"></div>
          <div className="flex space-x-2">
            <div className="h-10 w-32 animate-pulse rounded-md bg-gray-200"></div>
            <div className="h-10 w-32 animate-pulse rounded-md bg-gray-200"></div>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="overflow-hidden rounded-lg bg-white shadow-md">
              <div className="border-b border-gray-100 p-4">
                <div className="mb-2 flex items-center justify-between">
                  <div className="h-5 w-32 animate-pulse rounded bg-gray-200"></div>
                  <div className="h-5 w-16 animate-pulse rounded-full bg-gray-200"></div>
                </div>
                <div className="flex items-center">
                  <div className="mr-4 h-4 w-24 animate-pulse rounded bg-gray-200"></div>
                  <div className="h-4 w-24 animate-pulse rounded bg-gray-200"></div>
                </div>
              </div>

              <div className="p-4">
                <div className="mb-4 h-40 w-full animate-pulse rounded-md bg-gray-200"></div>
                <div className="flex space-x-2">
                  <div className="h-10 w-full animate-pulse rounded-md bg-gray-200"></div>
                  <div className="h-10 w-full animate-pulse rounded-md bg-gray-200"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
