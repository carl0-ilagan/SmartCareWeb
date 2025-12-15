"use client"

import { useState, useEffect } from "react"
import { FileText, Share2, Clock, UserPlus } from "lucide-react"

export default function NoRecordsAnimation() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    return () => setMounted(false)
  }, [])

  if (!mounted) return null

  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="relative h-48 w-48 mb-8">
        {/* Center file */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 transform">
          <div className="relative flex h-24 w-24 items-center justify-center rounded-lg bg-soft-amber/10 shadow-sm animate-pulse">
            <FileText className="h-12 w-12 text-soft-amber" />
          </div>
        </div>

        {/* Orbiting elements */}
        <div className="absolute left-1/2 top-1/2 h-40 w-40 -translate-x-1/2 -translate-y-1/2 transform rounded-full">
          <div
            className="absolute h-10 w-10 rounded-full bg-white shadow-md"
            style={{
              animation: "orbit 8s linear infinite",
              left: "calc(50% - 20px)",
              top: "-20px",
            }}
          >
            <div className="flex h-full w-full items-center justify-center">
              <Share2 className="h-5 w-5 text-soft-amber" />
            </div>
          </div>

          <div
            className="absolute h-10 w-10 rounded-full bg-white shadow-md"
            style={{
              animation: "orbit 8s linear infinite",
              animationDelay: "-2.6s",
              left: "calc(50% - 20px)",
              top: "-20px",
            }}
          >
            <div className="flex h-full w-full items-center justify-center">
              <Clock className="h-5 w-5 text-soft-amber" />
            </div>
          </div>

          <div
            className="absolute h-10 w-10 rounded-full bg-white shadow-md"
            style={{
              animation: "orbit 8s linear infinite",
              animationDelay: "-5.3s",
              left: "calc(50% - 20px)",
              top: "-20px",
            }}
          >
            <div className="flex h-full w-full items-center justify-center">
              <UserPlus className="h-5 w-5 text-soft-amber" />
            </div>
          </div>
        </div>

        {/* Floating documents */}
        <div
          className="absolute"
          style={{
            animation: "float 3s ease-in-out infinite",
            left: "10%",
            top: "20%",
          }}
        >
          <div className="h-8 w-8 rounded bg-white p-1 shadow-md">
            <FileText className="h-6 w-6 text-gray-300" />
          </div>
        </div>

        <div
          className="absolute"
          style={{
            animation: "float 4s ease-in-out infinite",
            animationDelay: "-1s",
            right: "15%",
            top: "15%",
          }}
        >
          <div className="h-10 w-10 rounded bg-white p-1 shadow-md">
            <FileText className="h-8 w-8 text-gray-300" />
          </div>
        </div>

        <div
          className="absolute"
          style={{
            animation: "float 3.5s ease-in-out infinite",
            animationDelay: "-2s",
            bottom: "20%",
            right: "10%",
          }}
        >
          <div className="h-9 w-9 rounded bg-white p-1 shadow-md">
            <FileText className="h-7 w-7 text-gray-300" />
          </div>
        </div>
      </div>

      <h2 className="text-2xl font-bold text-gray-800 mb-3">No Records Shared Yet</h2>
      <p className="text-gray-600 max-w-md mb-6">
        Your patients haven't shared any medical records with you yet. When they do, they'll appear here.
      </p>
      <div className="bg-soft-amber/10 rounded-lg p-4 max-w-md text-left">
        <h3 className="font-medium text-soft-amber mb-2 flex items-center">
          <Share2 className="h-4 w-4 mr-2" />
          How Records Are Shared
        </h3>
        <p className="text-sm text-gray-600">
          Patients can share their medical records with you from their dashboard. They'll select specific records and
          choose you as their healthcare provider.
        </p>
      </div>

      <style jsx global>{`
        @keyframes orbit {
          from {
            transform: rotate(0deg) translateX(80px) rotate(0deg);
          }
          to {
            transform: rotate(360deg) translateX(80px) rotate(-360deg);
          }
        }

        @keyframes float {
          0% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-10px);
          }
          100% {
            transform: translateY(0px);
          }
        }

        @keyframes pulse {
          0% {
            opacity: 0.6;
            transform: scale(0.98);
          }
          50% {
            opacity: 1;
            transform: scale(1);
          }
          100% {
            opacity: 0.6;
            transform: scale(0.98);
          }
        }

        .animate-pulse {
          animation: pulse 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  )
}
