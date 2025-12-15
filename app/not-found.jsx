"use client"

import { useRouter } from "next/navigation"
import { ArrowLeft, Lock } from "lucide-react"

export default function NotFound() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-gradient-to-br from-pale-stone via-white to-pale-stone flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-32 h-32 bg-soft-amber/5 rounded-full blur-3xl animate-pulse"></div>
        <div
          className="absolute bottom-20 right-10 w-40 h-40 bg-soft-amber/5 rounded-full blur-3xl animate-pulse"
          style={{ animationDelay: "1s" }}
        ></div>
        <div
          className="absolute top-1/2 left-1/2 w-96 h-96 bg-soft-amber/3 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 animate-pulse"
          style={{ animationDelay: "2s" }}
        ></div>
      </div>

      {/* Content */}
      <div className="relative z-10 text-center max-w-md">
        {/* Animated lock icon */}
        <div className="mb-8 flex justify-center">
          <div className="relative w-24 h-24">
            <div
              className="absolute inset-0 bg-soft-amber/20 rounded-full blur-xl"
              style={{
                animation: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
              }}
            ></div>
            <div className="absolute inset-0 flex items-center justify-center bg-white rounded-full shadow-lg">
              <Lock className="w-12 h-12 text-soft-amber animate-bounce" style={{ animationDuration: "2s" }} />
            </div>
          </div>
        </div>

        {/* Error code */}
        <div className="mb-6">
          <h1
            className="text-7xl md:text-8xl font-bold text-graphite mb-2"
            style={{
              animation: "fadeInDown 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) forwards",
            }}
          >
            404
          </h1>
          <div
            className="h-1 w-16 bg-gradient-to-r from-soft-amber to-orange-400 mx-auto rounded-full"
            style={{
              animation: "scaleX 0.6s ease-out 0.2s forwards",
              transformOrigin: "center",
            }}
          ></div>
        </div>

        {/* Headings */}
        <div className="mb-6">
          <h2
            className="text-3xl md:text-4xl font-bold text-graphite mb-3"
            style={{
              animation: "fadeInUp 0.8s ease-out 0.1s forwards",
              opacity: 0,
            }}
          >
            Access Denied
          </h2>
          <p
            className="text-lg text-drift-gray leading-relaxed"
            style={{
              animation: "fadeInUp 0.8s ease-out 0.2s forwards",
              opacity: 0,
            }}
          >
            This page is restricted or doesn&apos;t exist. Let&apos;s get you back on track.
          </p>
        </div>

        {/* Buttons */}
        <div
          className="flex flex-col sm:flex-row gap-4 justify-center mt-10"
          style={{
            animation: "fadeInUp 0.8s ease-out 0.3s forwards",
            opacity: 0,
          }}
        >
          <button
            onClick={() => router.back()}
            className="inline-flex items-center justify-center px-8 py-3 rounded-full border-2 border-soft-amber text-soft-amber font-semibold transition-all duration-300 hover:bg-soft-amber hover:text-white group"
          >
            <ArrowLeft className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform" />
            Go Back
          </button>
          <button
            onClick={() => router.push("/")}
            className="inline-flex items-center justify-center px-8 py-3 rounded-full bg-soft-amber text-white font-semibold transition-all duration-300 hover:bg-orange-400 shadow-lg hover:shadow-xl hover:scale-105"
          >
            Go to Home
          </button>
        </div>

        {/* Floating message */}
        <div
          className="mt-12 p-4 bg-white/70 backdrop-blur-sm rounded-2xl border border-soft-amber/20 shadow-sm"
          style={{
            animation: "float 3s ease-in-out infinite 0.5s",
          }}
        >
          <p className="text-sm text-drift-gray">If you think this is a mistake, please contact support.</p>
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeInDown {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes float {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-10px);
          }
        }

        @keyframes scaleX {
          from {
            transform: scaleX(0);
          }
          to {
            transform: scaleX(1);
          }
        }
      `}</style>
    </div>
  )
}


