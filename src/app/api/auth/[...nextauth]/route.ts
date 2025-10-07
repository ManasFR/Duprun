import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";

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
    async redirect({ url, baseUrl }) {
      // Agar URL /dashboard/duprun hai to use directly return karo
      if (url.startsWith("/dashboard/duprun")) return `${baseUrl}${url}`;
      // Agar url relative hai to baseUrl prepend karo
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      // Agar url same origin pe hai to use karo
      if (new URL(url).origin === baseUrl) return url;
      // Default: dashboard pe bhej do
      return `${baseUrl}/dashboard/duprun`;
    },
    async session({ session, token }) {
      return session;
    },
  },
});

export { handler as GET, handler as POST };