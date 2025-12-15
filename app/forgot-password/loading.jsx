export default function Loading() {
  return (
    <div className="min-h-screen flex flex-col bg-pale-stone">
      <div className="flex flex-1 items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center">
              <div className="h-10 w-32 bg-gray-200 rounded animate-pulse"></div>
            </div>
            <div className="h-4 w-48 mx-auto mt-2 bg-gray-200 rounded animate-pulse"></div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-8">
            <div className="flex items-center mb-6">
              <div className="h-5 w-5 mr-4 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-8 w-48 bg-gray-200 rounded animate-pulse"></div>
            </div>

            <div className="h-4 w-full bg-gray-200 rounded animate-pulse mb-6"></div>

            <div className="space-y-4">
              <div>
                <div className="h-4 w-24 bg-gray-200 rounded animate-pulse mb-1"></div>
                <div className="h-10 w-full bg-gray-200 rounded animate-pulse"></div>
              </div>

              <div className="h-10 w-full bg-gray-200 rounded animate-pulse"></div>
            </div>

            <div className="mt-6 text-center">
              <div className="h-4 w-48 mx-auto bg-gray-200 rounded animate-pulse"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
