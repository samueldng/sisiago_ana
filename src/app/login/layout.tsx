import type { Metadata, Viewport } from "next"

export const metadata: Metadata = {
  title: "Login - SISIAGO",
  description: "Acesse o Sistema Integrado de Gestão",
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}