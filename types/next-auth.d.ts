import { UserRole } from "@/generated/prisma"
import "next-auth"
import "next-auth/jwt"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      email: string
      name?: string | null
      image?: string | null
      role: UserRole
      isTempSession?: boolean
    }
  }

  interface User {
    role: UserRole
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role: UserRole
    isTempSession?: boolean
    exp?: number
  }
}
