import NextAuth, { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const authOptions: NextAuthOptions = {
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
    // Sign-in callback: create user if not exists
    async signIn({ user }) {
  if (!user.email) return false;

  const existingUser = await prisma.user.findUnique({
    where: { email: user.email },
  });

  if (!existingUser) {
    await prisma.user.create({
      data: {
        id: crypto.randomUUID(), // ← Add this
        name: user.name ?? null,
        email: user.email,
        image: user.image ?? null,
        plan_id: 0,
        updatedAt: new Date(), // ← Add this
      },
    });
  }

  return true;
},

    // Redirect callback
    async redirect({ url, baseUrl }) {
      if (url.startsWith('/dashboard/duprun')) return `${baseUrl}${url}`;
      if (url.startsWith('/')) return `${baseUrl}${url}`;
      if (new URL(url).origin === baseUrl) return url;
      return `${baseUrl}/dashboard/duprun`;
    },

    // JWT callback
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

    // Session callback
    async session({ session, token }) {
      if (session.user) {
        // Assign proper types
        session.user.planId = token.planId as number;
        session.user.id = token.userId as string; // Use 'id', not 'userId'
      }
      return session;
    },
  },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
