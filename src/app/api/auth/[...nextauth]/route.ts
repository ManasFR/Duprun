import NextAuth, { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { prisma } from "@/lib/prisma"; // ✅ Use shared Prisma instance
import crypto from "crypto";

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,
  pages: {
    signIn: "/",
    error: "/",
  },
  callbacks: {
    // ✅ Create user if not exists
    async signIn({ user }) {
      if (!user.email) return false;

      const existingUser = await prisma.user.findUnique({
        where: { email: user.email },
      });

      if (!existingUser) {
        await prisma.user.create({
          data: {
            id: crypto.randomUUID(),
            name: user.name ?? null,
            email: user.email,
            image: user.image ?? null,
            plan_id: 0,
            updatedAt: new Date(),
          },
        });
      }

      return true;
    },

    // ✅ Handle redirect
    async redirect({ url, baseUrl }) {
      if (url.startsWith("/dashboard/duprun")) return `${baseUrl}${url}`;
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      if (new URL(url).origin === baseUrl) return url;
      return `${baseUrl}/dashboard/duprun`;
    },

    // ✅ Attach planId and userId in JWT
    async jwt({ token, user }) {
      if (user?.email) {
        const dbUser = await prisma.user.findUnique({
          where: { email: user.email },
          select: { plan_id: true, id: true },
        });

        if (dbUser) {
          token.planId = dbUser.plan_id;
          token.userId = dbUser.id;
        }
      }
      return token;
    },

    // ✅ Attach planId and id to session
    async session({ session, token }) {
      if (session.user) {
        session.user.planId = token.planId as number;
        session.user.id = token.userId as string;
      }
      return session;
    },
  },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
