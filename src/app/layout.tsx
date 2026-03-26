import { getTenant } from "@/lib/tenant"
import ClientLayout from "./ClientLayout"
import "./globals.css"
import "@fontsource/poppins/400.css"
import "@fontsource/poppins/500.css"
import "@fontsource/poppins/600.css"
import "@fontsource/poppins/700.css"

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const tenant = await getTenant()

  return (
    <html lang="en">
      <head>
        <title>{tenant?.user?.name ? tenant.user.name : "Duprun"}</title>
      </head>
      <body style={{ fontFamily: "'Poppins', sans-serif" }}>
        <ClientLayout>
          {children}
        </ClientLayout>
      </body>
    </html>
  )
}