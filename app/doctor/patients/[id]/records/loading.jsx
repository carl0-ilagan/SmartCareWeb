export default function Loading() {
  return (
    <div className="space-y-6">
      <div className="flex items-center">
        <div className="mr-4 h-8 w-8 animate-pulse rounded-md bg-pale-stone"></div>
        <div>
          <div className="h-8 w-64 animate-pulse rounded-md bg-pale-stone"></div>
          <div className="mt-2 h-5 w-40 animate-pulse rounded-md bg-pale-stone"></div>
        </div>
      </div>

      <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
        <div className="h-10 w-full max-w-md animate-pulse rounded-md bg-pale-stone"></div>
        <div className="h-10 w-32 animate-pulse rounded-md bg-pale-stone"></div>
      </div>

      <div className="h-16 w-full animate-pulse rounded-lg bg-pale-stone"></div>

      <div className="overflow-x-auto rounded-lg border border-pale-stone bg-white shadow-sm">
        <div className="h-10 w-full animate-pulse bg-pale-stone"></div>
        {[1, 2, 3, 4, 5].map((item) => (
          <div key={item} className="h-16 w-full animate-pulse border-b border-pale-stone bg-white"></div>
        ))}
      </div>
    </div>
  )
}
