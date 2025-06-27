import { PrismaClient } from "@/generated/prisma"
import { hashPassword } from "@/lib/auth-utils"

const prisma = new PrismaClient()

async function main() {
  console.log("Seeding database...")
  const adminEmail = "admin@example.com"
  const adminPassword = "admin123"

  const existingAdmin = await prisma.user.findUnique({
    where: { email: adminEmail }
  })

  if (!existingAdmin) {
    const hashedPassword = await hashPassword(adminPassword)
    
    const admin = await prisma.user.create({
      data: {
        name: "Admin User",
        email: adminEmail,
        password: hashedPassword,
        role: "ADMIN",
        emailVerified: new Date(),
      },
    })

    console.log(`Created initial admin user: ${admin.email}`);
  } else {
    console.log(`Initial admin user already exists: ${existingAdmin.email}`)
  }
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
