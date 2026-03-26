import { NextAuthOptions } from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import CredentialsProvider from "next-auth/providers/credentials"
import { prisma } from "@/lib/prisma"
import { decrypt } from "@/lib/encryption"
import crypto from "crypto"

export function getAuthOptions(tenant?: {
  googleClientId?: string | null
  googleClientSecret?: string | null
}): NextAuthOptions {

  const googleClientId =
    tenant?.googleClientId
      ? decrypt(tenant.googleClientId)
      : process.env.GOOGLE_CLIENT_ID!

  const googleClientSecret =
    tenant?.googleClientSecret
      ? decrypt(tenant.googleClientSecret)
      : process.env.GOOGLE_CLIENT_SECRET!

  return {
    providers: [
      GoogleProvider({
        clientId:     googleClientId,
        clientSecret: googleClientSecret,
      }),

      CredentialsProvider({
        id: "email-register",
        name: "Email Registration",
        credentials: {
          name:  { label: "Name",  type: "text" },
          email: { label: "Email", type: "email" },
        },
        async authorize(credentials) {
          if (!credentials?.email || !credentials?.name) {
            throw new Error("Name and email are required")
          }
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
          if (!emailRegex.test(credentials.email)) {
            throw new Error("Invalid email format")
          }
          if (credentials.name.trim().length < 2) {
            throw new Error("Name must be at least 2 characters")
          }
          const emailLower = credentials.email.toLowerCase()
          try {
            let user = await prisma.user.findUnique({
              where: { email: emailLower },
            })
            if (!user) {
              user = await prisma.user.create({
                data: {
                  id:            crypto.randomUUID(),
                  name:          credentials.name.trim(),
                  email:         emailLower,
                  image:         null,
                  emailVerified: null,
                  plan_id:       0,
                  createdAt:     new Date(),
                  updatedAt:     new Date(),
                },
              })
            }
            return { id: user.id, name: user.name, email: user.email, image: user.image }
          } catch (error) {
            throw new Error("Failed to register user")
          }
        },
      }),

      CredentialsProvider({
        id: "email-login",
        name: "Email Login",
        credentials: {
          email: { label: "Email", type: "email" },
        },
        async authorize(credentials) {
          if (!credentials?.email) throw new Error("Email is required")
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
          if (!emailRegex.test(credentials.email)) {
            throw new Error("Invalid email format")
          }
          const emailLower = credentials.email.toLowerCase()
          try {
            const user = await prisma.user.findUnique({
              where: { email: emailLower },
            })
            if (!user) {
              throw new Error("No account found with this email. Please sign up first.")
            }
            return { id: user.id, name: user.name, email: user.email, image: user.image }
          } catch (error) {
            if (error instanceof Error) throw error
            throw new Error("Failed to login")
          }
        },
      }),
    ],

    secret: process.env.NEXTAUTH_SECRET,

    pages: {
      signIn: "/",
      error:  "/",
    },

    callbacks: {
      async signIn({ user, account }) {
        if (!user.email) return false
        if (account?.provider === "google") {
          const existingUser = await prisma.user.findUnique({
            where: { email: user.email },
          })
          if (!existingUser) {
            await prisma.user.create({
              data: {
                id:            crypto.randomUUID(),
                name:          user.name ?? null,
                email:         user.email,
                image:         user.image ?? null,
                emailVerified: new Date(),
                plan_id:       0,
                createdAt:     new Date(),
                updatedAt:     new Date(),
              },
            })
          }
        }
        return true
      },

      async redirect({ url, baseUrl }) {
        // baseUrl ab dynamically current domain hoga
        if (url.startsWith("/")) return `${baseUrl}${url}`
        if (new URL(url).origin === baseUrl) return url
        return `${baseUrl}/dashboard/duprun`
      },

      async jwt({ token, user }) {
        if (user?.email) {
          const dbUser = await prisma.user.findUnique({
            where:  { email: user.email },
            select: { plan_id: true, id: true },
          })
          if (dbUser) {
            token.planId = dbUser.plan_id
            token.userId = dbUser.id
          }
        }
        return token
      },

      async session({ session, token }) {
        if (session.user) {
          session.user.planId = token.planId as number
          session.user.id     = token.userId as string
        }
        return session
      },
    },
  }
}

// default export — main domain ke liye
export const authOptions: NextAuthOptions = getAuthOptions()