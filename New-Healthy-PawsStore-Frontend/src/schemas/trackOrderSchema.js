import { z } from "zod";

export const trackOrderSchema = z.object({
  query: z.string().trim().min(5, "Enter a valid order ID or tracking number."),
});
