export default function LogsLoading() {
  return (
    <div className="space-y-6">
      {/* Header skeleton */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="h-8 w-32 bg-pale-stone rounded-md animate-pulse"></div>
          <div className="h-4 w-64 bg-pale-stone rounded-md animate-pulse mt-2"></div>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-10 w-24 bg-pale-stone rounded-md animate-pulse"></div>
          <div className="h-10 w-24 bg-pale-stone rounded-md animate-pulse"></div>
          <div className="h-10 w-24 bg-pale-stone rounded-md animate-pulse"></div>
        </div>
      </div>

      {/* Search and filters skeleton */}
      <div className="bg-white rounded-lg shadow-sm p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 h-10 bg-pale-stone rounded-md animate-pulse"></div>
          <div className="flex gap-2">
            <div className="h-10 w-32 bg-pale-stone rounded-md animate-pulse"></div>
            <div className="h-10 w-32 bg-pale-stone rounded-md animate-pulse"></div>
          </div>
        </div>
      </div>

      {/* Logs table skeleton */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-earth-beige">
            <thead className="bg-pale-stone">
              <tr>
                {[1, 2, 3, 4, 5, 6, 7].map((i) => (
                  <th key={i} className="px-4 py-3">
                    <div className="h-4 w-full bg-white/50 rounded-md animate-pulse"></div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-earth-beige">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => (
                <tr key={i}>
                  {[1, 2, 3, 4, 5, 6, 7].map((j) => (
                    <td key={j} className="px-4 py-3">
                      <div className="h-4 w-full bg-pale-stone rounded-md animate-pulse"></div>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination skeleton */}
        <div className="px-4 py-3 flex items-center justify-between border-t border-earth-beige">
          <div className="h-4 w-48 bg-pale-stone rounded-md animate-pulse"></div>
          <div className="flex space-x-1">
            <div className="h-8 w-24 bg-pale-stone rounded-md animate-pulse"></div>
            <div className="h-8 w-24 bg-pale-stone rounded-md animate-pulse"></div>
          </div>
        </div>
      </div>
    </div>
  )
}
