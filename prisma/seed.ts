import { PrismaClient, AdminRole, SessionStatus } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  // Seed super admin (PIN: 123456)
  const pinHash = await bcrypt.hash('123456', 10)
  await prisma.admin.upsert({
    where: { id: 'super-admin-seed' },
    update: {},
    create: {
      id: 'super-admin-seed',
      name: 'Chủ tịch',
      role: AdminRole.SUPER_ADMIN,
      pinHash,
    },
  })

  // Seed 1 session demo
  const session = await prisma.session.create({
    data: {
      title: 'Cầu lông T4 tuần này',
      date: new Date('2026-06-10'),
      startTime: new Date('1970-01-01T18:00:00'),
      endTime: new Date('1970-01-01T20:00:00'),
      location: 'Sân cầu lông Thăng Long, Q.1',
      isRecurring: false,
      status: SessionStatus.OPEN,
      createdBy: 'Chủ tịch',
      courts: {
        create: [
          { name: 'Sân A', maxSlots: 10, warnAt: 8 },
          { name: 'Sân B', maxSlots: 10, warnAt: 8 },
        ],
      },
    },
  })

  console.log('✅ Seed done. Session:', session.title)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
