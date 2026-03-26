import NextAuth from "next-auth"
import { getAuthOptions } from "@/lib/authOptions"
import { getTenant } from "@/lib/tenant"
import { NextRequest } from "next/server"
import { headers } from "next/headers"

const handler = async (req: NextRequest) => {
  const headersList = await headers()
  const host = headersList.get("host") || ""
  const protocol = process.env.NODE_ENV === "production" ? "https" : "http"
  
  // domain ke hisaab se NEXTAUTH_URL dynamically set karo
  process.env.NEXTAUTH_URL = `${protocol}://${host}`

  const tenant = await getTenant()
  const authOptions = getAuthOptions(tenant ?? undefined)
  return NextAuth(authOptions)(req as any)
}

export { handler as GET, handler as POST }