export default function Loading() {
  return (
    <div className="h-screen w-full">
      <div className="grid h-full w-full grid-cols-[350px_1fr]">
        {/* Conversations List Loading */}
        <div className="flex flex-col bg-white">
          <div className="border-b border-pale-stone p-3">
            <div className="h-10 w-full animate-pulse rounded-md bg-pale-stone"></div>
            <div className="mt-2 flex justify-between">
              <div className="h-4 w-16 animate-pulse rounded-md bg-pale-stone"></div>
              <div className="h-4 w-24 animate-pulse rounded-md bg-pale-stone"></div>
            </div>
          </div>

          <div className="flex-1 p-3">
            <div className="space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex items-start">
                  <div className="mr-3 h-10 w-10 animate-pulse rounded-full bg-pale-stone"></div>
                  <div className="flex-1">
                    <div className="flex justify-between">
                      <div className="h-4 w-24 animate-pulse rounded-md bg-pale-stone"></div>
                      <div className="h-4 w-12 animate-pulse rounded-md bg-pale-stone"></div>
                    </div>
                    <div className="mt-1 h-3 w-20 animate-pulse rounded-md bg-pale-stone"></div>
                    <div className="mt-1 h-3 w-full animate-pulse rounded-md bg-pale-stone"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Message Thread Loading */}
        <div className="hidden md:flex flex-col bg-white">
          <div className="flex items-center justify-between border-b border-pale-stone p-3">
            <div className="flex items-center">
              <div className="mr-3 h-10 w-10 animate-pulse rounded-full bg-pale-stone"></div>
              <div>
                <div className="h-5 w-32 animate-pulse rounded-md bg-pale-stone"></div>
                <div className="mt-1 h-3 w-24 animate-pulse rounded-md bg-pale-stone"></div>
              </div>
            </div>
            <div className="flex space-x-2">
              <div className="h-9 w-9 animate-pulse rounded-full bg-pale-stone"></div>
              <div className="h-9 w-9 animate-pulse rounded-full bg-pale-stone"></div>
              <div className="h-9 w-9 animate-pulse rounded-full bg-pale-stone"></div>
            </div>
          </div>

          <div className="flex-1 p-4">
            <div className="space-y-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className={`flex ${i % 2 === 0 ? "justify-end" : "justify-start"}`}>
                  {i % 2 !== 0 && <div className="mr-2 h-8 w-8 animate-pulse rounded-full bg-pale-stone"></div>}
                  <div
                    className={`h-16 w-3/4 animate-pulse rounded-lg ${
                      i % 2 === 0 ? "bg-soft-amber/30" : "bg-pale-stone"
                    }`}
                  ></div>
                </div>
              ))}
            </div>
          </div>

          <div className="border-t border-pale-stone p-3">
            <div className="flex items-center space-x-2">
              <div className="h-10 w-10 animate-pulse rounded-full bg-pale-stone"></div>
              <div className="h-10 flex-1 animate-pulse rounded-full bg-pale-stone"></div>
              <div className="h-10 w-10 animate-pulse rounded-full bg-pale-stone"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
