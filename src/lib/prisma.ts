import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

function getDatabaseUrl(): string | undefined {
  if (process.env.NODE_ENV === 'production') {
    return process.env.DATABASE_URL_POOLING ?? process.env.DATABASE_URL
  }

  return process.env.DATABASE_URL ?? process.env.DATABASE_URL_POOLING
}

export function getPrismaClient(): PrismaClient {
  if (globalForPrisma.prisma) {
    return globalForPrisma.prisma
  }

  const url = getDatabaseUrl()
  if (!url) {
    throw new Error(
      'Missing database connection string. Set DATABASE_URL (and DATABASE_URL_POOLING for production).',
    )
  }

  const prisma = new PrismaClient({
    datasources: {
      db: { url },
    },
    log: process.env.NODE_ENV === 'development'
      ? ['query', 'error', 'warn']
      : ['error'],
  })

  if (process.env.NODE_ENV !== 'production') {
    globalForPrisma.prisma = prisma
  }

  return prisma
}
