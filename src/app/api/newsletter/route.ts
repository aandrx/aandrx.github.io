import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { newsletterSchema } from '@/lib/validations'
import * as Sentry from '@sentry/nextjs'

export async function POST(request: NextRequest) {
  try {
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
    Sentry.captureException(error, {
      tags: { form: 'newsletter', status: 'error' }
    })
    Sentry.logger.error('Newsletter error', {
      error: error instanceof Error ? error.message : String(error)
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

// Unsubscribe endpoint
export async function DELETE(request: NextRequest) {
  try {
    const { email, reason } = await request.json()
    
    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }
    
    await prisma.newsletterSubscription.update({
      where: { email },
      data: {
        isActive: false,
        unsubscribedAt: new Date(),
        unsubscribeReason: reason || null,
      },
    })
    
    return NextResponse.json({ 
      success: true, 
      message: 'Successfully unsubscribed' 
    })
  } catch (error) {
    Sentry.captureException(error)
    Sentry.logger.error('Unsubscribe error', {
      error: error instanceof Error ? error.message : String(error)
    })
    return NextResponse.json(
      { error: 'Failed to unsubscribe' },
      { status: 500 }
    )
  }
}
