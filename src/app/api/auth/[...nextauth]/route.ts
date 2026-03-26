import NextAuth from "next-auth"
import { getAuthOptions } from "@/lib/authOptions"
import { getTenant } from "@/lib/tenant"
import { NextRequest } from "next/server"

const handler = async (req: NextRequest) => {
  const tenant = await getTenant()
  const authOptions = getAuthOptions(tenant ?? undefined)
  return NextAuth(authOptions)(req as any)
}

export { handler as GET, handler as POST }