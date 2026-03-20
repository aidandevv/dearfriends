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

export const profileSchema = z.object({
  full_name: z.string().trim().min(1).max(80),
  bio: z.string().trim().max(160).optional(),
  sender_name: z.string().trim().max(80).optional(),
  anniversary_reminders_enabled: z.boolean().optional(),
})

export type ProfileInput = z.infer<typeof profileSchema>

const RESERVED_SLUGS = new Set([
  'login', 'dashboard', 'share', 'verify', 'about',
  'onboarding', 'api', 'settings', 's',
])

export const slugSchema = z
  .string()
  .regex(/^[a-z0-9_-]{3,30}$/, 'Slug must be 3–30 lowercase letters, numbers, hyphens, or underscores')
  .refine(s => !RESERVED_SLUGS.has(s), { message: 'That slug is reserved' })

export type SlugInput = z.infer<typeof slugSchema>
