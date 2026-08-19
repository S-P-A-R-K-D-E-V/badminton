import { Prisma, PrismaClient } from '@prisma/client'
import { generatePaymentCode } from '../src/lib/payment-qr'

const prisma = new PrismaClient()

async function main() {
  const rows = await prisma.paymentRequest.findMany({
    where: { code: null },
    select: { id: true },
  })

  if (rows.length === 0) {
    console.log('No rows need a code — safe to switch `code` back to required.')
    return
  }

  console.log(`Backfilling ${rows.length} row(s)...`)

  for (const row of rows) {
    // Retry on the rare chance a generated code collides with an existing one.
    for (let attempt = 0; attempt < 5; attempt++) {
      try {
        await prisma.paymentRequest.update({
          where: { id: row.id },
          data: { code: generatePaymentCode() },
        })
        break
      } catch (e) {
        const isCodeCollision = e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002'
        if (!isCodeCollision || attempt === 4) throw e
      }
    }
  }

  console.log(`✅ Backfilled ${rows.length} row(s). Now set \`code\` back to required in schema.prisma and run db:push again.`)
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
