import { z } from 'zod';

export const ratingSchema = z.object({
  rating: z.number()
    .min(1, 'Rating must be at least 1')
    .max(5, 'Rating must be at most 5'),
  review: z.string()
    .max(500, 'Review must not exceed 500 characters')
    .optional()
    .nullable()
    .transform(val => val?.trim() || null),
});

export type RatingInput = z.infer<typeof ratingSchema>;