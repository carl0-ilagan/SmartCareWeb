import { Manrope } from "next/font/google"
import "@/app/globals.css"
import { AuthProvider } from "@/contexts/auth-context"
import { PostLoginWelcome } from "@/components/post-login-welcome"
import { RegisterServiceWorker } from "@/app/register-sw"
import { DynamicFavicon } from "@/components/dynamic-favicon"


const manrope = Manrope({ 
  subsets: ["latin"],
  variable: "--font-manrope",
  display: "swap"
})

export const metadata = {
  title: "Smart Care - Your Health, One Click Away",
  description: "A modern telehealth platform for all your healthcare needs",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Smart Care",
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    type: "website",
    siteName: "Smart Care",
    title: "Smart Care - Your Health, One Click Away",
    description: "A modern telehealth platform for all your healthcare needs",
  },
}

export const viewport = {
  themeColor: "#f59e0b",
}

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning className={manrope.variable}>
      <head>
        <title>Smart care</title>
        <link rel="icon" href="/SmartCare.png?v=2" type="image/png" />
        <link rel="shortcut icon" href="/SmartCare.png?v=2" type="image/png" />
        <link rel="apple-touch-icon" href="/SmartCare.png?v=2" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#f59e0b" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Smart Care" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover" />
      </head>
      <body className="min-h-screen bg-pale-stone font-manrope antialiased">
        <RegisterServiceWorker />
        <DynamicFavicon />
        <AuthProvider>
          <PostLoginWelcome />
          {children}
        </AuthProvider>
      </body>
    </html>
  )
}
