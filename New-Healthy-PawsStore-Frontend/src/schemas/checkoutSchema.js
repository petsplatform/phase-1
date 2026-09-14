import { z } from "zod";

export const checkoutSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(2, "Full name must be between 2 and 50 characters.")
    .max(50, "Full name must be between 2 and 50 characters."),
  email: z.string().trim().email("Enter a valid email address."),
  phone: z
    .string()
    .trim()
    .refine((val) => val.replace(/\D/g, "").length === 10, {
      message: "Phone number must be exactly 10 digits.",
    }),
  address: z
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
    .min(3, "ZIP/Postal code must be between 3 and 10 characters.")
    .max(10, "ZIP/Postal code must be between 3 and 10 characters."),
  country: z.string().trim().optional().default("United States"),
  shipDifferent: z.boolean().optional(),
  paymentMethod: z.enum(["stripe", "cod"]),
  savePaymentMethod: z.boolean().optional(),
  orderNote: z.string().max(500, "Note must be 500 characters or fewer.").optional(),
});

export const checkoutDefaults = {
  fullName: "",
  email: "",
  phone: "",
  address: "",
  city: "",
  state: "",
  postalCode: "",
  country: "United States",
  shipDifferent: false,
  paymentMethod: "stripe",
  savePaymentMethod: true,
  orderNote: "",
};
