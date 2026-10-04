// Zod schemas for the send flow.
// Used server-side in /api/checkout to validate and sanitise all input.

import { z } from 'zod';

const email = z
  .string()
  .trim()
  .toLowerCase()
  .min(1, 'Email is required.')
  .max(255, 'Email is too long.')
  .email('Please enter a valid email address.');

const name = z
  .string()
  .trim()
  .min(1, 'Name is required.')
  .max(100, 'Name is too long.');

export const checkoutInputSchema = z.object({
  slug: z.string().trim().min(1).max(100),
  locale: z.enum(['en', 'ar', 'it', 'ko', 'ja']),

  message: z
    .string()
    .transform((v) => v.trim())
    .refine((v) => v.length > 0, 'Message is required.')
    .refine((v) => v.length <= 320, 'Message must be 320 characters or fewer.'),

  senderName: name,
  senderEmail: email,

  recipientName: name,
  recipientEmail: email,
});

export type CheckoutInput = z.infer<typeof checkoutInputSchema>;
