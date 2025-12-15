export default function Loading() {
  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="h-8 w-48 animate-pulse rounded-md bg-pale-stone"></div>

      <div className="flex flex-col space-y-4 md:flex-row md:space-x-6 md:space-y-0">
        <div className="h-64 w-full animate-pulse rounded-lg bg-pale-stone md:w-1/3"></div>
        <div className="flex-1 space-y-4">
          <div className="h-6 w-3/4 animate-pulse rounded-md bg-pale-stone"></div>
          <div className="h-4 w-full animate-pulse rounded-md bg-pale-stone"></div>
          <div className="h-4 w-full animate-pulse rounded-md bg-pale-stone"></div>
          <div className="h-4 w-2/3 animate-pulse rounded-md bg-pale-stone"></div>
          <div className="h-4 w-full animate-pulse rounded-md bg-pale-stone"></div>
          <div className="h-4 w-5/6 animate-pulse rounded-md bg-pale-stone"></div>
        </div>
      </div>
    </div>
  )
}
