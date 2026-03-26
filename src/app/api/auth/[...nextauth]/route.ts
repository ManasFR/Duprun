import NextAuth from "next-auth"
import { getAuthOptions } from "@/lib/authOptions"
import { getTenant } from "@/lib/tenant"

const handler = async (req: Request, ctx: { params: Record<string, string> }) => {
  const tenant = await getTenant()
  const authOptions = getAuthOptions(tenant ?? undefined)  // ← bas ye change
  return NextAuth(authOptions)(req, ctx)
}

export { handler as GET, handler as POST }