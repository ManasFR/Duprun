import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const handler = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,
  pages: {
    signIn: '/',
    error: '/',
  },
  callbacks: {
    async signIn({ user, account, profile }) {
      // Check if user exists in DB
      const existingUser = await prisma.user.findUnique({
        where: { email: user.email },
      });

      if (!existingUser) {
        // Create new user with default plan_id 0
        await prisma.user.create({
          data: {
            name: user.name,
            email: user.email!,
            image: user.image,
            emailVerified: user.emailVerified,
            plan_id: 0, // Default value as integer
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        });
      }

      return true;
    },
    async redirect({ url, baseUrl }) {
      if (url.startsWith("/dashboard/duprun")) return `${baseUrl}${url}`;
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      if (new URL(url).origin === baseUrl) return url;
      return `${baseUrl}/dashboard/duprun`;
    },
    async jwt({ token, user }) {
      // Add user's plan_id to the token
      if (user) {
        const dbUser = await prisma.user.findUnique({
          where: { email: user.email! },
          select: { plan_id: true, id: true },
        });
        
        token.planId = dbUser?.plan_id;
        token.userId = dbUser?.id;
      }
      return token;
    },
    async session({ session, token }) {
      // Add plan_id to session
      if (session.user) {
        session.user.planId = token.planId as string;
        session.user.userId = token.userId as string;
      }
      return session;
    },
  },
});

export { handler as GET, handler as POST };