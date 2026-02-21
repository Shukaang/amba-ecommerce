import { z } from 'zod';

export const orderSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  phone: z.string().min(10, 'Phone number must be at least 10 digits'),
  shippingInfo: z.string().min(10, 'Shipping info is required'),
});

export type OrderInput = z.infer<typeof orderSchema>;