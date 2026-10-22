import { NextRequest, NextResponse } from 'next/server'
import { getPrismaClient } from '@/lib/prisma'
import { newsletterSchema } from '@/lib/validations'

export async function POST(request: NextRequest) {
  try {
    const prisma = getPrismaClient()
    const body = await request.json()
    
    // Validate input
    const validated = newsletterSchema.parse(body)
    
    // Upsert newsletter subscription
    const subscription = await prisma.newsletterSubscription.upsert({
      where: { email: validated.email },
      update: {
        isActive: true,
        preferences: validated.preferences,
        name: validated.name || null,
      },
      create: {
        email: validated.email,
        name: validated.name || null,
        preferences: validated.preferences,
        isActive: true,
      },
    })
    
    return NextResponse.json(
      { 
        success: true, 
        message: 'Successfully subscribed to newsletter!',
        id: subscription.id 
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Newsletter error', {
      error: error instanceof Error ? error.message : String(error),
    })
    
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Invalid email address.' },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to subscribe. Please try again.' },
      { status: 500 }
    )
  }
}
