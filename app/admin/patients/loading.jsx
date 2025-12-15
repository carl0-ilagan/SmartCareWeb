export default function Loading() {
  return (
    <div className="animate-pulse w-full">
      {/* Banner placeholder */}
      <div className="h-40 bg-gray-200 rounded-xl mb-6"></div>

      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold bg-gray-200 h-8 w-48 rounded"></h1>
        <div className="bg-gray-200 h-10 w-32 rounded"></div>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-6 w-full">
        <div className="flex flex-col md:flex-row justify-between mb-6 gap-4">
          <div className="bg-gray-200 h-10 w-full md:w-64 rounded"></div>
          <div className="bg-gray-200 h-10 w-full md:w-48 rounded"></div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr>
                {[...Array(6)].map((_, i) => (
                  <th key={i} className="py-3 px-4 border-b border-earth-beige">
                    <div className="bg-gray-200 h-6 w-full rounded"></div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[...Array(5)].map((_, i) => (
                <tr key={i}>
                  {[...Array(6)].map((_, j) => (
                    <td key={j} className="py-4 px-4 border-b border-earth-beige">
                      <div className="bg-gray-200 h-6 w-full rounded"></div>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination placeholder */}
        <div className="flex justify-center mt-6">
          <div className="bg-gray-200 h-8 w-48 rounded"></div>
        </div>
      </div>
    </div>
  )
}
