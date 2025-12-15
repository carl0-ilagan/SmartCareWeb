import { Skeleton } from "@/components/ui/skeleton"

export default function LandingPageLoading() {
  return (
    <div className="min-h-screen bg-pale-stone">
      {/* Navbar Skeleton */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-b border-earth-beige/30">
        <div className="container mx-auto px-4 sm:px-6 md:px-6">
          <div className="flex items-center justify-between h-16 sm:h-20">
            <Skeleton className="h-8 w-32" />
            <div className="hidden md:flex gap-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-9 w-20" />
              ))}
            </div>
            <div className="flex gap-2">
              <Skeleton className="h-9 w-20" />
              <Skeleton className="h-9 w-24" />
            </div>
          </div>
        </div>
      </div>

      {/* Hero Section Skeleton */}
      <section className="relative min-h-screen flex items-center bg-gradient-to-br from-pale-stone via-white to-amber-50/30 pt-24 pb-12 md:pt-28 md:pb-16">
        <div className="container px-4 sm:px-6 md:px-6 mx-auto">
          <div className="grid gap-6 sm:gap-8 lg:grid-cols-2 lg:gap-16 items-center">
            <div className="space-y-4">
              <Skeleton className="h-6 w-48 rounded-full" />
              <Skeleton className="h-12 sm:h-16 md:h-20 w-full max-w-2xl" />
              <Skeleton className="h-6 w-full max-w-xl" />
              <Skeleton className="h-6 w-3/4 max-w-lg" />
              <div className="flex flex-col gap-2.5 sm:gap-3 sm:flex-row pt-2">
                <Skeleton className="h-11 sm:h-12 w-full sm:w-auto px-8 rounded-lg" />
                <Skeleton className="h-11 sm:h-12 w-full sm:w-auto px-8 rounded-lg" />
              </div>
            </div>
            <div className="flex items-center justify-center">
              <Skeleton className="w-full max-w-lg h-64 sm:h-80 md:h-96 rounded-2xl" />
            </div>
          </div>
        </div>
      </section>

      {/* Features Section Skeleton */}
      <section className="relative py-12 sm:py-16 md:py-20 lg:py-28 bg-gradient-to-b from-white to-pale-stone/30">
        <div className="container px-4 md:px-6 mx-auto">
          <div className="mx-auto max-w-3xl text-center mb-16">
            <Skeleton className="h-6 w-24 rounded-full mx-auto mb-6" />
            <Skeleton className="h-10 sm:h-12 md:h-14 w-full max-w-2xl mx-auto mb-4" />
            <Skeleton className="h-6 w-full max-w-xl mx-auto" />
          </div>
          <div className="mx-auto grid max-w-5xl grid-cols-1 gap-4 sm:gap-6 md:gap-8 md:grid-cols-2">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="rounded-xl sm:rounded-2xl border border-earth-beige/50 bg-white/80 backdrop-blur-sm p-4 sm:p-6 md:p-8">
                <Skeleton className="h-12 w-12 rounded-lg mb-4" />
                <Skeleton className="h-6 w-3/4 mb-3" />
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-5/6" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section Skeleton */}
      <section className="relative py-12 sm:py-16 md:py-20 lg:py-28 bg-white">
        <div className="container px-4 md:px-6 mx-auto">
          <div className="mx-auto max-w-3xl text-center mb-16">
            <Skeleton className="h-6 w-32 rounded-full mx-auto mb-6" />
            <Skeleton className="h-10 sm:h-12 md:h-14 w-full max-w-2xl mx-auto mb-4" />
            <Skeleton className="h-6 w-full max-w-xl mx-auto" />
          </div>
          <div className="mx-auto mt-16 grid max-w-5xl grid-cols-1 gap-12 md:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="text-center">
                <Skeleton className="h-20 w-20 rounded-full mx-auto mb-6" />
                <Skeleton className="h-6 w-32 mx-auto mb-4" />
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-5/6 mx-auto" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section Skeleton */}
      <section className="relative py-12 sm:py-16 md:py-20 lg:py-28 bg-gradient-to-b from-pale-stone/30 to-white">
        <div className="container px-4 md:px-6 mx-auto">
          <div className="mx-auto max-w-3xl text-center mb-16">
            <Skeleton className="h-6 w-28 rounded-full mx-auto mb-6" />
            <Skeleton className="h-10 sm:h-12 md:h-14 w-full max-w-2xl mx-auto mb-4" />
            <Skeleton className="h-6 w-full max-w-xl mx-auto" />
          </div>
          <div className="mx-auto mt-16 grid max-w-5xl grid-cols-1 gap-8 md:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="rounded-2xl border border-earth-beige/50 bg-white p-6 shadow-sm">
                <div className="flex items-center gap-4 mb-4">
                  <Skeleton className="h-12 w-12 rounded-full" />
                  <div className="flex-1">
                    <Skeleton className="h-5 w-32 mb-2" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                </div>
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* For Doctors Section Skeleton */}
      <section className="relative py-12 sm:py-16 md:py-20 lg:py-28 bg-white">
        <div className="container px-4 md:px-6 mx-auto">
          <div className="mx-auto max-w-3xl text-center mb-16">
            <Skeleton className="h-6 w-32 rounded-full mx-auto mb-6" />
            <Skeleton className="h-10 sm:h-12 md:h-14 w-full max-w-2xl mx-auto mb-4" />
            <Skeleton className="h-6 w-full max-w-xl mx-auto" />
          </div>
          <div className="mx-auto max-w-4xl">
            <div className="grid gap-8 md:grid-cols-2">
              <Skeleton className="h-64 rounded-2xl" />
              <div className="space-y-4">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="flex gap-4">
                    <Skeleton className="h-12 w-12 rounded-lg flex-shrink-0" />
                    <div className="flex-1">
                      <Skeleton className="h-5 w-3/4 mb-2" />
                      <Skeleton className="h-4 w-full" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section Skeleton */}
      <section className="relative py-12 sm:py-16 md:py-20 lg:py-28 bg-gradient-to-br from-amber-500/10 via-white to-amber-50/30">
        <div className="container px-4 md:px-6 mx-auto">
          <div className="mx-auto max-w-3xl flex flex-col items-center justify-center gap-8 text-center p-12 rounded-3xl bg-white/60 backdrop-blur-sm border border-amber-500/20">
            <Skeleton className="h-10 sm:h-12 md:h-14 w-full max-w-2xl" />
            <Skeleton className="h-6 w-full max-w-xl" />
            <Skeleton className="h-11 sm:h-12 w-48 rounded-lg" />
          </div>
        </div>
      </section>

      {/* Contact Section Skeleton */}
      <section className="relative py-12 sm:py-16 md:py-20 lg:py-28 bg-gradient-to-b from-white to-pale-stone/30">
        <div className="container px-4 md:px-6 mx-auto">
          <div className="mx-auto max-w-3xl text-center mb-16">
            <Skeleton className="h-6 w-24 rounded-full mx-auto mb-6" />
            <Skeleton className="h-10 sm:h-12 md:h-14 w-full max-w-2xl mx-auto mb-4" />
            <Skeleton className="h-6 w-full max-w-xl mx-auto" />
          </div>
          <div className="mx-auto max-w-6xl grid gap-8 lg:grid-cols-3">
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="p-4 rounded-xl border border-earth-beige/30 bg-white">
                  <Skeleton className="h-10 w-10 rounded-lg mb-3" />
                  <Skeleton className="h-5 w-32 mb-2" />
                  <Skeleton className="h-4 w-full" />
                </div>
              ))}
            </div>
            <div className="lg:col-span-2">
              <div className="p-6 rounded-xl border border-earth-beige/30 bg-white space-y-4">
                <Skeleton className="h-10 w-full rounded-lg" />
                <Skeleton className="h-10 w-full rounded-lg" />
                <Skeleton className="h-10 w-full rounded-lg" />
                <Skeleton className="h-32 w-full rounded-lg" />
                <Skeleton className="h-11 w-32 rounded-lg" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer Skeleton */}
      <footer className="bg-white border-t border-earth-beige/30">
        <div className="container mx-auto px-4 sm:px-6 md:px-6 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="space-y-4">
                <Skeleton className="h-6 w-32" />
                <div className="space-y-2">
                  {[1, 2, 3, 4].map((j) => (
                    <Skeleton key={j} className="h-4 w-24" />
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div className="border-t border-earth-beige/30 pt-8">
            <Skeleton className="h-4 w-full max-w-2xl mx-auto" />
          </div>
        </div>
      </footer>
    </div>
  )
}
