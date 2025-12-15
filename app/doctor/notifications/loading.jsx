export default function Loading() {
  return (
    <div className="container mx-auto px-4 py-8 pt-24 md:pt-28">
      <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between">
        <div className="h-8 w-48 bg-gray-200 rounded animate-pulse mb-4 md:mb-0"></div>
        <div className="flex space-x-3">
          <div className="h-10 w-32 bg-gray-200 rounded animate-pulse"></div>
          <div className="h-10 w-32 bg-gray-200 rounded animate-pulse"></div>
        </div>
      </div>

      <div className="mb-6 flex flex-col space-y-3 md:flex-row md:items-center md:space-y-0 md:space-x-4">
        <div className="h-10 w-full bg-gray-200 rounded animate-pulse"></div>
        <div className="flex space-x-3">
          <div className="h-10 w-32 bg-gray-200 rounded animate-pulse"></div>
          <div className="h-10 w-32 bg-gray-200 rounded animate-pulse"></div>
        </div>
      </div>

      <div className="space-y-4">
        {[...Array(5)].map((_, index) => (
          <div key={index} className="rounded-lg border border-pale-stone p-4 shadow-sm">
            <div className="flex items-start">
              <div className="mr-4 h-10 w-10 rounded-full bg-gray-200 animate-pulse"></div>
              <div className="flex-1">
                <div className="mb-2 h-4 w-3/4 bg-gray-200 rounded animate-pulse"></div>
                <div className="mb-2 h-4 w-full bg-gray-200 rounded animate-pulse"></div>
                <div className="h-3 w-1/4 bg-gray-200 rounded animate-pulse"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
