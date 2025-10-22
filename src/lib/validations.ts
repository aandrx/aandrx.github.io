import { z } from 'zod'

// Contact form validation
export const contactFormSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  subject: z.string().optional(),
  message: z.string().min(10, 'Message must be at least 10 characters'),
})

export type ContactFormData = z.infer<typeof contactFormSchema>

// RSVP form validation
export const rsvpFormSchema = z.object({
  eventId: z.string().min(1, 'Event ID is required'),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional(),
  guestCount: z.number().min(1).max(10),
  attending: z.enum(['YES', 'NO', 'MAYBE']),
  dietaryRestrictions: z.string().optional(),
  message: z.string().optional(),
})

export type RSVPFormData = z.infer<typeof rsvpFormSchema>

// Newsletter subscription validation
export const newsletterSchema = z.object({
  email: z.string().email('Invalid email address'),
  name: z.string().optional(),
  preferences: z.array(z.string()).default(['new_work']),
})

export type NewsletterData = z.infer<typeof newsletterSchema>
