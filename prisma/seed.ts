import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const username = process.env.SEED_ADMIN_USER ?? 'admin'
  const pin = process.env.SEED_ADMIN_PIN ?? '123456'

  const existing = await prisma.admin.findUnique({ where: { username } })
  if (existing) {
    console.log(`Admin "${username}" already exists, skipping.`)
    return
  }

  const pinHash = await bcrypt.hash(pin, 10)
  await prisma.admin.create({ data: { username, pinHash } })
  console.log(`✅ Admin "${username}" created with PIN "${pin}"`)
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
