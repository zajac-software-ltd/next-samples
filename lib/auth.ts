import { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { PrismaAdapter } from "@next-auth/prisma-adapter"
import { prisma } from "./prisma"
import { verifyPassword } from "./auth-utils"

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        const user = await prisma.user.findUnique({
          where: {
            email: credentials.email
          }
        })

        if (!user || !user.password) {
          return null
        }

        const isPasswordValid = await verifyPassword(
          credentials.password,
          user.password
        )

        if (!isPasswordValid) {
          return null
        }

        return {
          id: user.id.toString(),
          email: user.email,
          name: user.name,
          role: user.role,
        }
      }
    })
  ],
  session: {
    strategy: "jwt",
  },
  // Disable NextAuth redirects - handle them manually
  events: {
    async signIn(message) {
      console.log('NextAuth signIn event:', message)
    },
    async signOut(message) {
      console.log('NextAuth signOut event:', message)
    },
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user && 'role' in user) {
        token.role = user.role
      }
      
      // Handle temporary sessions (from token links)
      if (token.isTempSession) {
        // Check if temp session has expired
        const now = Math.floor(Date.now() / 1000);
        if (token.exp && typeof token.exp === 'number' && token.exp < now) {
          // Return a token that will cause logout
          return { ...token, exp: 0 };
        }
      }
      
      return token
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.sub!
        session.user.role = token.role
        session.user.isTempSession = token.isTempSession || false
      }
      return session
    },
    async redirect({ url, baseUrl }) {
      // Only allow redirects within our domain and to specific auth pages
      // This prevents unwanted automatic redirects by NextAuth
      if (url.startsWith("/")) return `${baseUrl}${url}`
      if (new URL(url).origin === baseUrl) return url
      return baseUrl
    },
  },
  pages: {
    signIn: "/auth/signin",
  },
}
