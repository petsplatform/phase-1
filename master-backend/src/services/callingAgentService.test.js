"use strict";

jest.mock("./aiCallingService", () => ({
  getCall: jest.fn(),
  recordMessage: jest.fn().mockResolvedValue({ id: "message_1" }),
  runAction: jest.fn(),
  updateCustomerLeadStatus: jest.fn().mockResolvedValue({ id: "cust_1" }),
}));

const { _test } = require("./callingAgentService");
const callingAgentService = require("./callingAgentService");
const aiCallingService = require("./aiCallingService");

describe("callingAgentService turn handling", () => {
  const conversation = [
    {
      role: "assistant",
      content:
        "Hello, this is the automated assistant calling from Best Vet Care. Is now a good time to speak?",
    },
  ];

  it("does not treat short acknowledgements as end-call intent", () => {
    expect(_test.customerEndIntent("Hmm", conversation)).toBeNull();
    expect(_test.customerEndIntent("Thank you", conversation)).toBeNull();
    expect(_test.acknowledgementReply("Hmm", "Best Vet Care")).toBe(
      "Sure. What pet-care product or medicine are you looking for today?",
    );
    expect(_test.acknowledgementReply("Thank you", "Best Vet Care")).toBe(
      "You're welcome. Is there any pet medicine, food, grooming product, or healthcare item you need from Best Vet Care?",
    );
  });

  it("still ends the call when the customer clearly says goodbye", () => {
    expect(_test.customerEndIntent("thank you bye", conversation)).toEqual({
      outcome: "not_interested",
      reason: "Customer ended or declined the conversation",
    });
  });

  it("detects yes share on my email as an email request", () => {
    expect(_test.customerEndIntent("yes share on my email", conversation)).toBeNull();
    expect(_test.acknowledgementReply("yes share on my email", "Best Vet Care")).toBeNull();
    expect(_test.wantsEmailInformation("yes share on my email")).toBe(true);
  });

  it("treats yes after an email-only details offer as email consent", () => {
    const selectedProduct = { id: "prod_dog_food", name: "Virbac Veterinary HPM Weight Loss Dog Food W1" };
    const emailOfferConversation = [
      ...conversation,
      { role: "customer", content: "I am looking for a pet food for my dog." },
      {
        role: "assistant",
        content:
          "We have Virbac Veterinary HPM Weight Loss Dog Food W1 at 31.95, with limited stock; it may require veterinary guidance. Would you like the details by email?",
        metadata: {
          voiceState: {
            conversationStage: "AWAITING_DELIVERY_CONFIRMATION",
            selectedProduct,
            selectedProducts: [selectedProduct],
            pendingAction: { type: "SEND_PRODUCT_DETAILS", channel: "email", productId: selectedProduct.id },
          },
        },
      },
    ];

    expect(_test.confirmsEmailInformation("Yes", emailOfferConversation)).toBe(true);
    expect(_test.deliveryChannelsForTurn("Yes please", emailOfferConversation)).toEqual(["email"]);
    expect(_test.pendingActionFromConversation(emailOfferConversation)).toEqual({
      type: "SEND_PRODUCT_DETAILS",
      channel: "email",
      productId: selectedProduct.id,
    });
  });

  it("does not choose email from yes after a WhatsApp-or-email choice", () => {
    const channelChoiceConversation = [
      ...conversation,
      { role: "customer", content: "I am looking for dog food." },
      { role: "assistant", content: "Should I share the available dog food options on WhatsApp or email?" },
    ];

    expect(_test.confirmsEmailInformation("Yes", channelChoiceConversation)).toBe(false);
  });

  it("creates pending email state when product details are offered by email", () => {
    const product = { id: "prod_1", name: "Dog Food", price: 31.95, stock: 2 };
    const state = _test.voiceStateForAgentReply(
      "We have Dog Food at 31.95. Would you like the details by email?",
      [product],
    );

    expect(state.conversationStage).toBe("AWAITING_DELIVERY_CONFIRMATION");
    expect(state.selectedProduct).toMatchObject({ id: "prod_1", name: "Dog Food" });
    expect(state.pendingAction).toEqual({
      type: "SEND_PRODUCT_DETAILS",
      channel: "email",
      productId: "prod_1",
    });
  });

  it("resolves yes to WhatsApp when WhatsApp is the pending action", () => {
    const whatsappConversation = [
      ...conversation,
      {
        role: "assistant",
        content: "Would you like the product details on WhatsApp?",
        metadata: {
          voiceState: {
            conversationStage: "AWAITING_DELIVERY_CONFIRMATION",
            selectedProduct: { id: "prod_2", name: "Dog Food" },
            selectedProducts: [{ id: "prod_2", name: "Dog Food" }],
            pendingAction: { type: "SEND_PRODUCT_DETAILS", channel: "whatsapp", productId: "prod_2" },
          },
        },
      },
    ];

    expect(_test.confirmsWhatsappInformation("Yes", whatsappConversation)).toBe(true);
    expect(_test.deliveryChannelsForTurn("Yes", whatsappConversation)).toEqual(["whatsapp"]);
  });

  it("resolves yes to product discovery when another product was offered", () => {
    const anotherProductConversation = [
      ...conversation,
      { role: "assistant", content: "Would you like another product?" },
    ];

    expect(_test.asksForAnotherProduct("Yes", anotherProductConversation)).toBe(true);
    expect(_test.declinesAnotherProduct("No", anotherProductConversation)).toBe(true);
  });

  it("supports explicit email, WhatsApp, and both-channel delivery intents", () => {
    expect(_test.deliveryChannelsForTurn("Please send the details to my email.", conversation)).toEqual(["email"]);
    expect(_test.deliveryChannelsForTurn("Send this on WhatsApp.", conversation)).toEqual(["whatsapp"]);
    expect(_test.deliveryChannelsForTurn("Send it by email and WhatsApp.", conversation)).toEqual(["email", "whatsapp"]);
  });

  it("keeps pending email action active while collecting a missing email address", () => {
    const awaitingEmailConversation = [
      ...conversation,
      {
        role: "assistant",
        content: "Sure. What email address should I send the details to?",
        metadata: {
          voiceState: {
            conversationStage: "AWAITING_EMAIL_ADDRESS",
            selectedProduct: { id: "prod_3", name: "Dog Food" },
            selectedProducts: [{ id: "prod_3", name: "Dog Food" }],
            pendingAction: {
              type: "SEND_PRODUCT_DETAILS",
              channel: "email",
              productId: "prod_3",
              awaitingEmailAddress: true,
            },
          },
        },
      },
    ];

    expect(_test.deliveryChannelsForTurn("customer@example.com", awaitingEmailConversation)).toEqual(["email"]);
  });

  it("keeps yes/no answers tied to the previous agent question", () => {
    const dogFoodConversation = [
      ...conversation,
      { role: "customer", content: "Food" },
      { role: "assistant", content: "Do you mean food for a dog?" },
    ];

    expect(_test.contextualAcknowledgementReply("Yes", dogFoodConversation, "Best Vet Care")).toBe(
      "Great. Should I share the available dog food options on WhatsApp or email?",
    );
  });

  it("ends the call when customer says please cut", () => {
    expect(_test.customerEndIntent("Please cut", conversation)).toEqual({
      outcome: "not_interested",
      reason: "Customer ended or declined the conversation",
    });
  });

  it("prefers food products for food requests", () => {
    const products = [
      { name: "Flea Spot-On for Dogs", category: { name: "Flea Care" }, description: "", petType: "Dog" },
      { name: "Weight Loss Dog Food", category: { name: "Veterinary Diet" }, description: "", petType: "Dog" },
    ];

    expect(_test.preferRequestedProductType(products, ["dog", "food"]).map((product) => product.name)).toEqual([
      "Weight Loss Dog Food",
    ]);
  });

  describe("respondToTurn pending delivery actions", () => {
    const selectedProduct = {
      id: "prod_dog_food",
      name: "Virbac Veterinary HPM Weight Loss Dog Food W1",
      price: 31.95,
      stock: 3,
      petType: "Dog",
    };

    function callWithPendingAction(overrides = {}) {
      return {
        id: "call_1",
        customer: {
          id: "cust_1",
          name: "Customer One",
          email: "customer@example.com",
          phone: "+15550001111",
          whatsappNumber: "+15550001111",
          leadStatus: "queued",
          ...overrides.customer,
        },
        customerId: "cust_1",
        agent: { systemPrompt: "You are a calling agent.", language: "english" },
        campaign: null,
        actions: overrides.actions || [],
        messages: overrides.messages || [
          { role: "agent", content: "Is now a good time to speak?" },
          { role: "customer", content: "Yes" },
          { role: "agent", content: "Sure. What pet-care product or medicine are you looking for today?" },
          { role: "customer", content: "I am looking for pet food for my dog." },
          {
            role: "agent",
            content:
              "We have Virbac Veterinary HPM Weight Loss Dog Food W1 at 31.95, with limited stock. Would you like the details by email?",
            metadata: {
              voiceState: {
                conversationStage: "AWAITING_DELIVERY_CONFIRMATION",
                selectedProduct,
                selectedProducts: [selectedProduct],
                pendingAction: {
                  type: "SEND_PRODUCT_DETAILS",
                  channel: overrides.channel || "email",
                  productId: selectedProduct.id,
                  awaitingEmailAddress: overrides.awaitingEmailAddress || undefined,
                },
              },
            },
          },
        ],
      };
    }

    beforeEach(() => {
      jest.clearAllMocks();
      aiCallingService.recordMessage.mockResolvedValue({ id: "message_1" });
      aiCallingService.updateCustomerLeadStatus.mockResolvedValue({ id: "cust_1" });
    });

    it("marks the customer interested when they answer positively", async () => {
      aiCallingService.getCall.mockResolvedValue(callWithPendingAction({
        messages: [
          { role: "agent", content: "Is now a good time to speak?" },
          { role: "customer", content: "Yes" },
        ],
      }));

      await callingAgentService.respondToTurn({
        callId: "call_1",
        transcript: "Yes",
        db: {},
        brandName: "Best Vet Care",
      });

      expect(aiCallingService.updateCustomerLeadStatus).toHaveBeenCalledWith({
        customerId: "cust_1",
        callId: "call_1",
        status: "interested",
        reason: "Customer answered positively or showed interest",
        user: null,
      }, {});
    });

    it("marks the customer not interested and ends when they answer negatively", async () => {
      aiCallingService.getCall.mockResolvedValue(callWithPendingAction({
        messages: [
          { role: "agent", content: "Is now a good time to speak?" },
          { role: "customer", content: "No" },
        ],
      }));

      
      const result = await callingAgentService.respondToTurn({
        callId: "call_1",
        transcript: "No",
        db: {},
        brandName: "Best Vet Care",
      });

      expect(aiCallingService.updateCustomerLeadStatus).toHaveBeenCalledWith({
        customerId: "cust_1",
        callId: "call_1",
        status: "not_interested",
        reason: "Customer answered negatively",
        user: null,
      }, {});
      expect(result).toMatchObject({ endCall: true, outcome: "not_interested" });
    });

    beforeEach(() => {
      jest.clearAllMocks();
      aiCallingService.recordMessage.mockResolvedValue({ id: "message_1" });
      aiCallingService.updateCustomerLeadStatus.mockResolvedValue({ id: "cust_1" });
      aiCallingService.runAction.mockResolvedValue({ id: "action_1", status: "success" });
    });

    it("sends selected product by email when yes confirms the pending email action", async () => {
      aiCallingService.getCall.mockResolvedValue(callWithPendingAction());

      const result = await callingAgentService.respondToTurn({
        callId: "call_1",
        transcript: "Yes",
        db: {},
        brandName: "Best Vet Care",
      });

      expect(aiCallingService.runAction).toHaveBeenCalledTimes(1);
      expect(aiCallingService.runAction.mock.calls[0][1]).toBe("send_email_information");
      expect(aiCallingService.runAction.mock.calls[0][2].products).toEqual([selectedProduct]);
      expect(result.message).toContain("I've sent the product details to your email");
      expect(result.message).not.toContain("What pet-care product or medicine are you looking for today");
      expect(result.endCall).toBe(true);
    });

    it("asks for an email address instead of claiming success when customer email is missing", async () => {
      aiCallingService.getCall.mockResolvedValue(callWithPendingAction({ customer: { email: "" } }));

      const result = await callingAgentService.respondToTurn({
        callId: "call_1",
        transcript: "Yes",
        db: {},
        brandName: "Best Vet Care",
      });

      expect(aiCallingService.runAction).not.toHaveBeenCalled();
      expect(result.message).toBe("Sure. What email address should I send the details to?");
    });

    it("does not falsely confirm success when email sending fails", async () => {
      aiCallingService.getCall.mockResolvedValue(callWithPendingAction());
      aiCallingService.runAction.mockRejectedValue(new Error("SMTP failed"));

      const result = await callingAgentService.respondToTurn({
        callId: "call_1",
        transcript: "Yes",
        db: {},
        brandName: "Best Vet Care",
      });

      expect(aiCallingService.runAction).toHaveBeenCalledTimes(1);
      expect(result.message).toContain("could not send the email");
      expect(result.endCall).toBeUndefined();
    });

    it("routes pending WhatsApp confirmation to the WhatsApp action", async () => {
      aiCallingService.getCall.mockResolvedValue(callWithPendingAction({ channel: "whatsapp" }));

      const result = await callingAgentService.respondToTurn({
        callId: "call_1",
        transcript: "Yes",
        db: {},
        brandName: "Best Vet Care",
      });

      expect(aiCallingService.runAction).toHaveBeenCalledTimes(1);
      expect(aiCallingService.runAction.mock.calls[0][1]).toBe("send_whatsapp_information");
      expect(aiCallingService.runAction.mock.calls[0][2].products).toEqual([selectedProduct]);
      expect(result.message).toContain("I've sent the product details on WhatsApp");
      expect(result.endCall).toBe(true);
    });
  });
});
