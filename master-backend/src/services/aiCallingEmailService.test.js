"use strict";

jest.mock("./emailService", () => ({
  getEmailBrand: jest.fn(() => ({ name: "Best Vet Care", storeKey: "STORE_1" })),
  sendEmail: jest.fn().mockResolvedValue({ messageId: "email-1", accepted: ["customer@example.com"] }),
}));

const aiCallingService = require("./aiCallingService");
const { sendEmail } = require("./emailService");

describe("aiCallingService email product details", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("sends real product details when email information action runs", async () => {
    const call = {
      id: "call_1",
      customerId: "cust_1",
      customer: {
        id: "cust_1",
        name: "Customer One",
        email: "customer@example.com",
      },
      actions: [],
    };
    const action = { id: "action_1", status: "pending" };
    const db = {
      aiCall: {
        findUnique: jest.fn().mockResolvedValue(call),
      },
      aiCallAction: {
        findUnique: jest.fn().mockResolvedValue(null),
        create: jest.fn().mockResolvedValue(action),
        update: jest.fn().mockImplementation(({ data }) => Promise.resolve({ ...action, ...data })),
      },
      product: {
        findMany: jest.fn().mockResolvedValue([
          {
            id: "product_1",
            name: "Dog Shampoo",
            price: 299,
            salePrice: 349,
            stock: 12,
            description: "Gentle shampoo for dogs",
            petType: "dog",
            category: { name: "Grooming" },
          },
        ]),
      },
    };

    const result = await aiCallingService.runAction(
      "call_1",
      "send_email_information",
      { email: null, subject: null, message: null, productQuery: "dog shampoo" },
      null,
      db,
    );

    expect(result.status).toBe("success");
    expect(sendEmail).toHaveBeenCalledTimes(1);
    const emailPayload = sendEmail.mock.calls[0][0];
    expect(emailPayload.to).toBe("customer@example.com");
    expect(emailPayload.text).toContain("Dog Shampoo");
    expect(emailPayload.html).toContain("Dog Shampoo");
    expect(emailPayload.html).toContain("$299");
    expect(emailPayload.text).not.toContain("₹");
    expect(emailPayload.html).not.toContain("₹");
  });
});
