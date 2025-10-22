import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { rsvpFormSchema } from '@/lib/validations'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate input
    const validated = rsvpFormSchema.parse(body)
    
    // Upsert RSVP (update if exists, create if not)
    const rsvp = await prisma.eventRSVP.upsert({
      where: {
        eventId_email: {
          eventId: validated.eventId,
          email: validated.email,
        },
      },
      update: {
        name: validated.name,
        phone: validated.phone || null,
        guestCount: validated.guestCount,
        attending: validated.attending,
        dietaryRestrictions: validated.dietaryRestrictions || null,
        message: validated.message || null,
      },
      create: {
        eventId: validated.eventId,
        name: validated.name,
        email: validated.email,
        phone: validated.phone || null,
        guestCount: validated.guestCount,
        attending: validated.attending,
        dietaryRestrictions: validated.dietaryRestrictions || null,
        message: validated.message || null,
      },
    })
    
    return NextResponse.json(
      { 
        success: true, 
        message: 'RSVP submitted successfully!',
        id: rsvp.id 
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('RSVP error:', error)
    
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Invalid form data. Please check your inputs.' },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to submit RSVP. Please try again.' },
      { status: 500 }
    )
  }
}

// GET endpoint to retrieve RSVP count for an event
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const eventId = searchParams.get('eventId')
    
    if (!eventId) {
      return NextResponse.json(
        { error: 'eventId parameter is required' },
        { status: 400 }
      )
    }
    
    // Count attending guests
    const attendingCount = await prisma.eventRSVP.count({
      where: { 
        eventId, 
        attending: 'YES' 
      },
    })
    
    // Get total guest count (including +1s)
    const rsvps = await prisma.eventRSVP.findMany({
      where: { 
        eventId, 
        attending: 'YES' 
      },
      select: { guestCount: true }
    })
    
    const totalGuests = rsvps.reduce((sum, rsvp) => sum + rsvp.guestCount, 0)
    
    return NextResponse.json({ 
      attendingCount, 
      totalGuests 
    })
  } catch (error) {
    console.error('Error fetching RSVP count:', error)
    return NextResponse.json(
      { error: 'Failed to fetch RSVP count' },
      { status: 500 }
    )
  }
}
