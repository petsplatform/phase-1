process.env.PETGPT_AI_ENABLED = "false";

jest.mock("../config/db", () => ({
  prisma: {
    product: {
      findMany: jest.fn(),
    },
    order: {
      findMany: jest.fn(),
    },
    pet: {
      findFirst: jest.fn(),
      update: jest.fn(),
      create: jest.fn(),
    },
    petGPTConversation: {
      findFirst: jest.fn(),
      upsert: jest.fn(),
    },
    petGPTMessage: {
      create: jest.fn(),
    },
    petGPTSymptom: {
      create: jest.fn(),
    },
    petGPTAnalyticsEvent: {
      create: jest.fn(),
    },
  },
}));

const { prisma } = require("../config/db");
const petgptService = require("./petgptService");

describe("PetGPT health assistant", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    petgptService.__resetForTests();
    prisma.pet.findFirst.mockResolvedValue(null);
    prisma.pet.create.mockImplementation(({ data }) => Promise.resolve({ id: "pet_created", ...data }));
    prisma.pet.update.mockImplementation(({ where, data }) => Promise.resolve({ id: where.id, ...data }));
    prisma.petGPTConversation.findFirst.mockResolvedValue(null);
    prisma.petGPTConversation.upsert.mockResolvedValue({});
    prisma.petGPTMessage.create.mockResolvedValue({});
    prisma.petGPTSymptom.create.mockResolvedValue({});
    prisma.petGPTAnalyticsEvent.create.mockResolvedValue({});
  });

  test("asks relevant follow-up for loose motions", async () => {
    const response = await petgptService.chat({
      conversationId: "test_loose_motions",
      message: "My dog has loose motions.",
    });

    expect(response.intent).toBe("SYMPTOM_HEALTH");
    expect(response.shouldAskFollowUp).toBe(true);
    expect(response.message).toMatch(/old|weigh/i);
    expect(response.products).toHaveLength(0);
  });

  test("escalates blood in stool without products", async () => {
    const response = await petgptService.chat({
      conversationId: "test_blood_stool",
      message: "My dog has loose motions and blood in stool.",
    });
    

    expect(response.riskLevel).toBe("EMERGENCY");
    expect(response.shouldRecommendVet).toBe(true);
    expect(response.shouldRecommendProducts).toBe(false);
    expect(response.products).toHaveLength(0);
    expect(response.message).toMatch(/veterinarian|emergency/i);
  });

  test("asks age for Labrador puppy nutrition when missing", async () => {
    const response = await petgptService.chat({
      conversationId: "test_puppy_food",
      message: "What food is good for a Labrador puppy?",
    });

    expect(response.intent).toBe("FOOD_NUTRITION");
    expect(response.shouldAskFollowUp).toBe(true);
    expect(response.message).toMatch(/old|age/i);
    expect(response.riskLevel).toBe("LOW");
  });

  test("searches actual products for safe shampoo request", async () => {
    prisma.product.findMany.mockResolvedValueOnce([
      {
        id: "prod_shampoo_1",
        name: "Gentle Oat Dog Shampoo",
        description: "Dog shampoo for dry skin care.",
        price: 499,
        salePrice: null,
        stock: 8,
        sold: 2,
        sku: "SHAMP-1",
        status: "Active",
        image: "/shampoo.png",
        gallery: [],
        petType: "dog",
        optionVariants: [],
        capacities: [],
        prescriptionRequired: false,
        vetOnly: false,
        category: { name: "grooming" },
      },
    ]);

    const response = await petgptService.chat({
      conversationId: "test_shampoo",
      message: "Show me dog shampoo products for scratching.",
    });

    expect(response.intent).toBe("PRODUCT_RECOMMENDATION");
    expect(response.riskLevel).toBe("LOW");
    expect(response.shouldRecommendProducts).toBe(true);
    expect(response.products).toHaveLength(1);
    expect(response.products[0].id).toBe("prod_shampoo_1");
  });

  test("does not blindly prescribe medicine", async () => {
    const response = await petgptService.chat({
      conversationId: "test_medicine",
      message: "What medicine should I give my dog?",
    });

    expect(response.intent).toBe("MEDICATION_QUESTION");
    expect(response.shouldAskFollowUp).toBe(true);
    expect(response.message).toMatch(/would not recommend|symptoms/i);
    expect(response.products).toHaveLength(0);
  });

  test("routes order question to order context", async () => {
    prisma.order.findMany.mockResolvedValueOnce([]);

    const response = await petgptService.chat({
      conversationId: "test_order",
      message: "Where is my order?",
    });

    expect(response.intent).toBe("ORDER_QUESTION");
    expect(response.message).toMatch(/log in|orders/i);
    expect(prisma.order.findMany).not.toHaveBeenCalled();
  });

  test("choking and swallowed object is emergency", async () => {
    const response = await petgptService.chat({
      conversationId: "test_choking",
      message: "My dog swallowed something and is choking.",
    });

    expect(response.intent).toBe("EMERGENCY_HEALTH");
    expect(response.riskLevel).toBe("EMERGENCY");
    expect(response.shouldRecommendVet).toBe(true);
    expect(response.products).toHaveLength(0);
  });

  test("does not repeat energy question after normal energy answer", async () => {
    const conversationId = "test_no_repeat_energy";

    await petgptService.chat({ conversationId, message: "My dog has loose motions." });
    await petgptService.chat({ conversationId, message: "2 years and 18 kg" });
    await petgptService.chat({ conversationId, message: "Since yesterday" });
    await petgptService.chat({ conversationId, message: "No blood or vomiting. Eating and drinking normally." });
    const response = await petgptService.chat({ conversationId, message: "my dog's energy level: normal" });

    expect(response.message).not.toMatch(/energy level/i);
    expect(response.conversationState.health.energyLevel).toBe(true);
  });

  test("extracts energy level and does not ask energy again", async () => {
    const response = await petgptService.chat({
      conversationId: "test_energy_direct",
      message: "My dog's energy level is normal.",
    });

    expect(response.conversationState.health.energyLevel).toBe(true);
    expect(response.message).not.toMatch(/energy level/i);
  });

  test("does not ask age again after age answer", async () => {
    const conversationId = "test_no_repeat_age";

    await petgptService.chat({ conversationId, message: "My dog has loose motions." });
    const response = await petgptService.chat({ conversationId, message: "My dog is 1 year old." });

    expect(response.conversationState.pet.age).toBe("1 year");
    expect(response.message).not.toMatch(/how old/i);
  });

  test("does not ask age or weight again after both are answered in one message", async () => {
    const conversationId = "test_no_repeat_age_weight";

    await petgptService.chat({ conversationId, message: "My dog has loose motions." });
    const response = await petgptService.chat({ conversationId, message: "My dog is 1 year old and weighs 12 kg." });

    expect(response.conversationState.pet.age).toBe("1 year");
    expect(response.conversationState.pet.weight).toBe("12 kg");
    expect(response.message).not.toMatch(/old|weigh/i);
  });

  test("does not ask energy, appetite, or water after semantic normal answers", async () => {
    const conversationId = "test_semantic_normal_answers";

    await petgptService.chat({ conversationId, message: "My dog has loose motions." });
    await petgptService.chat({ conversationId, message: "1 year old and 12 kg" });
    await petgptService.chat({ conversationId, message: "Since yesterday" });
    await petgptService.chat({ conversationId, message: "No vomiting and no blood." });
    const response = await petgptService.chat({
      conversationId,
      message: "My dog has normal energy, eating normally and drinking normally.",
    });

    expect(response.conversationState.health.energyLevel).toBe(true);
    expect(response.conversationState.health.appetite).toBe(true);
    expect(response.conversationState.health.waterIntake).toBe(true);
    expect(response.shouldAskFollowUp).toBe(false);
    expect(response.questionKey).toBeNull();
  });

  test("updates corrected weight instead of duplicating it", async () => {
    const conversationId = "test_weight_correction";

    await petgptService.chat({ conversationId, message: "My dog has loose motions." });
    await petgptService.chat({ conversationId, message: "My dog is 1 year old and weighs 12 kg." });
    const response = await petgptService.chat({ conversationId, message: "Actually my dog weighs 15 kg." });

    expect(response.conversationState.pet.weight).toBe("15 kg");
    expect(response.conversationState.questionState.answers.weight.value).toBe("15 kg");
  });

  test("marks unknown weight and does not ask weight again", async () => {
    const conversationId = "test_unknown_weight";

    await petgptService.chat({ conversationId, message: "My dog has loose motions." });
    const response = await petgptService.chat({ conversationId, message: "I don't know his weight." });

    expect(response.conversationState.questionState.unknownQuestions).toContain("weight");
    expect(response.message).not.toMatch(/weigh|weight/i);
  });

  test("blocks repeated same question key after unclear answer", async () => {
    const conversationId = "test_duplicate_question_key";

    await petgptService.chat({ conversationId, message: "My dog has loose motions." });
    await petgptService.chat({ conversationId, message: "1 year old and 12 kg" });
    const firstDurationPrompt = await petgptService.chat({ conversationId, message: "maybe" });
    const next = await petgptService.chat({ conversationId, message: "still not sure" });

    expect(firstDurationPrompt.questionKey).not.toBe(next.questionKey);
    expect(next.message).not.toMatch(/how long/i);
  });

  test("recognizes semantic duplicate wording for energy question", async () => {
    const conversationId = "test_semantic_energy_duplicate";

    await petgptService.chat({ conversationId, message: "My dog has loose motions." });
    await petgptService.chat({ conversationId, message: "1 year old and 12 kg" });
    await petgptService.chat({ conversationId, message: "Since yesterday" });
    await petgptService.chat({ conversationId, message: "No vomiting and no blood. Eating and drinking normally." });
    const response = await petgptService.chat({ conversationId, message: "He is energetic and active." });

    expect(response.conversationState.health.energyLevel).toBe(true);
    expect(response.message).not.toMatch(/energy level|active or weak|energetic/i);
  });

  test("stops asking questions when required diarrhea information is complete", async () => {
    prisma.product.findMany.mockResolvedValue([]);

    const response = await petgptService.chat({
      conversationId: "test_complete_health_info",
      message: "My dog has loose motions, is 1 year old, weighs 12 kg, since yesterday, no vomiting, no blood, eating normally, drinking normally, and energy is normal.",
    });

    expect(response.shouldAskFollowUp).toBe(false);
    expect(response.type).toBe("consultant_referral");
    expect(response.products).toHaveLength(0);
    expect(response.showConsultantCTA).toBe(true);
    expect(response.message).toMatch(/no suitable product|catalog|pet care team/i);
  });

  test("extracts multiple pet and health facts from one message", async () => {
    const response = await petgptService.chat({
      conversationId: "test_multi_fact_message",
      message: "My dog is Bruno, a 2-year-old Labrador weighing 18 kg. His energy is normal and he is eating and drinking normally.",
    });

    expect(response.conversationState.pet.name).toBe("Bruno");
    expect(response.conversationState.pet.species).toBe("dog");
    expect(response.conversationState.pet.age).toBe("2 years");
    expect(response.conversationState.pet.breed).toBe("Labrador");
    expect(response.conversationState.pet.weight).toBe("18 kg");
    expect(response.conversationState.health.energyLevel).toBe(true);
    expect(response.conversationState.health.appetite).toBe(true);
    expect(response.conversationState.health.waterIntake).toBe(true);
    expect(response.message).not.toMatch(/old|weigh|energy|eating|drinking/i);
  });

  test.each([
    "My dog is very active.",
    "He has lots of energy.",
    "He's energetic.",
    "His energy is good.",
    "He's behaving normally.",
  ])("recognizes normal energy variation: %s", async (message) => {
    const response = await petgptService.chat({
      conversationId: `test_energy_${message.replace(/[^a-z0-9]/gi, "_")}`,
      message,
    });

    expect(response.conversationState.health.energyLevel).toBe(true);
    expect(response.message).not.toMatch(/energy level/i);
  });

  test("stores negative vomiting answer", async () => {
    const response = await petgptService.chat({
      conversationId: "test_negative_vomiting",
      message: "My dog is not vomiting.",
    });

    expect(response.conversationState.health.vomiting).toBe(false);
    expect(response.message).not.toMatch(/vomiting/i);
  });

  test("stores no blood in stool answer", async () => {
    const response = await petgptService.chat({
      conversationId: "test_no_blood_stool",
      message: "There is no blood in his stool.",
    });

    expect(response.conversationState.health.bloodInStool).toBe(false);
    expect(response.riskLevel).not.toBe("EMERGENCY");
    expect(response.message).not.toMatch(/blood.*stool|blood/i);
  });

  test("complete loose motion flow remembers all answers and does not repeat", async () => {
    const conversationId = "test_full_loose_motion_flow";

    await petgptService.chat({ conversationId, message: "My dog has loose motions." });
    await petgptService.chat({ conversationId, message: "He is 2 years old and weighs 15 kg." });
    await petgptService.chat({ conversationId, message: "It started yesterday." });
    await petgptService.chat({ conversationId, message: "His energy is normal." });
    await petgptService.chat({ conversationId, message: "He is eating and drinking normally." });
    const response = await petgptService.chat({ conversationId, message: "He is not vomiting and there is no blood in his stool." });

    expect(response.conversationState.pet.species).toBe("dog");
    expect(response.conversationState.pet.age).toBe("2 years");
    expect(response.conversationState.pet.weight).toBe("15 kg");
    expect(response.symptoms).toContain("diarrhea");
    expect(response.conversationState.health.duration).toBe("since yesterday");
    expect(response.conversationState.health.energyLevel).toBe(true);
    expect(response.conversationState.health.appetite).toBe(true);
    expect(response.conversationState.health.waterIntake).toBe(true);
    expect(response.conversationState.health.vomiting).toBe(false);
    expect(response.conversationState.health.bloodInStool).toBe(false);
    expect(response.shouldAskFollowUp).toBe(false);
  });

  test("medication request with symptom asks safely and does not prescribe", async () => {
    const response = await petgptService.chat({
      conversationId: "test_diarrhea_medicine_safe",
      message: "My dog has diarrhea. What medicine should I give him?",
    });

    expect(response.intent).toBe("MEDICATION_QUESTION");
    expect(response.message).not.toMatch(/\b\d+\s*(mg|ml)\b|give .* tablet/i);
    expect(response.products).toHaveLength(0);
  });

  test("product recommendations are grounded in returned DB products", async () => {
    prisma.product.findMany.mockResolvedValueOnce([
      {
        id: "real_shampoo_1",
        name: "Real Dry Skin Shampoo",
        description: "Gentle shampoo for dogs.",
        price: 349,
        salePrice: null,
        stock: 4,
        sold: 1,
        sku: "REAL-SHAMP",
        status: "Active",
        image: "/real.png",
        gallery: [],
        petType: "dog",
        optionVariants: [],
        capacities: [],
        prescriptionRequired: false,
        vetOnly: false,
        category: { name: "grooming" },
      },
    ]);

    const response = await petgptService.chat({
      conversationId: "test_real_product_grounding",
      message: "Show me dog shampoo products for dry skin.",
    });

    expect(response.products.map((product) => product.id)).toEqual(["real_shampoo_1"]);
    expect(response.message).not.toMatch(/Premium Dog Skin Shampoo/i);
  });

  test("Labrador shedding request becomes real product recommendations instead of generic fallback", async () => {
    prisma.product.findMany.mockResolvedValueOnce([
      {
        id: "deshed_brush",
        name: "Dog De-Shedding Brush",
        description: "Brush for removing loose coat during routine grooming.",
        price: 599,
        salePrice: null,
        stock: 12,
        sold: 8,
        sku: "DESHED-BRUSH",
        status: "Active",
        image: "/deshed.png",
        gallery: [],
        petType: "dog",
        optionVariants: [],
        capacities: [],
        prescriptionRequired: false,
        vetOnly: false,
        category: { name: "grooming" },
      },
    ]);

    const response = await petgptService.chat({
      conversationId: "test_labrador_shedding_recommendation",
      message: "My Labrador is shedding a lot. Can you suggest something from your store?",
    });

    expect(response.intent).toBe("PRODUCT_RECOMMENDATION");
    expect(response.conversationState.pet.species).toBe("dog");
    expect(response.conversationState.pet.breed).toBe("Labrador");
    expect(response.conversationState.product.concern).toBe("shedding");
    expect(response.message).not.toMatch(/I can help with pet health questions/i);
    expect(response.products.map((product) => product.id)).toEqual(["deshed_brush"]);
  });

  test("itchy Labrador health problem completes assessment before searching products", async () => {
    prisma.product.findMany.mockResolvedValueOnce([
      {
        id: "allermyl_assessment",
        name: "Routine Itch Care Shampoo",
        description: "Dog shampoo listed for routine itchy and sensitive skin care.",
        price: 21.75,
        salePrice: null,
        stock: 11,
        sold: 5,
        sku: "ITCH-ASSESS",
        status: "Active",
        image: "/itch-assess.png",
        gallery: [],
        petType: "dog",
        optionVariants: [],
        capacities: [],
        prescriptionRequired: false,
        vetOnly: false,
        category: { name: "Allergy & Itch Care" },
      },
    ]);

    const conversationId = "test_itchy_labrador_assessment";

    const first = await petgptService.chat({
      conversationId,
      message: "My Labrador has been scratching more than usual and his skin seems itchy and sensitive. Can you help?",
    });

    expect(first.type).toBe("assessment_question");
    expect(first.mode).toBe("health_assessment");
    expect(first.assessmentComplete).toBe(false);
    expect(first.readyForProductSearch).toBe(false);
    expect(first.message).toMatch(/How long has the itching been happening/i);
    expect(first.products).toHaveLength(0);
    expect(prisma.product.findMany).not.toHaveBeenCalled();

    const second = await petgptService.chat({ conversationId, message: "About five days." });

    expect(second.type).toBe("assessment_question");
    expect(second.message).toMatch(/redness|hair loss|wounds|swelling|fleas/i);
    expect(second.products).toHaveLength(0);
    expect(prisma.product.findMany).not.toHaveBeenCalled();

    const third = await petgptService.chat({ conversationId, message: "A little redness. No wounds or swelling." });

    expect(third.type).toBe("assessment_question");
    expect(third.message).toMatch(/eating, drinking and behaving normally/i);
    expect(third.products).toHaveLength(0);
    expect(prisma.product.findMany).not.toHaveBeenCalled();

    const final = await petgptService.chat({ conversationId, message: "Yes." });

    expect(final.type).toBe("product_recommendation");
    expect(final.mode).toBe("product_recommendation");
    expect(final.assessmentComplete).toBe(true);
    expect(final.readyForProductSearch).toBe(true);
    expect(final.message).toMatch(/routine skin\/itch-care products/i);
    expect(final.products.map((product) => product.id)).toEqual(["allermyl_assessment"]);
    expect(prisma.product.findMany).toHaveBeenCalledTimes(1);
  });

  test("routine Labrador itching with denied sores continues assessment then searches skin catalog", async () => {
    prisma.product.findMany.mockResolvedValueOnce([
      {
        id: "allermyl_shampoo",
        name: "Virbac Allermyl Shampoo for Dogs & Cats",
        description: "Shampoo for itchy sensitive skin and allergy support.",
        price: 21.75,
        salePrice: null,
        stock: 11,
        sold: 5,
        sku: "ALLERMYL",
        status: "Active",
        image: "/allermyl.png",
        gallery: [],
        petType: "dog cat",
        optionVariants: [],
        capacities: [],
        prescriptionRequired: false,
        vetOnly: false,
        category: { name: "Allergy & Itch Care" },
      },
      {
        id: "sebolytic_shampoo",
        name: "Virbac Sebolytic Shampoo for Dogs & Cats",
        description: "Skin and coat care shampoo for routine grooming.",
        price: 20.5,
        salePrice: null,
        stock: 9,
        sold: 4,
        sku: "SEBOLYTIC",
        status: "Active",
        image: "/sebolytic.png",
        gallery: [],
        petType: "dog cat",
        optionVariants: [],
        capacities: [],
        prescriptionRequired: false,
        vetOnly: false,
        category: { name: "Skin & Coat Care" },
      },
    ]);

    const conversationId = "test_routine_labrador_itch_denied_sores";

    const first = await petgptService.chat({
      conversationId,
      message: "My Labrador has itchy and sensitive skin and keeps scratching. There is some mild redness too. Can you help?",
    });

    expect(first.type).toBe("assessment_question");
    expect(first.riskLevel).toBe("LOW");
    expect(first.safety.riskLevel).toBe("routine");
    expect(first.message).toMatch(/How long has the itching been happening/i);

    const second = await petgptService.chat({ conversationId, message: "The itching has been happening for about 5 days." });

    expect(second.type).toBe("assessment_question");
    expect(second.riskLevel).toBe("LOW");
    expect(second.message).toMatch(/redness|hair loss|wounds|swelling|fleas|sores/i);

    const third = await petgptService.chat({
      conversationId,
      message: "No, I haven't noticed any open sores, oozing, scabs, or patches of hair loss.",
    });

    expect(third.type).toBe("assessment_question");
    expect(third.riskLevel).toBe("LOW");
    expect(third.safety.riskLevel).toBe("routine");
    expect(third.shouldRecommendVet).toBe(false);
    expect(third.vetEscalationReason).toBeNull();
    expect(third.conversationState.health.skinBleeding).toBe(false);
    expect(third.conversationState.health.deniedSymptoms).toEqual(expect.arrayContaining(["open sores", "discharge", "scabs", "hair loss"]));
    expect(third.message).toMatch(/eating, drinking and behaving normally/i);
    expect(third.products).toHaveLength(0);
    expect(prisma.product.findMany).not.toHaveBeenCalled();

    const final = await petgptService.chat({
      conversationId,
      message: "Yes. He is eating and drinking normally and behaving like usual. He is active and doesn't seem weak or unusually tired.",
    });

    expect(final.type).toBe("product_recommendation");
    expect(final.riskLevel).toBe("LOW");
    expect(final.safety.riskLevel).toBe("routine");
    expect(final.assessmentComplete).toBe(true);
    expect(final.readyForProductSearch).toBe(true);
    expect(final.shouldRecommendVet).toBe(false);
    expect(final.products.map((product) => product.id)).toContain("allermyl_shampoo");
    expect(prisma.product.findMany).toHaveBeenCalledTimes(1);
  });

  test("negated safety terms do not trigger high risk or emergency", () => {
    const { extractHealthDetails, hasEmergencySignal, hasHighRiskSignal } = petgptService._private;

    expect(extractHealthDetails("There is no swelling.").deniedSymptoms).toContain("swelling");
    expect(hasHighRiskSignal("There is no swelling.")).toBe(false);
    expect(hasHighRiskSignal("There is swelling.")).toBe(false);

    expect(extractHealthDetails("He isn't vomiting.").vomiting).toBe(false);
    expect(hasHighRiskSignal("He isn't vomiting.")).toBe(false);
    expect(extractHealthDetails("He is vomiting repeatedly.").vomiting).toBe(true);
    expect(hasHighRiskSignal("He is vomiting repeatedly.")).toBe(true);

    expect(extractHealthDetails("He doesn't have trouble breathing.").deniedSymptoms).toContain("difficulty breathing");
    expect(hasEmergencySignal("He doesn't have trouble breathing.")).toBe(false);
    expect(hasEmergencySignal("He is struggling to breathe.")).toBe(true);

    expect(hasHighRiskSignal("No wounds. No swelling. No vomiting. No blood. He isn't weak. There is no discharge.")).toBe(false);
  });

  test("true breathing and facial swelling emergency still blocks products", async () => {
    const response = await petgptService.chat({
      conversationId: "test_true_skin_breathing_emergency",
      message: "My Labrador is itchy and his face suddenly became very swollen. He's having trouble breathing.",
    });

    expect(response.type).toBe("emergency");
    expect(response.riskLevel).toBe("EMERGENCY");
    expect(response.safety.riskLevel).toBe("emergency");
    expect(response.readyForProductSearch).toBe(false);
    expect(response.products).toHaveLength(0);
    expect(prisma.product.findMany).not.toHaveBeenCalled();
  });

  test("urgent cat pale gums assessment blocks product search and clears stale category", async () => {
    const conversationId = "test_urgent_cat_pale_gums_no_products";

    await petgptService.chat({
      conversationId,
      message: "My cat's ears are dirty and waxy but there is no pain, discharge or swelling. Can you suggest something for routine cleaning?",
    });
    prisma.product.findMany.mockClear();

    const response = await petgptService.chat({
      conversationId,
      message: "My cat has been lethargic and her gums look white. She is 2 years old and about 5 kg. No vomiting, no diarrhea, and normal urination.",
    });

    expect(response.type).toBe("urgent_health");
    expect(response.normalizedRiskLevel).toBe("urgent");
    expect(response.productSearchAllowed).toBe(false);
    expect(response.showProducts).toBe(false);
    expect(response.readyForProductSearch).toBe(false);
    expect(response.products).toHaveLength(0);
    expect(response.safety.productRecommendationAllowed).toBe(false);
    expect(response.conversationState.pet.species).toBe("cat");
    expect(response.conversationState.pet.age).toBe("2 years");
    expect(response.conversationState.pet.weight).toBe("5 kg");
    expect(response.conversationState.product.category).toBeUndefined();
    expect(response.vetEscalationReason).toMatch(/pale|white gums|high-risk/i);
    expect(prisma.product.findMany).not.toHaveBeenCalled();
  });

  test("urgent cat pale gums state does not reopen shopping when user asks for store product", async () => {
    const conversationId = "test_urgent_context_blocks_store_request";

    await petgptService.chat({
      conversationId,
      message: "My cat has been lethargic and her gums look white. She is 2 years old and about 5 kg. No vomiting, no diarrhea, and normal urination.",
    });
    const response = await petgptService.chat({
      conversationId,
      message: "Please suggest something from your store.",
    });

    expect(response.type).toBe("urgent_health");
    expect(response.normalizedRiskLevel).toBe("urgent");
    expect(response.productSearchAllowed).toBe(false);
    expect(response.products).toHaveLength(0);
    expect(response.conversationState.pet.species).toBe("cat");
    expect(prisma.product.findMany).not.toHaveBeenCalled();
  });

  test("unrelated ear product is not searched or returned for urgent systemic cat symptoms", async () => {
    const response = await petgptService.chat({
      conversationId: "test_epiotic_not_for_pale_gums",
      message: "My cat has been lethargic and her gums are persistently white.",
    });

    expect(response.type).toBe("urgent_health");
    expect(response.products).toHaveLength(0);
    expect(response.productSearchAllowed).toBe(false);
    expect(prisma.product.findMany).not.toHaveBeenCalled();
  });

  test("greeting is the only welcome-style response", async () => {
    const response = await petgptService.chat({
      conversationId: "test_plain_greeting",
      message: "Hi",
    });

    expect(response.intent).toBe("GENERAL_CONVERSATION");
    expect(response.message).toMatch(/What can I help you with today/i);
    expect(response.products).toHaveLength(0);
  });

  test("travel anxiety problem starts assessment without product cards", async () => {
    const response = await petgptService.chat({
      conversationId: "test_anxiety_calming_products",
      message: "My dog gets very nervous and anxious during travel and loud noises. Do you have anything in your store that could help with calming?",
    });

    expect(response.intent).toBe("BEHAVIOR");
    expect(response.type).toBe("assessment_question");
    expect(response.mode).toBe("health_assessment");
    expect(response.assessmentComplete).toBe(false);
    expect(response.readyForProductSearch).toBe(false);
    expect(response.conversationState.pet.species).toBe("dog");
    expect(response.conversationState.product.category).toBe("Calming & Anxiety Support");
    expect(response.conversationState.product.concern).toBe("anxiety and stress");
    expect(response.message).not.toMatch(/I can help with pet health questions/i);
    expect(response.products).toHaveLength(0);
  });

  test("dirty ear request searches real ear care products", async () => {
    prisma.product.findMany.mockResolvedValueOnce([
      {
        id: "epiotic_ear_cleaner",
        name: "Virbac EpiOtic Ear Cleaner for Dogs & Cats",
        description: "Routine ear cleaner for wax and ear hygiene.",
        price: 18.5,
        salePrice: null,
        stock: 18,
        sold: 7,
        sku: "EPIOTIC",
        status: "Active",
        image: "/epiotic.png",
        gallery: [],
        petType: "dog cat",
        optionVariants: [],
        capacities: [],
        prescriptionRequired: false,
        vetOnly: false,
        category: { name: "Ear Care" },
      },
    ]);

    const response = await petgptService.chat({
      conversationId: "test_ear_cleaner_products",
      message: "Show me dog ear care products.",
    });

    expect(response.intent).toBe("PRODUCT_RECOMMENDATION");
    expect(response.conversationState.product.category).toBe("Ear Care");
    expect(response.products.map((product) => product.id)).toEqual(["epiotic_ear_cleaner"]);
  });

  test("bad breath request searches real dental care products", async () => {
    prisma.product.findMany.mockResolvedValueOnce([
      {
        id: "cet_toothpaste",
        name: "Virbac C.E.T. Enzymatic Toothpaste for Dogs & Cats",
        description: "Toothpaste for routine dental hygiene and bad breath care.",
        price: 14.25,
        salePrice: null,
        stock: 15,
        sold: 6,
        sku: "CET-PASTE",
        status: "Active",
        image: "/cet.png",
        gallery: [],
        petType: "dog cat",
        optionVariants: [],
        capacities: [],
        prescriptionRequired: false,
        vetOnly: false,
        category: { name: "Dental Care" },
      },
    ]);

    const response = await petgptService.chat({
      conversationId: "test_dental_care_products",
      message: "My dog has bad breath. Show me something for regular dental care.",
    });

    expect(response.intent).toBe("PRODUCT_RECOMMENDATION");
    expect(response.conversationState.product.category).toBe("Dental Care");
    expect(response.products.map((product) => product.id)).toEqual(["cet_toothpaste"]);
  });

  test("direct allergy and itch shampoo request searches real products immediately", async () => {
    prisma.product.findMany.mockResolvedValueOnce([
      {
        id: "allermyl_shampoo",
        name: "Virbac Allermyl Shampoo for Dogs & Cats",
        description: "Shampoo for itchy sensitive skin and allergy support.",
        price: 21.75,
        salePrice: null,
        stock: 11,
        sold: 5,
        sku: "ALLERMYL",
        status: "Active",
        image: "/allermyl.png",
        gallery: [],
        petType: "dog cat",
        optionVariants: [],
        capacities: [],
        prescriptionRequired: false,
        vetOnly: false,
        category: { name: "Allergy & Itch Care" },
      },
    ]);

    const response = await petgptService.chat({
      conversationId: "test_itchy_skin_shampoo_products",
      message: "Show me allergy and itch-care shampoo for dogs.",
    });

    expect(response.intent).toBe("PRODUCT_RECOMMENDATION");
    expect(response.conversationState.product.category).toBe("Allergy & Itch Care");
    expect(response.products.map((product) => product.id)).toEqual(["allermyl_shampoo"]);
  });

  test("skin and coat browsing request searches real skin and coat products", async () => {
    prisma.product.findMany.mockResolvedValueOnce([
      {
        id: "sebolytic_shampoo",
        name: "Virbac Sebolytic Shampoo for Dogs & Cats",
        description: "Skin and coat care shampoo.",
        price: 20.5,
        salePrice: null,
        stock: 9,
        sold: 4,
        sku: "SEBOLYTIC",
        status: "Active",
        image: "/sebolytic.png",
        gallery: [],
        petType: "dog cat",
        optionVariants: [],
        capacities: [],
        prescriptionRequired: false,
        vetOnly: false,
        category: { name: "Skin & Coat Care" },
      },
    ]);

    const response = await petgptService.chat({
      conversationId: "test_skin_coat_products",
      message: "Show me skin and coat products for dogs.",
    });

    expect(response.intent).toBe("PRODUCT_RECOMMENDATION");
    expect(response.conversationState.product.category).toBe("Skin & Coat Care");
    expect(response.products.map((product) => product.id)).toEqual(["sebolytic_shampoo"]);
  });

  test("emergency product request stops before product search", async () => {
    const response = await petgptService.chat({
      conversationId: "test_breathing_product_stop",
      message: "My dog is struggling to breathe. What product should I buy?",
    });

    expect(response.intent).toBe("EMERGENCY_HEALTH");
    expect(response.shouldRecommendVet).toBe(true);
    expect(response.products).toHaveLength(0);
    expect(prisma.product.findMany).not.toHaveBeenCalled();
  });

  test.each([
    "My cat keeps trying to urinate but only a very small amount comes out.",
    "My male cat keeps going to the litter box and only a few drops come out.",
    "My cat is straining to pee and crying.",
    "My cat hasn't been able to urinate.",
  ])("cat urinary obstruction warning escalates as emergency: %s", async (message) => {
    const response = await petgptService.chat({
      conversationId: `test_cat_urinary_${message.replace(/[^a-z0-9]/gi, "_")}`,
      message,
    });

    expect(response.intent).toBe("EMERGENCY_HEALTH");
    expect(response.healthDomain).toBe("urinary");
    expect(response.type).toBe("emergency");
    expect(response.riskLevel).toBe("EMERGENCY");
    expect(response.emergencyReason).toBe("possible_urinary_obstruction");
    expect(response.products).toHaveLength(0);
    expect(response.showConsultantCTA).toBe(false);
    expect(response.readyForProductSearch).toBe(false);
    expect(response.message).toMatch(/urgent urinary|veterinarian|do not wait for a store product/i);
    expect(prisma.product.findMany).not.toHaveBeenCalled();
  });

  test("urinary-care shopping request searches real catalog without emergency routing", async () => {
    prisma.product.findMany.mockResolvedValueOnce([
      {
        id: "cat_urinary_support",
        name: "Cat Urinary Care Supplement",
        description: "Urinary and bladder support supplement for cats.",
        price: 24.99,
        salePrice: null,
        stock: 8,
        sold: 2,
        sku: "CAT-URINARY",
        status: "Active",
        image: "/urinary.png",
        gallery: [],
        petType: "cat",
        optionVariants: [],
        capacities: [],
        prescriptionRequired: false,
        vetOnly: false,
        category: { name: "Kidney & Urinary Care" },
      },
    ]);

    const response = await petgptService.chat({
      conversationId: "test_urinary_shopping",
      message: "Show me urinary-care products for cats.",
    });

    expect(response.intent).toBe("PRODUCT_RECOMMENDATION");
    expect(response.healthDomain).toBe("urinary");
    expect(response.riskLevel).toBe("LOW");
    expect(response.type).toBe("product_recommendation");
    expect(response.products.map((product) => product.id)).toEqual(["cat_urinary_support"]);
  });

  test("kidney veterinary food request does not recommend Pronefra oral suspension as food", async () => {
    prisma.product.findMany.mockResolvedValueOnce([
      {
        id: "pronefra",
        name: "Virbac Pronefra Kidney Support for Cats & Dogs",
        description: "Brand: Virbac. Product type: Oral Suspension. Palatable kidney-support liquid for cats and dogs.",
        price: 16.99,
        salePrice: null,
        stock: 2,
        sold: 1,
        sku: "VIRBAC-PRONEFRA",
        status: "Active",
        image: "/pronefra.png",
        gallery: [],
        petType: "dog cat",
        optionVariants: [],
        capacities: [],
        prescriptionRequired: true,
        vetOnly: false,
        category: { name: "Kidney & Urinary Care" },
      },
      {
        id: "cat_digestive_food",
        name: "Virbac Veterinary HPM Digestive Support Cat Food G1",
        description: "Brand: Virbac. Product type: Veterinary Diet. Digestive support dry cat food.",
        price: 29.5,
        salePrice: null,
        stock: 2,
        sold: 0,
        sku: "VIRBAC-HPM-DIGESTIVE-CAT-G1",
        status: "Active",
        image: "/digestive-cat-food.png",
        gallery: [],
        petType: "cat",
        optionVariants: [],
        capacities: [],
        prescriptionRequired: true,
        vetOnly: false,
        category: { name: "Veterinary Diet" },
      },
    ]);

    const response = await petgptService.chat({
      conversationId: "test_kidney_vet_food_no_pronefra",
      message: "My cat has been diagnosed by my vet with a urinary/kidney issue and I'm looking for the veterinary diet they recommended. Can you show suitable food from your store?",
    });

    expect(response.intent).toBe("PRODUCT_RECOMMENDATION");
    expect(response.healthDomain).toBe("urinary");
    expect(response.conversationState.product.requestedProductType).toBe("food");
    expect(response.conversationState.product.category).toBe("Veterinary Diet");
    expect(response.type).toBe("no_matching_product");
    expect(response.products).toHaveLength(0);
    expect(response.showConsultantCTA).toBe(true);
    expect(response.message).toMatch(/couldn't find|veterinary diet|won't substitute/i);
  });

  test("oral kidney support request can recommend Pronefra", async () => {
    prisma.product.findMany.mockResolvedValueOnce([
      {
        id: "pronefra",
        name: "Virbac Pronefra Kidney Support for Cats & Dogs",
        description: "Brand: Virbac. Product type: Oral Suspension. Palatable kidney-support liquid for cats and dogs.",
        price: 16.99,
        salePrice: null,
        stock: 2,
        sold: 1,
        sku: "VIRBAC-PRONEFRA",
        status: "Active",
        image: "/pronefra.png",
        gallery: [],
        petType: "dog cat",
        optionVariants: [],
        capacities: [],
        prescriptionRequired: true,
        vetOnly: false,
        category: { name: "Kidney & Urinary Care" },
      },
    ]);

    const response = await petgptService.chat({
      conversationId: "test_kidney_oral_support_pronefra",
      message: "Do you have an oral kidney-support product for my cat?",
    });

    expect(response.type).toBe("product_recommendation");
    expect(response.conversationState.product.requestedProductType).toBe("oral_suspension");
    expect(response.products.map((product) => product.id)).toEqual(["pronefra"]);
    expect(response.products[0].normalizedProductTypes).toEqual(expect.arrayContaining(["oral_suspension"]));
  });

  test("dental chews request filters out toothbrush products", async () => {
    prisma.product.findMany.mockResolvedValueOnce([
      {
        id: "toothbrush",
        name: "Virbac Dual-Ended Toothbrush for Dogs & Cats",
        description: "Brand: Virbac. Product type: Dental Product. Dual-ended toothbrush.",
        price: 6.99,
        salePrice: null,
        stock: 5,
        sold: 1,
        sku: "VIRBAC-TOOTHBRUSH",
        status: "Active",
        image: "/toothbrush.png",
        gallery: [],
        petType: "dog cat",
        optionVariants: [],
        capacities: [],
        prescriptionRequired: false,
        vetOnly: false,
        category: { name: "Dental Care" },
      },
      {
        id: "veggiedent",
        name: "Virbac VEGGIEDENT FR3SH Dental Chews for Dogs",
        description: "Brand: Virbac. Product type: Dental Product. Natural-origin dental chews for dogs.",
        price: 8,
        salePrice: null,
        stock: 5,
        sold: 4,
        sku: "VIRBAC-VEGGIEDENT",
        status: "Active",
        image: "/veggiedent.png",
        gallery: [],
        petType: "dog",
        optionVariants: [],
        capacities: [],
        prescriptionRequired: false,
        vetOnly: false,
        category: { name: "Dental Care" },
      },
    ]);

    const response = await petgptService.chat({
      conversationId: "test_dental_chews_only",
      message: "Show me dental chews for my dog.",
    });

    expect(response.type).toBe("product_recommendation");
    expect(response.conversationState.product.requestedProductType).toBe("chewable");
    expect(response.products.map((product) => product.id)).toEqual(["veggiedent"]);
  });

  test("general urinary information question is not emergency or unknown", async () => {
    const response = await petgptService.chat({
      conversationId: "test_urinary_info",
      message: "What are urinary problems in cats?",
    });

    expect(response.intent).toBe("HEALTH_QUESTION");
    expect(response.healthDomain).toBe("urinary");
    expect(response.type).toBe("message");
    expect(response.riskLevel).toBe("LOW");
    expect(response.products).toHaveLength(0);
    expect(response.message).toMatch(/common signs|urinary/i);
    expect(prisma.product.findMany).not.toHaveBeenCalled();
  });

  test.each([
    ["My dog has been vomiting since yesterday.", "SYMPTOM_HEALTH"],
    ["My Labrador keeps scratching.", "SYMPTOM_HEALTH"],
    ["My dog's eye is red and has discharge.", "SYMPTOM_HEALTH"],
    ["My dog is limping and won't put weight on his leg.", "SYMPTOM_HEALTH"],
    ["My dog is struggling to breathe.", "EMERGENCY_HEALTH"],
    ["My cat has collapsed.", "EMERGENCY_HEALTH"],
  ])("clear health problem does not fall to unknown: %s", async (message, expectedIntent) => {
    const response = await petgptService.chat({
      conversationId: `test_health_not_unknown_${message.replace(/[^a-z0-9]/gi, "_")}`,
      message,
    });

    expect(response.intent).toBe(expectedIntent);
    expect(response.intent).not.toBe("UNKNOWN");
    expect(response.type).not.toBe("unknown");
  });

  test("genuinely unclear message still uses unknown fallback", async () => {
    const response = await petgptService.chat({
      conversationId: "test_genuine_unknown",
      message: "asdf xyz something",
    });

    expect(response.intent).toBe("UNKNOWN");
    expect(response.message).toMatch(/didn't fully understand/i);
  });

  test("completed non-emergency vomiting assessment refers to consultant when catalog has no suitable product", async () => {
    prisma.product.findMany.mockResolvedValue([]);

    const response = await petgptService.chat({
      conversationId: "test_vomiting_no_product_consultant",
      message: "My dog is 4 years old and weighs 20 kg. He has been vomiting since yesterday, twice. No blood in the vomit. Eating and drinking normally and energy is normal.",
    });

    expect(response.riskLevel).toBe("LOW");
    expect(response.assessmentComplete).toBe(true);
    expect(response.readyForProductSearch).toBe(true);
    expect(response.productSearchCompleted).toBe(true);
    expect(response.type).toBe("consultant_referral");
    expect(response.products).toHaveLength(0);
    expect(response.showConsultantCTA).toBe(true);
    expect(response.consultantContactRoute).toBe("/contact");
    expect(response.consultantSummary).toMatch(/Product search: no suitable store product found/i);
    expect(response.actions).toContainEqual({
      type: "CONTACT_CONSULTANT",
      label: "Contact Our Consultant",
      route: "/contact",
      source: "PETGPT",
    });
  });

  test("unrelated catalog products are not recommended for vomiting and diarrhea", async () => {
    prisma.product.findMany.mockResolvedValue([
      {
        id: "allermyl_shampoo",
        name: "Virbac Allermyl Shampoo",
        description: "Shampoo for itchy sensitive skin and allergy support.",
        price: 21.75,
        salePrice: null,
        stock: 11,
        sold: 5,
        sku: "ALLERMYL",
        status: "Active",
        image: "/allermyl.png",
        gallery: [],
        petType: "dog cat",
        optionVariants: [],
        capacities: [],
        prescriptionRequired: false,
        vetOnly: false,
        category: { name: "Allergy & Itch Care" },
      },
      {
        id: "epiotic_ear_cleaner",
        name: "EpiOtic Ear Cleaner",
        description: "Routine ear cleaner for wax and ear hygiene.",
        price: 18.5,
        salePrice: null,
        stock: 18,
        sold: 7,
        sku: "EPIOTIC",
        status: "Active",
        image: "/epiotic.png",
        gallery: [],
        petType: "dog cat",
        optionVariants: [],
        capacities: [],
        prescriptionRequired: false,
        vetOnly: false,
        category: { name: "Ear Care" },
      },
    ]);

    const response = await petgptService.chat({
      conversationId: "test_unrelated_products_filtered",
      message: "My dog is 3 years old and weighs 18 kg. He has vomiting and diarrhea since yesterday, vomited twice, no blood in vomit or stool, eating and drinking normally and energy is normal.",
    });

    expect(response.type).toBe("consultant_referral");
    expect(response.products).toHaveLength(0);
    expect(response.message).toMatch(/no suitable product|catalog/i);
  });

  test("routine chewing problem recommends store products", async () => {
    prisma.product.findMany.mockResolvedValueOnce([
      {
        id: "puppy_chew",
        name: "Puppy Chew Toy",
        description: "Chew toy for teething puppies and furniture chewing.",
        price: 299,
        salePrice: null,
        stock: 9,
        sold: 4,
        sku: "PUP-CHEW",
        status: "Active",
        image: "/chew.png",
        gallery: [],
        petType: "dog",
        optionVariants: [],
        capacities: [],
        prescriptionRequired: false,
        vetOnly: false,
        category: { name: "toy" },
      },
    ]);

    const response = await petgptService.chat({
      conversationId: "test_puppy_chewing_products",
      message: "Show me puppy chew toys for furniture chewing.",
    });

    expect(response.intent).toBe("PRODUCT_RECOMMENDATION");
    expect(response.conversationState.product.productType).toBe("chew toy");
    expect(response.products.map((product) => product.id)).toEqual(["puppy_chew"]);
  });

  test("low-risk itching flow recommends only in-stock store products after context is collected", async () => {
    prisma.product.findMany.mockResolvedValueOnce([
      {
        id: "itch_shampoo_in_stock",
        name: "Gentle Itch Care Shampoo",
        description: "Gentle grooming product for itchy dog skin.",
        price: 449,
        salePrice: null,
        stock: 5,
        sold: 3,
        sku: "ITCH-SHAMP-IN",
        status: "Active",
        image: "/itch.png",
        gallery: [],
        petType: "dog",
        optionVariants: [],
        capacities: [],
        prescriptionRequired: false,
        vetOnly: false,
        category: { name: "grooming" },
      },
      {
        id: "itch_shampoo_out_of_stock",
        name: "Out of Stock Itch Shampoo",
        description: "Unavailable product.",
        price: 399,
        salePrice: null,
        stock: 0,
        sold: 9,
        sku: "ITCH-SHAMP-OOS",
        status: "Active",
        image: "/oos.png",
        gallery: [],
        petType: "dog",
        optionVariants: [],
        capacities: [],
        prescriptionRequired: false,
        vetOnly: false,
        category: { name: "grooming" },
      },
    ]);

    const response = await petgptService.chat({
      conversationId: "test_low_risk_itching_products",
      message: "My dog has itching for 3 days. No bleeding or open sores. No fleas or ticks. Eating and drinking normally and energy is normal.",
    });

    expect(["SYMPTOM_HEALTH", "GROOMING", "PRODUCT_RECOMMENDATION"]).toContain(response.intent);
    expect(response.riskLevel).toBe("LOW");
    expect(response.shouldRecommendVet).toBe(false);
    expect(response.shouldRecommendProducts).toBe(true);
    expect(response.products.map((product) => product.id)).toEqual(["itch_shampoo_in_stock"]);
    expect(response.message).toMatch(/veterinarian|product label|veterinary advice|actual catalog/i);
  });

  test("order question does not enter health flow", async () => {
    const response = await petgptService.chat({
      conversationId: "test_order_not_health",
      message: "Where is my order?",
    });

    expect(response.intent).toBe("ORDER_QUESTION");
    expect(response.questionKey).toBeNull();
    expect(response.message).not.toMatch(/dog|cat|symptom|energy|weight/i);
  });

  test("conversation memory summary reflects known pet details", async () => {
    const conversationId = "test_memory_summary";

    await petgptService.chat({ conversationId, message: "My dog's name is Bruno." });
    await petgptService.chat({ conversationId, message: "Bruno is 2 years old." });
    await petgptService.chat({ conversationId, message: "He weighs 18 kg." });
    await petgptService.chat({ conversationId, message: "Bruno has been scratching for three days." });
    const response = await petgptService.chat({ conversationId, message: "What do you know about my dog?" });

    expect(response.message).toMatch(/Bruno/i);
    expect(response.message).toMatch(/2 years/i);
    expect(response.message).toMatch(/18 kg/i);
    expect(response.message).toMatch(/itching|scratching|symptoms/i);
  });

  test("new conversation does not inherit previous pet state", async () => {
    await petgptService.chat({ conversationId: "test_isolation_a", message: "My dog is Bruno, 2 years old and 18 kg." });
    const response = await petgptService.chat({ conversationId: "test_isolation_b", message: "My cat is 4 years old." });

    expect(response.conversationState.pet.species).toBe("cat");
    expect(response.conversationState.pet.age).toBe("4 years");
    expect(response.conversationState.pet.name).not.toBe("Bruno");
    expect(response.conversationState.pet.weight).toBeUndefined();
  });

  test("selected petId keeps multiple authenticated pets separate", async () => {
    const customer = { id: "cust_1", status: "Active" };
    prisma.pet.findFirst.mockImplementation(({ where }) => {
      if (where.id === "pet_bruno") return Promise.resolve({ id: "pet_bruno", customerId: "cust_1", name: "Bruno", species: "dog", age: "2 years" });
      if (where.id === "pet_milo") return Promise.resolve({ id: "pet_milo", customerId: "cust_1", name: "Milo", species: "cat", age: "4 years" });
      return Promise.resolve(null);
    });

    const bruno = await petgptService.chat({ conversationId: "test_pet_switch_a", petId: "pet_bruno", message: "He weighs 18 kg." }, customer);
    const milo = await petgptService.chat({ conversationId: "test_pet_switch_b", petId: "pet_milo", message: "He weighs 5 kg." }, customer);

    expect(bruno.conversationState.pet.name).toBe("Bruno");
    expect(bruno.conversationState.pet.weight).toBe("18 kg");
    expect(milo.conversationState.pet.name).toBe("Milo");
    expect(milo.conversationState.pet.weight).toBe("5 kg");
  });

  test("same conversation id preserves state across client reload", async () => {
    const conversationId = "test_reload_same_session";

    await petgptService.chat({ conversationId, message: "My dog is 2 years old and weighs 15 kg." });
    const response = await petgptService.chat({ conversationId, message: "He has diarrhea." });

    expect(response.conversationState.pet.age).toBe("2 years");
    expect(response.conversationState.pet.weight).toBe("15 kg");
    expect(response.message).not.toMatch(/old|weigh/i);
  });

  test("reset conversation id starts clean state", async () => {
    await petgptService.chat({ conversationId: "test_reset_old", message: "My dog is 2 years old and weighs 15 kg." });
    const response = await petgptService.chat({ conversationId: "test_reset_new", message: "My dog is 5 years old." });

    expect(response.conversationState.pet.age).toBe("5 years");
    expect(response.conversationState.pet.weight).toBeUndefined();
  });

  test("repeated same energy message does not ask energy again", async () => {
    const conversationId = "test_repeated_energy_message";

    await petgptService.chat({ conversationId, message: "My dog's energy level is normal." });
    const response = await petgptService.chat({ conversationId, message: "My dog's energy level is normal." });

    expect(response.conversationState.health.energyLevel).toBe(true);
    expect(response.message).not.toMatch(/energy level/i);
  });

  test("later energy question is treated as already answered", async () => {
    const conversationId = "test_later_energy_question";

    await petgptService.chat({ conversationId, message: "My dog is very active." });
    const response = await petgptService.chat({ conversationId, message: "How is his energy?" });

    expect(response.conversationState.health.energyLevel).toBe(true);
    expect(response.message).not.toMatch(/energy level|active or weak/i);
  });

  test("answer plus question extracts age and continues without asking age", async () => {
    const response = await petgptService.chat({
      conversationId: "test_answer_plus_question",
      message: "My dog is 2 years old. Does age matter for diarrhea?",
    });

    expect(response.conversationState.pet.age).toBe("2 years");
    expect(response.message).not.toMatch(/how old/i);
  });

  test("intent can change from food recommendation to health flow", async () => {
    const conversationId = "test_intent_change";

    await petgptService.chat({ conversationId, message: "What is the best dog food?" });
    const response = await petgptService.chat({ conversationId, message: "My dog has diarrhea." });

    expect(response.intent).toBe("SYMPTOM_HEALTH");
    expect(response.symptoms).toContain("diarrhea");
    expect(response.questionKey).not.toBe("category");
  });

  test("selects a real matching variant by pet weight and returns DB price, image, sku, and stock", async () => {
    prisma.product.findMany.mockResolvedValueOnce([
      {
        id: "heartworm_dog",
        name: "Heartworm Dog Preventive",
        description: "Heartworm product with dog weight variants.",
        price: 34.99,
        salePrice: 39.99,
        stock: 90,
        sold: 5,
        sku: "HWP-DOG",
        status: "Active",
        image: "/product.png",
        gallery: [],
        petType: "dog",
        prescriptionRequired: false,
        vetOnly: false,
        category: { name: "medicine" },
        optionVariants: [
          {
            id: "hwp-small",
            label: "Up to 25 lbs + 6 Doses",
            weightRange: "Up to 25 lbs",
            dose: "6 Doses",
            packSize: 6,
            sku: "HWP-DOG-25-6",
            price: 34.99,
            regularPrice: 39.99,
            stock: 0,
            status: "Active",
            image: "/small.png",
          },
          {
            id: "hwp-medium",
            label: "26-50 lbs + 6 Doses",
            weightRange: "26-50 lbs",
            dose: "6 Doses",
            packSize: 6,
            sku: "HWP-DOG-50-6",
            price: 39.99,
            regularPrice: 44.99,
            stock: 12,
            status: "Active",
            image: "/medium.png",
          },
        ],
      },
    ]);

    const response = await petgptService.chat({
      conversationId: "test_variant_recommendation",
      message: "My dog weighs 20 kg. Which heartworm product is available?",
    });

    expect(response.products).toHaveLength(1);
    expect(response.products[0].id).toBe("heartworm_dog");
    expect(response.products[0].variantId).toBe("hwp-medium");
    expect(response.products[0].selectedSize.id).toBe("hwp-medium");
    expect(response.products[0].selectedSize.price).toBe(39.99);
    expect(response.products[0].price).toBe(39.99);
    expect(response.products[0].image).toBe("/medium.png");
    expect(response.products[0].variant.sku).toBe("HWP-DOG-50-6");
    expect(response.products[0].variant.stock).toBe(12);
    expect(response.actions).toContainEqual({ type: "VIEW_PRODUCT_OR_ADD_TO_CART", productId: "heartworm_dog" });
  });

  test("does not select an out-of-stock matching variant as available", async () => {
    prisma.product.findMany.mockResolvedValueOnce([
      {
        id: "flea_dog",
        name: "Flea Dog Product",
        description: "Flea product with variants.",
        price: 21.99,
        salePrice: 24.99,
        stock: 9,
        sold: 0,
        sku: "FLEA-DOG",
        status: "Active",
        image: "/flea.png",
        gallery: [],
        petType: "dog",
        prescriptionRequired: false,
        vetOnly: false,
        category: { name: "medicine" },
        optionVariants: [
          {
            id: "flea-match-oos",
            label: "26-50 lbs",
            weightRange: "26-50 lbs",
            sku: "FLEA-OOS",
            price: 24.99,
            regularPrice: 28.99,
            stock: 0,
            status: "Active",
            image: "/oos.png",
          },
          {
            id: "flea-large",
            label: "51-100 lbs",
            weightRange: "51-100 lbs",
            sku: "FLEA-L",
            price: 30.99,
            regularPrice: 35.99,
            stock: 9,
            status: "Active",
            image: "/large.png",
          },
        ],
      },
    ]);

    const response = await petgptService.chat({
      conversationId: "test_variant_oos",
      message: "My dog weighs 20 kg. Which flea product is available?",
    });

    expect(response.products[0].variantId).toBeNull();
    expect(response.products[0].variant?.sku).not.toBe("FLEA-OOS");
    expect(response.products[0].inventory.isInStock).toBe(true);
  });

  test("recognizes advanced natural language health phrases", async () => {
    const conversationId = "test_advanced_natural_language";

    await petgptService.chat({ conversationId, message: "He started having watery poop last night." });
    await petgptService.chat({ conversationId, message: "He threw up twice." });
    await petgptService.chat({ conversationId, message: "He hasn't been eating much." });
    await petgptService.chat({ conversationId, message: "She's still playful." });
    const response = await petgptService.chat({ conversationId, message: "There's no blood in his poop." });

    expect(response.symptoms).toEqual(expect.arrayContaining(["diarrhea", "vomiting"]));
    expect(response.conversationState.health.duration).toBe("last night");
    expect(response.conversationState.health.frequency).toBe("twice");
    expect(response.conversationState.health.appetite).toBe(false);
    expect(response.conversationState.health.energyLevel).toBe(true);
    expect(response.conversationState.health.bloodInStool).toBe(false);
  });

  test.each([
    "My dog ate something poisonous.",
    "My dog is having a seizure.",
    "My dog can't breathe.",
    "My dog collapsed.",
    "My dog has severe bleeding.",
  ])("medical emergency escalates and returns no products: %s", async (message) => {
    const response = await petgptService.chat({
      conversationId: `test_emergency_${message.replace(/[^a-z0-9]/gi, "_")}`,
      message,
    });

    expect(response.shouldRecommendVet).toBe(true);
    expect(response.riskLevel).toBe("EMERGENCY");
    expect(response.products).toHaveLength(0);
  });
});
