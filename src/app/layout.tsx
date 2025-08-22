import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { AuthProvider } from "@/contexts/AuthContext"
import { QueryProvider } from "@/providers/QueryProvider"
import { Toaster } from "react-hot-toast"
// import { NetworkAlert } from "@/components/NetworkMonitor"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "SISIAGO",
  description: "Sistema Integrado de Gestão",
}

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR">
      <body className={inter.className}>
        <QueryProvider>
          <AuthProvider>
            {/* <NetworkAlert /> */}
            {children}
            <Toaster position="top-right" />
          </AuthProvider>
        </QueryProvider>
      </body>
    </html>
  )
}