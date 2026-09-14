"use strict";

const aiCallingService = require("./aiCallingService");

describe("aiCallingService agent production behavior", () => {
  it("does not overwrite an existing default agent when agents are listed", async () => {
    const existingAgent = {
      id: "agent_1",
      name: "Best Vet Care Gujarati Sales Assistant",
      language: "english",
      voice: { languageCode: "en-IN" },
      active: true,
      createdAt: new Date("2026-08-14T12:00:00.000Z"),
    };
    const db = {
      aiCallAgent: {
        findFirst: jest.fn().mockResolvedValue(existingAgent),
        findMany: jest.fn().mockResolvedValue([existingAgent]),
        update: jest.fn(),
        create: jest.fn(),
      },
    };

    const agents = await aiCallingService.listAgents(db);

    expect(agents[0].language).toBe("english");
    expect(db.aiCallAgent.update).not.toHaveBeenCalled();
    expect(db.aiCallAgent.create).not.toHaveBeenCalled();
  });

  it("updates agent language and voice language code together", async () => {
    const existingAgent = {
      id: "agent_1",
      name: "Best Vet Care Gujarati Sales Assistant",
      purpose: "Call customers",
      systemPrompt: "Talk to customers politely.",
      openingMessage: "Hello from Best Vet Care.",
      language: "gujarati",
      voice: { speaker: "shubh", model: "bulbul:v3", pace: 1, languageCode: "gu-IN" },
      active: true,
    };
    const db = {
      aiCallAgent: {
        findUnique: jest.fn().mockResolvedValue(existingAgent),
        update: jest.fn().mockImplementation(({ data }) => Promise.resolve({ ...existingAgent, ...data })),
      },
    };

    const updated = await aiCallingService.updateAgent(
      "agent_1",
      {
        name: existingAgent.name,
        purpose: existingAgent.purpose,
        systemPrompt: existingAgent.systemPrompt,
        openingMessage: existingAgent.openingMessage,
        language: "english",
        active: true,
      },
      db,
    );

    expect(updated.language).toBe("english");
    expect(updated.voice.languageCode).toBe("en-IN");
  });

  it("creates an agent with the selected language", async () => {
    const db = {
      aiCallAgent: {
        create: jest.fn().mockImplementation(({ data }) => Promise.resolve({ id: "agent_2", ...data })),
      },
    };

    const created = await aiCallingService.createAgent(
      {
        name: "English Sales Assistant",
        purpose: "Call customers in English.",
        systemPrompt: "Speak in English and ask one question at a time.",
        openingMessage: "Hello, this is Best Vet Care.",
        language: "english",
        active: true,
      },
      { id: "admin_1" },
      db,
    );

    expect(created.language).toBe("english");
    expect(created.voice.languageCode).toBe("en-IN");
  });

  it("does not default new agents to Gujarati when language is missing", async () => {
    const db = {
      aiCallAgent: {
        create: jest.fn(),
      },
    };

    await expect(
      aiCallingService.createAgent(
        {
          name: "English Sales Assistant",
          purpose: "Call customers in English.",
          systemPrompt: "Speak in English and ask one question at a time.",
          openingMessage: "Hello, this is Best Vet Care.",
          active: true,
        },
        { id: "admin_1" },
        db,
      ),
    ).rejects.toThrow("Agent language is required");
    expect(db.aiCallAgent.create).not.toHaveBeenCalled();
  });


  it("deletes an unused agent", async () => {
    const db = {
      aiCallAgent: {
        findUnique: jest.fn().mockResolvedValue({ id: "agent_1" }),
        delete: jest.fn().mockResolvedValue({ id: "agent_1" }),
      },
      aiCallCampaign: {
        deleteMany: jest.fn().mockResolvedValue({ count: 0 }),
      },
      aiCall: {
        deleteMany: jest.fn().mockResolvedValue({ count: 0 }),
      },
      $transaction: jest.fn((handler) => handler(db)),
    };

    await expect(aiCallingService.deleteAgent("agent_1", db)).resolves.toEqual({
      id: "agent_1",
      deletedRelated: { calls: 0, queues: 0 },
    });
    expect(db.aiCall.deleteMany).toHaveBeenCalledWith({ where: { agentId: "agent_1" } });
    expect(db.aiCallCampaign.deleteMany).toHaveBeenCalledWith({ where: { agentId: "agent_1" } });
    expect(db.aiCallAgent.delete).toHaveBeenCalledWith({ where: { id: "agent_1" } });
  });

  it("deletes an agent used by calling records", async () => {
    const db = {
      aiCallAgent: {
        findUnique: jest.fn().mockResolvedValue({ id: "agent_1" }),
        delete: jest.fn().mockResolvedValue({ id: "agent_1" }),
      },
      aiCallCampaign: {
        deleteMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
      aiCall: {
        deleteMany: jest.fn().mockResolvedValue({ count: 3 }),
      },
      $transaction: jest.fn((handler) => handler(db)),
    };

    await expect(aiCallingService.deleteAgent("agent_1", db)).resolves.toEqual({
      id: "agent_1",
      deletedRelated: { calls: 3, queues: 1 },
    });
    expect(db.aiCallAgent.delete).toHaveBeenCalledWith({ where: { id: "agent_1" } });
  });

  it("rejects unsupported agent languages", async () => {
    const db = {
      aiCallAgent: {
        findUnique: jest.fn().mockResolvedValue({
          id: "agent_1",
          language: "gujarati",
          voice: { languageCode: "gu-IN" },
        }),
      },
    };

    await expect(
      aiCallingService.updateAgent("agent_1", { language: "spanish" }, db),
    ).rejects.toThrow("Choose a valid agent language");
  });

  it("marks customer lead status no_answer when Vobiz reports no answer", async () => {
    const call = {
      id: "call_1",
      customerId: "cust_1",
      campaignId: null,
      customer: { id: "cust_1", leadStatus: "calling" },
    };
    const customer = { id: "cust_1", leadStatus: "calling" };
    const db = {
      aiCall: {
        findUnique: jest.fn().mockResolvedValue(call),
        update: jest.fn().mockResolvedValue({ ...call, status: "no_answer" }),
      },
      customer: {
        findUnique: jest.fn().mockResolvedValue(customer),
        update: jest.fn(),
      },
      customerLeadStatusHistory: {
        create: jest.fn(),
      },
      $transaction: jest.fn((handler) => handler(db)),
    };

    await aiCallingService.handleVobizHangup("call_1", { status: "no-answer" }, db);

    expect(db.customer.update).toHaveBeenCalledWith({
      where: { id: "cust_1" },
      data: {
        leadStatus: "no_answer",
        doNotCall: undefined,
      },
    });
    expect(db.customerLeadStatusHistory.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        customerId: "cust_1",
        callId: "call_1",
        previousStatus: "calling",
        nextStatus: "no_answer",
      }),
    });
  });
});
