"use server"

import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { revalidatePath } from "next/cache"
import { encrypt } from "@/lib/encryption"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"  // ← update this import

// ─── Save / update domain ──────────────────────────────────────
export async function saveDomain(domain: string) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return { error: "Not logged in" }

  const isValid = /^[a-zA-Z0-9][a-zA-Z0-9-_.]+\.[a-zA-Z]{2,}$/.test(domain)
  if (!isValid) return { error: "Invalid domain format" }

  try {
    await prisma.custom_domain.upsert({
      where:  { userId: session.user.id },
      update: { domain, status: "pending", vercelDomainId: null },
      create: { userId: session.user.id, domain, status: "pending" },
    })

    const res = await fetch(
      `https://api.vercel.com/v10/projects/${process.env.VERCEL_PROJECT_ID}/domains`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.VERCEL_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name: domain }),
      }
    )

    const data = await res.json()
    if (!res.ok) return { error: data?.error?.message || "Vercel error" }

    await prisma.custom_domain.update({
      where: { userId: session.user.id },
      data:  { vercelDomainId: data.name },
    })

    revalidatePath("/settings/domain")
    return { success: true }

  } catch (err) {
    return { error: "Something went wrong" }
  }
}

// ─── Check verification status ────────────────────────────────
export async function checkDomainStatus() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return { error: "Not logged in" }

  const record = await prisma.custom_domain.findUnique({
    where: { userId: session.user.id },
  })
  if (!record) return { error: "No domain found" }

  try {
    const res = await fetch(
      `https://api.vercel.com/v9/projects/${process.env.VERCEL_PROJECT_ID}/domains/${record.domain}`,
      {
        headers: { Authorization: `Bearer ${process.env.VERCEL_TOKEN}` },
      }
    )

    const data = await res.json()
    const status = data.verified ? "verified" : "pending"

    await prisma.custom_domain.update({
      where: { userId: session.user.id },
      data:  { status },
    })

    revalidatePath("/settings/domain")
    return { status, domain: record.domain }

  } catch (err) {
    return { error: "Could not check status" }
  }
}

// ─── Get domain for logged in user ────────────────────────────
export async function getDomain() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return null

  return prisma.custom_domain.findUnique({
    where: { userId: session.user.id },
  })
}

// ─── Delete domain ────────────────────────────────────────────
export async function deleteDomain() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return { error: "Not logged in" }

  const record = await prisma.custom_domain.findUnique({
    where: { userId: session.user.id },
  })
  if (!record) return { error: "No domain found" }

  try {
    await fetch(
      `https://api.vercel.com/v9/projects/${process.env.VERCEL_PROJECT_ID}/domains/${record.domain}`,
      {
        method: "DELETE",
        headers: { Authorization: `Bearer ${process.env.VERCEL_TOKEN}` },
      }
    )

    await prisma.custom_domain.delete({
      where: { userId: session.user.id },
    })

    revalidatePath("/settings/domain")
    return { success: true }

  } catch (err) {
    return { error: "Could not delete domain" }
  }
}


// ─── Save Google OAuth Keys ────────────────────────────────────
export async function saveGoogleKeys(clientId: string, clientSecret: string) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return { error: "Not logged in" }

  try {
    const encrypted_id     = encrypt(clientId)
    const encrypted_secret = encrypt(clientSecret)

    await prisma.custom_domain.update({
      where: { userId: session.user.id },
      data: {
        googleClientId:     encrypted_id,
        googleClientSecret: encrypted_secret,
      },
    })

    revalidatePath("/dashboard/white-label")
    return { success: true }

  } catch (err) {
    return { error: "Could not save keys" }
  }
}

// ─── Remove Google OAuth Keys ─────────────────────────────────
export async function removeGoogleKeys() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return { error: "Not logged in" }

  try {
    await prisma.custom_domain.update({
      where: { userId: session.user.id },
      data: {
        googleClientId:     null,
        googleClientSecret: null,
      },
    })

    revalidatePath("/dashboard/white-label")
    return { success: true }

  } catch (err) {
    return { error: "Could not remove keys" }
  }
}