import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { contactFormSchema } from '@/lib/validations'
import * as Sentry from '@sentry/nextjs'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate input
    const validated = contactFormSchema.parse(body)
    
    // Get IP address for spam prevention
    const ipAddress = 
      request.headers.get('x-forwarded-for') || 
      request.headers.get('x-real-ip') || 
      'unknown'
    
    // Create submission in database
    const submission = await prisma.contactSubmission.create({
      data: {
        name: validated.name,
        email: validated.email,
        subject: validated.subject || null,
        message: validated.message,
        ipAddress: ipAddress,
        status: 'NEW',
      },
    })

    // Log successful submission to Sentry
    Sentry.captureMessage('Contact form submitted', {
      level: 'info',
      tags: {
        form: 'contact',
        status: 'success',
      },
      extra: {
        submissionId: submission.id,
        email: validated.email,
      },
    })
    
    return NextResponse.json(
      { 
        success: true, 
        message: 'Thank you for your message! I will get back to you soon.',
        id: submission.id 
      },
      { status: 201 }
    )
  } catch (error) {
    // Capture error in Sentry
    Sentry.captureException(error, {
      tags: {
        form: 'contact',
        status: 'error',
      },
    })
    
    Sentry.logger.error('Contact form error', { 
      error: error instanceof Error ? error.message : String(error) 
    })
    
    // Check if it's a validation error
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Invalid form data. Please check your inputs.' },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to submit contact form. Please try again.' },
      { status: 500 }
    )
  }
}

// Optional: GET endpoint to retrieve submissions (for admin use)
export async function GET(request: NextRequest) {
  try {
    const submissions = await prisma.contactSubmission.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50, // Limit to last 50 submissions
    })
    
    return NextResponse.json(submissions)
  } catch (error) {
    Sentry.captureException(error)
    Sentry.logger.error('Error fetching submissions', { 
      error: error instanceof Error ? error.message : String(error) 
    })
    return NextResponse.json(
      { error: 'Failed to fetch submissions' },
      { status: 500 }
    )
  }
}
