import { z } from "zod";

export const addressSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(2, "Full name must be between 2 and 50 characters.")
    .max(50, "Full name must be between 2 and 50 characters."),
  phone: z
    .string()
    .trim()
    .refine((val) => val.replace(/\D/g, "").length === 10, {
      message: "Phone number must be exactly 10 digits.",
    }),
  line1: z
    .string()
    .trim()
    .min(5, "Street address must be between 5 and 100 characters.")
    .max(100, "Street address must be between 5 and 100 characters."),
  city: z
    .string()
    .trim()
    .min(2, "City must be between 2 and 50 characters.")
    .max(50, "City must be between 2 and 50 characters."),
  state: z
    .string()
    .trim()
    .min(2, "State must be between 2 and 50 characters.")
    .max(50, "State must be between 2 and 50 characters."),
  postalCode: z
    .string()
    .trim()
    .min(3, "Postal code must be between 3 and 10 characters.")
    .max(10, "Postal code must be between 3 and 10 characters."),
  country: z.string().trim().min(2, "Country is required.").default("United States"),
  isDefault: z.boolean().optional(),
});
