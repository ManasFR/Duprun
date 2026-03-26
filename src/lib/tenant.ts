import { prisma } from "@/lib/prisma"
import { headers } from "next/headers"

export async function getTenant() {
  const headersList = await headers()
  const domain = headersList.get("x-tenant-domain") || ""

  // ignore localhost and your own main domain
  const isMainDomain =
    domain.includes("localhost") ||
    domain.includes("vercel.app") ||
    domain.includes("yourdomain.com") // ← replace with your actual domain

  if (isMainDomain) return null

  const tenant = await prisma.custom_domain.findUnique({
    where: { domain },
    include: { user: true },
  })

  return tenant ?? null
}