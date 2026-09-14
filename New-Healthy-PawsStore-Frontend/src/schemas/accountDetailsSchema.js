import { z } from "zod";

export const accountDetailsSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(2, "Full name must be at least 2 characters.")
    .max(50, "Full name must not exceed 50 characters."),
  email: z
    .string()
    .trim()
    .email("Enter a valid email address.")
    .max(100, "Email address must not exceed 100 characters."),
  phone: z
    .string()
    .trim()
    .refine((val) => {
      const digits = val.replace(/\D/g, "");
      return digits.length === 10;
    }, "Phone number must be exactly 10 digits."),
});
