import { z } from 'zod'

export const contactSchema = z.object({
  first_name: z.string().min(1),
  last_name: z.string().min(1),
  email: z.string().email(),
  address_line_1: z.string().min(1),
  address_line_2: z.string().optional(),
  city: z.string().min(1),
  state: z.string().min(1),
  zip: z.string().min(1),
  delivery_method: z.enum(['handwrite', 'print', 'digital']),
  tags: z.array(z.string()).optional().default([]),
})

export type ContactInput = z.infer<typeof contactSchema>

export const letterDraftSchema = z.object({
  subject: z.string().min(1, 'Subject is required'),
  body: z.string(),
})

export type LetterDraftInput = z.infer<typeof letterDraftSchema>

export const verifySchema = z.object({
  address_line_1: z.string().min(1),
  address_line_2: z.string().optional(),
  city: z.string().min(1),
  state: z.string().min(1),
  zip: z.string().min(1),
})

export type VerifyInput = z.infer<typeof verifySchema>

export const scheduleVerificationSchema = z.object({
  send_at: z.string().min(1),
})

export const onboardingSchema = z.object({
  full_name: z.string().trim().min(1).max(80),
})

export type OnboardingInput = z.infer<typeof onboardingSchema>
