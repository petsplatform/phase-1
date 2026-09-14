const crypto = require("crypto");
const { prisma } = require("../config/db");
const { normalizeProduct, toMoney } = require("../utils/productCatalog");
const {
  generatePetAssistantMessage,
  runPetAssistantDecision,
} = require("./openaiService");

const MAX_HISTORY_MESSAGES = 24;
const MAX_PRODUCTS = 5;
const conversations = new Map();
const conversationLocks = new Map();

const INTENTS = {
  GENERAL_PET_CARE: "GENERAL_PET_CARE",
  SYMPTOM_HEALTH: "SYMPTOM_HEALTH",
  EMERGENCY_HEALTH: "EMERGENCY_HEALTH",
  PRODUCT_RECOMMENDATION: "PRODUCT_RECOMMENDATION",
  FOOD_NUTRITION: "FOOD_NUTRITION",
  GROOMING: "GROOMING",
  BEHAVIOR: "BEHAVIOR",
  VACCINATION: "VACCINATION",
  MEDICATION_QUESTION: "MEDICATION_QUESTION",
  HEALTH_QUESTION: "HEALTH_QUESTION",
  ORDER_QUESTION: "ORDER_QUESTION",
  PRODUCT_INFORMATION: "PRODUCT_INFORMATION",
  GENERAL_CONVERSATION: "GENERAL_CONVERSATION",
  UNKNOWN: "UNKNOWN",
};

const RISK_LEVELS = {
  LOW: "LOW",
  MEDIUM: "MEDIUM",
  HIGH: "HIGH",
  EMERGENCY: "EMERGENCY",
};

const AI_INTENT_TO_INTERNAL = {
  greeting: INTENTS.GENERAL_CONVERSATION,
  general_question: INTENTS.GENERAL_PET_CARE,
  health_question: INTENTS.HEALTH_QUESTION,
  health_assessment: INTENTS.SYMPTOM_HEALTH,
  emergency_health: INTENTS.EMERGENCY_HEALTH,
  product_search: INTENTS.PRODUCT_RECOMMENDATION,
  product_recommendation: INTENTS.PRODUCT_RECOMMENDATION,
  nutrition: INTENTS.FOOD_NUTRITION,
  grooming: INTENTS.GROOMING,
  behavior: INTENTS.BEHAVIOR,
  order_tracking: INTENTS.ORDER_QUESTION,
  shipping: INTENTS.ORDER_QUESTION,
  returns: INTENTS.ORDER_QUESTION,
  consultant_request: INTENTS.GENERAL_PET_CARE,
  unknown: INTENTS.UNKNOWN,
};

const MODES = {
  GREETING: "greeting",
  HEALTH_ASSESSMENT: "health_assessment",
  PRODUCT_SEARCH: "product_search",
  PRODUCT_RECOMMENDATION: "product_recommendation",
  ORDER_SUPPORT: "order_support",
  GENERAL_PET_CARE: "general_pet_care",
  URGENT_HEALTH: "urgent_health",
  EMERGENCY: "emergency",
  UNKNOWN: "unknown",
};

const HEALTH_INTENTS = new Set([
  INTENTS.SYMPTOM_HEALTH,
  INTENTS.EMERGENCY_HEALTH,
  INTENTS.MEDICATION_QUESTION,
  INTENTS.HEALTH_QUESTION,
  INTENTS.VACCINATION,
  INTENTS.BEHAVIOR,
]);

const PET_TYPES = [
  "dog",
  "cat",
  "puppy",
  "kitten",
  "bird",
  "fish",
  "rabbit",
  "horse",
];
const GREETING_PATTERNS = [
  /^\s*(hi|hello|hey|hii|good morning|good evening|good afternoon)\s*[!.]?\s*$/i,
];
const ORDER_PATTERNS = [
  /\b(order|orders|tracking|track|shipment|delivery status|payment status|my purchase|last purchase)\b/i,
];
const MEDICATION_PATTERNS = [
  /\b(medicine|medication|tablet|dose|dosage|antibiotic|painkiller|give my .* for|what should i give)\b/i,
];
const VACCINATION_PATTERNS = [
  /\b(vaccin|rabies|booster|shot|deworm|parvo|distemper)\b/i,
];
const FOOD_PATTERNS = [
  /\b(food|kibble|wet food|dry food|diet|nutrition|feed|feeding|treat|puppy food|kitten food|senior food)\b/i,
];
const GROOMING_PATTERNS = [
  /\b(shampoo|groom|grooming|conditioner|coat|fur|brush|comb|deshed|de-shed|de shedding|shedding|shed|tick|flea|itch|scratching|odor|skin)\b/i,
];
const BEHAVIOR_PATTERNS = [
  /\b(barking|biting|aggressive|anxiety|anxious|nervous|stress|stressed|training|chewing|chew|litter|behavior|behaviour|scratching (?:my |the )?sofa|scratches (?:my |the )?sofa|bored|furniture)\b/i,
];
const PRODUCT_PATTERNS = [
  /\b(recommend|suggest|which|what should i buy|buy|show me|find|price|available|product|products)\b/i,
];
const DIRECT_SHOPPING_PATTERNS = [
  /\b(show me|shop|browse|find|buy|price|available|availability|products?|from (?:your|the) store|in (?:your|the) store|do you sell)\b/i,
];
const HEALTH_PATTERNS = [
  /\b(vomit|vomiting|vomited|throwing up|threw up|diarrhea|diarrhoea|loose motion|loose motions|stool|poop|watery poop|watery stool|soft stool|runny poop|digestive|stomach upset|blood|cough|sneeze|fever|temperature|limp|limping|wound|injur|not eating|weak|letharg|pale gums|white gums|gum|gums|pain|scratch|itch|rash|swollen|ear|eye|red eye|discharge|urine|urinary|urinate|urinating|pee|peeing|wee|litter box|litter tray|straining|only drops|few drops|small amount)\b/i,
];
const EMERGENCY_PATTERNS = [
  /\b(chok|can't breathe|cant breathe|difficulty breathing|trouble breathing|struggling to breathe|struggle to breathe|breathing difficulty|collapse|collapsed|unresponsive|seizure|seizures|poison|toxic|rat poison|bleeding heavily|vomiting blood|blood in vomit|swallowed something|foreign body|object stuck)\b/i,
  /\b(blood in (his |her |the )?stool|bloody stool|black stool|severe weakness|severe dehydration|significant bleeding)\b/i,
];
const HIGH_RISK_PATTERNS = [
  /\b(blood|bloody|repeated vomiting|severe vomiting|very weak|refusing water|not drinking|puppy|kitten|dehydrated|worsening|severe pain|open sore|open sores|skin lesion|skin lesions|bleeding)\b/i,
];

const CATEGORY_KEYWORDS = {
  food: ["food", "kibble", "dry food", "wet food", "meal", "diet", "treat"],
  "Skin & Coat Care": [
    "skin and coat",
    "skin & coat",
    "coat care",
    "coat",
    "fur",
    "shampoo",
  ],
  "Allergy & Itch Care": [
    "allergy",
    "allergies",
    "itch",
    "itchy",
    "itching",
    "sensitive skin",
    "scratching",
    "rash",
  ],
  "Ear Care": ["ear", "ears", "ear cleaner", "ear cleaning", "waxy", "wax"],
  "Dental Care": [
    "dental",
    "teeth",
    "tooth",
    "oral care",
    "oral hygiene",
    "oral rinse",
    "bad breath",
    "breath",
    "toothpaste",
  ],
  "Kidney & Urinary Care": [
    "urinary",
    "urine",
    "pee",
    "urinate",
    "kidney",
    "bladder",
    "renal",
  ],
  "Calming & Anxiety Support": [
    "calming",
    "calm",
    "anxiety",
    "anxious",
    "stress",
    "stressed",
    "nervous",
    "travel anxiety",
    "loud noises",
  ],
  "Digestive Care": [
    "digestive",
    "gastro",
    "gastrointestinal",
    "stomach",
    "recovery food",
  ],
  "Probiotics & Gut Health": [
    "probiotic",
    "gut health",
    "digestion",
    "digestive supplement",
  ],
  "Joint & Mobility Care": [
    "joint",
    "mobility",
    "senior",
    "arthritis",
    "flexibility",
  ],
  "Flea & Tick Care": [
    "flea",
    "fleas",
    "tick",
    "ticks",
    "spot-on",
    "spot on",
    "collar",
  ],
  Deworming: [
    "deworm",
    "wormer",
    "worming",
    "worms",
    "tapeworm",
    "roundworm",
    "hookworm",
  ],
  "Recovery & Nutrition": [
    "recovery",
    "nutrition support",
    "critical care",
    "convalescence",
  ],
  "Veterinary Diet": [
    "veterinary diet",
    "vet diet",
    "prescription diet",
    "hypoallergy",
    "weight loss",
    "diabetes",
  ],
  grooming: ["grooming", "conditioner", "odor", "tick", "flea"],
  supplement: [
    "supplement",
    "vitamin",
    "probiotic",
    "joint",
    "digestive",
    "calcium",
  ],
  medicine: [
    "medicine",
    "medication",
    "tablet",
    "drops",
    "prescription",
    "heartworm",
    "flea",
    "tick",
    "deworm",
    "worm",
  ],
  toy: ["toy", "chew", "ball", "play", "puzzle", "enrichment"],
  accessory: [
    "collar",
    "leash",
    "belt",
    "bed",
    "bowl",
    "feeder",
    "scratching post",
    "scratch pad",
    "accessory",
  ],
};

const HEALTH_REQUIREMENTS = {
  diarrhea: [
    "age",
    "weight",
    "duration",
    "bloodInStool",
    "vomiting",
    "appetite",
    "waterIntake",
    "energyLevel",
  ],
  vomiting: [
    "age",
    "weight",
    "duration",
    "bloodInVomit",
    "frequency",
    "appetite",
    "waterIntake",
    "energyLevel",
  ],
  digestive: ["species", "age", "weight", "duration", "warningSigns"],
  "urinary difficulty": [
    "species",
    "age",
    "weight",
    "duration",
    "warningSigns",
  ],
  itching: [
    "duration",
    "skinBleeding",
    "appetite",
    "waterIntake",
    "energyLevel",
  ],
  anxiety: ["age", "weight", "duration", "warningSigns"],
  generic: ["species", "age", "weight", "duration", "warningSigns"],
};

const HEALTH_PRODUCT_HINTS = {
  diarrhea: {
    category: "supplement",
    productType: "probiotic",
    concern: "digestive",
  },
  vomiting: { category: "supplement", concern: "digestive" },
  digestive: {
    category: "supplement",
    productType: "probiotic",
    concern: "digestive",
  },
  "urinary difficulty": {
    category: "Kidney & Urinary Care",
    productType: "urinary care",
    concern: "urinary",
  },
  itching: { category: "grooming", productType: "shampoo", concern: "itching" },
};

const PRODUCT_TYPE_ALIASES = {
  food: [
    "food",
    "cat food",
    "dog food",
    "dry food",
    "wet food",
    "kibble",
    "meal",
    "diet",
    "veterinary diet",
    "vet diet",
    "prescription diet",
    "renal diet",
    "urinary diet",
    "hypoallergenic food",
  ],
  veterinary_diet: [
    "veterinary diet",
    "vet diet",
    "prescription diet",
    "renal diet",
    "urinary diet",
    "hypoallergy",
    "hpm",
  ],
  supplement: [
    "supplement",
    "support product",
    "kidney support",
    "joint supplement",
    "vitamin",
  ],
  tablet: ["tablet", "tablets"],
  chewable: ["chew", "chews", "chewable", "dental chew", "soft chew", "treat"],
  capsule: ["capsule", "capsules"],
  oral_suspension: [
    "oral suspension",
    "oral product",
    "oral support",
    "liquid",
    "oral liquid",
    "suspension",
    "syrup",
  ],
  syrup: ["syrup"],
  drops: ["drops"],
  spot_on: ["spot-on", "spot on", "pipette", "pipettes"],
  spray: ["spray"],
  shampoo: ["shampoo"],
  ear_cleaner: ["ear cleaner", "ear cleaning", "ear care"],
  eye_care: ["eye care", "eye drops", "eye cleaner"],
  dental_product: [
    "dental",
    "toothpaste",
    "toothbrush",
    "oral rinse",
    "water additive",
  ],
  collar: ["collar"],
  cream: ["cream"],
  ointment: ["ointment"],
  powder: ["powder"],
  paste: ["paste"],
  probiotic: ["probiotic", "gut health"],
};

const PRODUCT_TYPE_GROUPS = {
  food: new Set(["food", "veterinary_diet"]),
  veterinary_diet: new Set(["food", "veterinary_diet"]),
  oral_suspension: new Set(["oral_suspension", "syrup"]),
  syrup: new Set(["oral_suspension", "syrup"]),
  chewable: new Set(["chewable"]),
  shampoo: new Set(["shampoo"]),
  ear_cleaner: new Set(["ear_cleaner"]),
  dental_product: new Set(["dental_product", "chewable"]),
  collar: new Set(["collar"]),
  supplement: new Set([
    "supplement",
    "oral_suspension",
    "tablet",
    "capsule",
    "chewable",
    "powder",
    "paste",
    "probiotic",
  ]),
};

const ROUTINE_PRODUCT_CONTEXTS = [
  {
    pattern:
      /\b(shedding|shed|deshed|de-shed|loose coat|coat falling|hair fall|fur fall)\b/i,
    context: {
      category: "grooming",
      productType: "brush",
      concern: "shedding",
      searchTerms: [
        "deshedding brush",
        "dog grooming brush",
        "coat care shampoo",
        "grooming comb",
      ],
    },
  },
  {
    pattern:
      /\b(chewing|chew).*\b(furniture|shoes|sofa|couch|wood)\b|\bpuppy keeps chewing\b/i,
    context: {
      category: "toy",
      productType: "chew toy",
      concern: "chewing",
      searchTerms: ["puppy chew toy", "durable chew", "teething toy"],
    },
  },
  {
    pattern:
      /\b(cat|kitten).*\b(scratching|scratches).*\b(sofa|couch|furniture)\b|\bscratching post\b/i,
    context: {
      category: "accessory",
      productType: "scratching post",
      concern: "furniture scratching",
      searchTerms: ["cat scratching post", "scratch pad", "cat scratcher"],
    },
  },
  {
    pattern:
      /\b(eats?|eating).*\b(too fast|too quickly|quickly|fast)\b|\bslow feeder\b/i,
    context: {
      category: "accessory",
      productType: "slow feeder",
      concern: "fast eating",
      searchTerms: ["slow feeder bowl", "interactive feeder", "feeding bowl"],
    },
  },
  {
    pattern: /\b(bored|boredom|working|alone|enrichment|puzzle)\b/i,
    context: {
      category: "toy",
      productType: "puzzle toy",
      concern: "boredom",
      searchTerms: ["puzzle toy", "enrichment toy", "interactive toy"],
    },
  },
  {
    pattern: /\b(new puppy|adopted a puppy|puppy essentials|for my puppy)\b/i,
    context: {
      category: "accessory",
      productType: "puppy essentials",
      concern: "new puppy",
      searchTerms: ["puppy food", "puppy toy", "puppy bowl", "puppy bed"],
    },
  },
  {
    pattern:
      /\b(new kitten|adopted a kitten|kitten essentials|for my kitten)\b/i,
    context: {
      category: "accessory",
      productType: "kitten essentials",
      concern: "new kitten",
      searchTerms: ["kitten food", "cat toy", "kitten bowl", "cat bed"],
    },
  },
  {
    pattern: /\bsenior (dog|cat|pet)\b/i,
    context: {
      category: "supplement",
      productType: "senior",
      concern: "senior care",
      searchTerms: ["senior food", "joint supplement", "senior pet"],
    },
  },
  {
    pattern:
      /\b(anxiety|anxious|nervous|stress|stressed|calm|calming|loud noise|loud noises|fireworks|thunder|travel|car ride|journey)\b/i,
    context: {
      category: "Calming & Anxiety Support",
      productType: "calming support",
      concern: "anxiety and stress",
      searchTerms: ["calming", "anxiety", "stress", "travel", "pheromone"],
    },
  },
  {
    pattern: /\b(ear|ears|waxy|wax|ear cleaner|ear cleaning|dirty ears)\b/i,
    context: {
      category: "Ear Care",
      productType: "ear cleaner",
      concern: "routine ear cleaning",
      searchTerms: ["ear cleaner", "ear cleaning", "waxy ears"],
    },
  },
  {
    pattern:
      /\b(dental|teeth|tooth|toothpaste|oral care|oral hygiene|oral rinse|bad breath|breath)\b/i,
    context: {
      category: "Dental Care",
      productType: "dental care",
      concern: "regular dental hygiene",
      searchTerms: ["dental", "toothpaste", "oral care", "bad breath"],
    },
  },
  {
    pattern:
      /\b(itchy skin|sensitive skin|itching|scratch|scratching|allergy|allergies|rash|skin care|suitable shampoo)\b/i,
    context: {
      category: "Allergy & Itch Care",
      productType: "shampoo",
      concern: "itchy sensitive skin",
      searchTerms: [
        "itch",
        "itchy skin",
        "sensitive skin",
        "shampoo",
        "allergy",
      ],
    },
  },
];

const FIELD_TO_QUESTION_KEY = {
  species: "species",
  age: "age",
  weight: "weight",
  duration: "duration",
  bloodInStool: "blood_in_stool",
  bloodInVomit: "blood_in_vomit",
  vomiting: "vomiting",
  appetite: "appetite",
  waterIntake: "water_intake",
  energyLevel: "energy_level",
  warningSigns: "warning_signs",
  skinBleeding: "skin_bleeding",
  fleaTickExposure: "flea_tick_exposure",
  recentProductChange: "recent_product_change",
};

const QUESTION_KEY_TO_FIELD = Object.fromEntries(
  Object.entries(FIELD_TO_QUESTION_KEY).map(([field, key]) => [key, field]),
);

const COMBINED_QUESTION_FIELDS = {
  age_weight: ["age", "weight"],
  vomiting_blood_in_stool: ["vomiting", "bloodInStool"],
  appetite_water_intake: ["appetite", "waterIntake"],
  general_condition: ["appetite", "waterIntake", "energyLevel"],
  skin_context: ["fleaTickExposure", "recentProductChange"],
};

function getConversationId(input) {
  return input || `petgpt_${crypto.randomBytes(12).toString("hex")}`;
}

function getLocalConversation(conversationId) {
  const existing = conversations.get(conversationId);
  if (existing?.history) return existing;
  const next = {
    history: [],
    context: {},
    updatedAt: new Date().toISOString(),
  };
  conversations.set(conversationId, next);
  return next;
}

function rememberLocal(conversationId, role, content, metadata = {}) {
  const conversation = getLocalConversation(conversationId);
  conversation.history.push({
    role,
    content,
    metadata,
    createdAt: new Date().toISOString(),
  });
  conversation.history = conversation.history.slice(-MAX_HISTORY_MESSAGES);
  conversation.updatedAt = new Date().toISOString();
}

function setLocalContext(conversationId, context) {
  const conversation = getLocalConversation(conversationId);
  conversation.context = context;
  conversation.updatedAt = new Date().toISOString();
}

function hasAny(patterns, message) {
  return patterns.some((pattern) => pattern.test(message));
}

function isDirectShoppingRequest(message) {
  const lower = String(message || "").toLowerCase();
  if (!hasAny(DIRECT_SHOPPING_PATTERNS, lower)) return false;
  const explicitBrowseCommand =
    /\b(show me|show suitable|shop|browse|find)\b/i.test(lower) ||
    /\bproducts?\b/i.test(lower);
  if (
    /\b(can you help|what should i do|seems|has been|started|noticed|problem|issue|gets?|getting|scratching|itchy|sensitive|nervous|anxious|stressed)\b/i.test(
      lower,
    ) &&
    !explicitBrowseCommand
  ) {
    return false;
  }
  return true;
}

function isHealthOrWellnessProblem(message) {
  return (
    hasAny(HEALTH_PATTERNS, message) ||
    hasAny(BEHAVIOR_PATTERNS, message) ||
    /\b(bad breath|plaque|dirty ears|waxy|wax|sensitive skin|loud noises?|travel anxiety|car travel|nervous|anxious|stressed)\b/i.test(
      message,
    )
  );
}

function cleanText(value) {
  return String(value || "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokenize(message) {
  return String(message || "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter(
      (term) =>
        term.length > 2 &&
        ![
          "for",
          "the",
          "and",
          "with",
          "please",
          "show",
          "need",
          "want",
          "have",
          "buy",
          "give",
        ].includes(term),
    )
    .slice(0, 10);
}

function extractBudget(message) {
  const match = String(message || "").match(
    /\b(?:under|below|less than|max|maximum|budget|upto|up to|spend)\s*(?:rs\.?|inr|₹|\$)?\s*(\d+(?:,\d{3})*(?:\.\d{1,2})?)\s*(k|thousand)?/i,
  );
  if (!match) return null;
  const number = Number(match[1].replace(/,/g, ""));
  if (!Number.isFinite(number)) return null;
  return match[2] ? number * 1000 : number;
}

function extractAge(message) {
  const words = {
    one: 1,
    two: 2,
    three: 3,
    four: 4,
    five: 5,
    six: 6,
    seven: 7,
    eight: 8,
    nine: 9,
    ten: 10,
    eleven: 11,
    twelve: 12,
  };
  const match = String(message || "").match(
    /\b(\d+(?:\.\d+)?|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve)[-\s]*(month|months|year|years|yr|yrs|week|weeks)(?:[-\s]*old)?\b/i,
  );
  if (!match) return null;
  const amount = words[match[1].toLowerCase()] || match[1];
  const numericAmount = Number(amount);
  const rawUnit = match[2].toLowerCase();
  const baseUnit =
    rawUnit.startsWith("yr") || rawUnit.startsWith("year")
      ? "year"
      : rawUnit.startsWith("month")
        ? "month"
        : "week";
  const unit = numericAmount === 1 ? baseUnit : `${baseUnit}s`;
  return `${amount} ${unit}`;
}

function extractWeight(message) {
  const match = String(message || "").match(
    /\b(\d+(?:\.\d+)?)\s*(kg|kgs|kilo|kilos|kilogram|kilograms|lb|lbs|pound|pounds)\b/i,
  );
  if (!match) return null;
  const unit = /lb|pound/.test(match[2].toLowerCase()) ? "lb" : "kg";
  return `${match[1]} ${unit}`;
}

function extractPetName(message) {
  const direct = String(message || "").match(
    /\bmy\s+(?:dog|cat|pet)\s+is\s+([A-Z][a-zA-Z]{1,30})\b/i,
  );
  if (direct) return direct[1];
  const match = String(message || "").match(
    /\b(?:my pet|my dog|my cat|pet|dog|cat)?\s*(?:is named|named|name is|called)\s+([A-Z][a-zA-Z]{1,30})\b/,
  );
  if (match) return match[1];
  const possessive = String(message || "").match(
    /\b([A-Z][a-zA-Z]{1,30})\s+(?:is|has|was|keeps|started)\b/,
  );
  return possessive ? possessive[1] : null;
}

function extractSpecies(message) {
  const lower = String(message || "").toLowerCase();
  if (lower.includes("puppy")) return "dog";
  if (lower.includes("kitten")) return "cat";
  if (
    /\b(lab|labrador|golden retriever|german shepherd|beagle|husky|pug|bulldog|rottweiler|indie)\b/i.test(
      lower,
    )
  )
    return "dog";
  if (/\b(persian|siamese)\b/i.test(lower)) return "cat";
  return PET_TYPES.find((type) => lower.includes(type)) || null;
}

function extractBreed(message) {
  const match = String(message || "").match(
    /\b(lab|labrador|golden retriever|german shepherd|beagle|persian|siamese|husky|pug|bulldog|rottweiler|indie)\b/i,
  );
  if (!match) return null;
  return match[1].toLowerCase() === "lab" ? "Labrador" : match[1];
}

function extractGender(message) {
  const match = String(message || "").match(
    /\b(male|female|boy|girl|he|she)\b/i,
  );
  if (!match) return null;
  return ["male", "boy", "he"].includes(match[1].toLowerCase())
    ? "male"
    : "female";
}

function extractDuration(message) {
  const words = {
    one: 1,
    two: 2,
    three: 3,
    four: 4,
    five: 5,
    six: 6,
    seven: 7,
    eight: 8,
    nine: 9,
    ten: 10,
  };
  const direct = String(message || "").match(
    /\b(since yesterday|started yesterday|start(?:ed)? yesterday|today|last night)\b/i,
  );
  if (direct)
    return /start/i.test(direct[1])
      ? "since yesterday"
      : direct[1].toLowerCase();
  const match = String(message || "").match(
    /\b(?:for\s+)?(\d+|one|two|three|four|five|six|seven|eight|nine|ten)\s*(hour|hours|day|days|week|weeks)\b/i,
  );
  if (!match) return null;
  const amount = words[match[1].toLowerCase()] || match[1];
  return `${amount} ${match[2].toLowerCase()}`;
}

function extractBoolean(
  message,
  yesPatterns,
  noPatterns = [/\b(no|not|none|normal|drinking normally|eating normally)\b/i],
) {
  if (hasAny(noPatterns, message)) return false;
  if (hasAny(yesPatterns, message)) return true;
  return null;
}

function extractCategory(message) {
  const lower = String(message || "").toLowerCase();
  const deniesFleasTicks =
    /\b(no|not|without)\s+(fleas?|ticks?)\b|\b(no|not|without)\s+fleas?\s+or\s+ticks?\b/.test(
      lower,
    );
  if (
    /\b(veterinary diet|vet diet|prescription diet|renal diet|urinary diet|hypoallergenic veterinary food|hypoallergenic food)\b/.test(
      lower,
    )
  )
    return "Veterinary Diet";
  if (/\b(skin and coat|skin & coat|coat care)\b/.test(lower))
    return "Skin & Coat Care";
  if (
    /\b(allergy|allergies|itch|itchy|itching|sensitive skin|scratching|rash)\b/.test(
      lower,
    )
  )
    return "Allergy & Itch Care";
  if (/\b(ear|ears|ear cleaner|ear cleaning|waxy|wax)\b/.test(lower))
    return "Ear Care";
  if (
    /\b(dental|teeth|tooth|oral care|oral hygiene|oral rinse|bad breath|toothpaste)\b/.test(
      lower,
    )
  )
    return "Dental Care";
  if (
    /\b(urinary|urine|urinate|pee|kidney|bladder)\b/.test(lower) &&
    !/\b(food|diet|kibble|meal)\b/.test(lower)
  )
    return "Kidney & Urinary Care";
  if (
    !deniesFleasTicks &&
    /\b(flea|fleas|tick|ticks|spot-on|spot on)\b/.test(lower)
  )
    return "Flea & Tick Care";
  if (
    /\b(deworm|wormer|worming|worms|tapeworm|roundworm|hookworm)\b/.test(lower)
  )
    return "Deworming";
  if (
    /\b(joint|mobility|arthritis|senior dog joint|senior cat joint)\b/.test(
      lower,
    )
  )
    return "Joint & Mobility Care";
  if (/\b(probiotic|gut health|digestive supplement)\b/.test(lower))
    return "Probiotics & Gut Health";
  if (
    /\b(digestive support|gastro|gastrointestinal|stomach support)\b/.test(
      lower,
    )
  )
    return "Digestive Care";
  if (
    /\b(veterinary diet|vet diet|prescription diet|hypoallergy|weight loss|diabetes|food|kibble)\b/.test(
      lower,
    )
  )
    return "Veterinary Diet";
  if (/\b(recovery|nutrition support|convalescence)\b/.test(lower))
    return "Recovery & Nutrition";
  if (
    /\b(calm|calming|anxiety|anxious|stress|stressed|nervous|travel anxiety|loud noises)\b/.test(
      lower,
    )
  )
    return "Calming & Anxiety Support";
  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (keywords.some((keyword) => lower.includes(keyword))) return category;
  }
  return null;
}

function extractProductType(message) {
  const lower = String(message || "").toLowerCase();
  const deniesFleasTicks =
    /\b(no|not|without)\s+(fleas?|ticks?)\b|\b(no|not|without)\s+fleas?\s+or\s+ticks?\b/.test(
      lower,
    );
  if (
    /\b(veterinary diet|vet diet|prescription diet|renal diet|urinary diet|food|meal|kibble|dry food|wet food)\b/.test(
      lower,
    )
  )
    return "food";
  if (/\b(oral suspension|oral liquid|liquid|suspension|syrup)\b/.test(lower))
    return "oral suspension";
  if (
    /\boral\b.*\b(kidney|renal|support|product|supplement)\b|\b(kidney|renal|support|product|supplement)\b.*\boral\b/.test(
      lower,
    )
  )
    return "oral suspension";
  if (/\b(urinary|urinary-care|urine|urinate|pee|kidney|bladder)\b/.test(lower))
    return "urinary care";
  if (
    !deniesFleasTicks &&
    /\b(flea|fleas|tick|ticks|spot-on|spot on)\b/.test(lower)
  )
    return "flea and tick care";
  if (/\b(deworm|wormer|worming|worms)\b/.test(lower)) return "dewormer";
  if (/\b(joint|mobility|arthritis)\b/.test(lower)) return "joint supplement";
  if (
    /\b(veterinary diet|vet diet|prescription diet|hypoallergy|weight loss|diabetes)\b/.test(
      lower,
    )
  )
    return "food";
  if (
    /\b(calm|calming|anxiety|anxious|stress|stressed|nervous|pheromone)\b/.test(
      lower,
    )
  )
    return "calming support";
  if (/\b(ear cleaner|ear cleaning|dirty ears|waxy|wax|ear care)\b/.test(lower))
    return "ear cleaner";
  if (/\b(dry food|dry kibble|kibble)\b/.test(lower)) return "dry food";
  if (/\b(wet food)\b/.test(lower)) return "wet food";
  if (/\b(dental\s+chews?|soft\s+chews?|chewable|treat|treats)\b/.test(lower))
    return "chewable";
  if (
    /\b(dental|teeth|tooth|toothpaste|oral care|oral hygiene|oral rinse|bad breath)\b/.test(
      lower,
    )
  )
    return "dental care";
  if (/\b(deshed|de-shed|de shedding|shedding|brush)\b/.test(lower))
    return "brush";
  if (/\b(slow feeder|eats? too fast|eating too quickly)\b/.test(lower))
    return "slow feeder";
  if (/\b(scratching post|scratch pad|scratcher)\b/.test(lower))
    return "scratching post";
  if (/\b(chew|chewing|teething)\b/.test(lower)) return "chew toy";
  if (/\b(puzzle|enrichment|bored)\b/.test(lower)) return "puzzle toy";
  if (lower.includes("shampoo")) return "shampoo";
  if (lower.includes("probiotic")) return "probiotic";
  if (lower.includes("heartworm")) return "heartworm";
  if (!deniesFleasTicks && lower.includes("flea")) return "flea";
  if (!deniesFleasTicks && lower.includes("tick")) return "tick";
  if (lower.includes("deworm") || lower.includes("worm")) return "dewormer";
  return null;
}

function extractConcern(message) {
  const lower = String(message || "").toLowerCase();
  const deniesFleasTicks =
    /\b(no|not|without)\s+(fleas?|ticks?)\b|\b(no|not|without)\s+fleas?\s+or\s+ticks?\b/.test(
      lower,
    );
  if (
    /\b(urinary|urine|urinate|pee|peeing|wee|kidney|bladder|litter box|litter tray)\b/.test(
      lower,
    )
  )
    return "urinary";
  if (!deniesFleasTicks && /\b(flea|fleas|tick|ticks)\b/.test(lower))
    return "flea and tick";
  if (
    /\b(deworm|wormer|worming|worms|tapeworm|roundworm|hookworm)\b/.test(lower)
  )
    return "worms";
  if (/\b(joint|mobility|arthritis)\b/.test(lower)) return "joint mobility";
  if (
    /\b(anxiety|anxious|nervous|stress|stressed|calm|calming|loud noise|loud noises|fireworks|thunder|travel|car ride|journey)\b/.test(
      lower,
    )
  )
    return "anxiety and stress";
  if (/\b(ear|ears|waxy|wax|ear cleaner|ear cleaning|dirty ears)\b/.test(lower))
    return "routine ear cleaning";
  if (
    /\b(dental|teeth|tooth|toothpaste|oral care|oral hygiene|oral rinse|bad breath|breath)\b/.test(
      lower,
    )
  )
    return "regular dental hygiene";
  if (/\b(shedding|shed|loose coat|hair fall|fur fall)\b/.test(lower))
    return "shedding";
  if (/\b(chewing|chew).*\b(furniture|shoes|sofa|couch|wood)\b/.test(lower))
    return "chewing";
  if (/\b(scratching|scratches).*\b(sofa|couch|furniture)\b/.test(lower))
    return "furniture scratching";
  if (/\b(eats?|eating).*\b(too fast|too quickly|quickly|fast)\b/.test(lower))
    return "fast eating";
  if (/\b(bored|boredom|enrichment|puzzle)\b/.test(lower)) return "boredom";
  if (/\b(scratch|scratching|itch|itching)\b/.test(lower)) return "itching";
  if (/\bflea|fleas\b/.test(lower)) return "flea";
  if (/\btick|ticks\b/.test(lower)) return "tick";
  const concerns = [
    "dry skin",
    "sensitive skin",
    "itching",
    "odor",
    "digestive",
    "joint",
    "dental",
    "anxiety",
    "hairball",
    "weight",
    "allergy",
    "general grooming",
  ];
  return concerns.find((concern) => lower.includes(concern)) || null;
}

const HEALTH_DOMAIN_PATTERNS = [
  [
    "urinary",
    /\b(urinary|urine|urinate|urinating|pee|peeing|wee|litter box|litter tray|bladder|kidney|few drops|only drops|small amount comes out|straining)\b/i,
  ],
  [
    "digestive",
    /\b(vomit|vomiting|diarrhea|diarrhoea|loose stool|loose motion|poop|stool|digestive|stomach upset)\b/i,
  ],
  [
    "skin",
    /\b(skin|scratch|scratching|itch|itching|rash|coat|fur|hair loss|redness)\b/i,
  ],
  ["ear", /\b(ear|ears|waxy|wax|ear smell|ear smells|ear cleaner)\b/i],
  ["eye", /\b(eye|eyes|red eye|discharge|squinting)\b/i],
  ["dental", /\b(dental|teeth|tooth|bad breath|oral|gum)\b/i],
  ["respiratory", /\b(breathe|breathing|cough|sneeze|wheeze|chok)\b/i],
  [
    "neurologic",
    /\b(seizure|seizures|collapse|collapsed|unresponsive|tremor)\b/i,
  ],
  [
    "systemic",
    /\b(pale gums|white gums|gum looks white|gums look white|letharg|temperature|fever)\b/i,
  ],
  [
    "mobility",
    /\b(limp|limping|won't put weight|wont put weight|leg|joint)\b/i,
  ],
  ["injury", /\b(wound|injur|bleeding|cut|swollen)\b/i],
  ["poisoning", /\b(poison|toxic|rat poison|ate something poisonous)\b/i],
  ["appetite", /\b(not eating|no appetite|refusing food|appetite)\b/i],
  [
    "behavior",
    /\b(anxiety|anxious|barking|biting|aggressive|behavior|behaviour)\b/i,
  ],
  ["parasites", /\b(flea|fleas|tick|ticks|worm|worms)\b/i],
];

function extractHealthDomain(message, symptoms = []) {
  const lower = String(message || "").toLowerCase();
  const matched = HEALTH_DOMAIN_PATTERNS.find(([, pattern]) =>
    pattern.test(lower),
  );
  if (matched) return matched[0];
  if (symptoms.includes("digestive")) return "digestive";
  if (symptoms.includes("diarrhea") || symptoms.includes("vomiting"))
    return "digestive";
  if (symptoms.includes("itching")) return "skin";
  if (symptoms.includes("anxiety")) return "behavior";
  if (symptoms.length) return "general illness";
  return null;
}

function isGeneralHealthInfoQuestion(message) {
  const lower = String(message || "").toLowerCase();
  return (
    /\b(what are|what is|common signs|signs of|symptoms of|can (?:dogs|cats|pets)|do (?:dogs|cats|pets)|tell me about|learn about)\b/i.test(
      lower,
    ) &&
    !/\b(my|his|her|our)\s+(dog|cat|pet|puppy|kitten|labrador)\b/i.test(lower)
  );
}

function isReportedPetProblem(message) {
  const lower = String(message || "").toLowerCase();
  if (isDirectShoppingRequest(message) || isGeneralHealthInfoQuestion(message))
    return false;
  return (
    /\b(my|his|her|our)\s+(dog|cat|pet|puppy|kitten|labrador)\b/i.test(lower) ||
    /\b(keeps|trying|straining|cannot|can't|cant|hasn't been able|has not been able|only|few drops|small amount|crying|won't|wont|is|has|seems)\b/i.test(
      lower,
    )
  );
}

function hasCatUrinaryObstructionSignal(message, pet = {}) {
  const lower = String(message || "").toLowerCase();
  const species = pet.species || extractSpecies(message);
  if (species !== "cat" || !isReportedPetProblem(message)) return false;
  const urinary =
    /\b(urinate|urinating|urine|urinary|pee|peeing|wee|litter box|litter tray)\b/i.test(
      lower,
    );
  const attemptsOrStraining =
    /\b(keeps trying|trying to|straining|keeps going|repeatedly|frequent|squatting|sits in the litter|going to the litter)\b/i.test(
      lower,
    );
  const lowOrNoOutput =
    /\b(small amount|very little|little urine|only drops|few drops|nothing comes out|almost nothing|cannot|can't|cant|hasn't been able|has not been able|not able)\b/i.test(
      lower,
    );
  const pain = /\b(crying|cries|pain|painful|yowling|distress)\b/i.test(lower);
  return (
    urinary &&
    ((attemptsOrStraining && lowOrNoOutput) ||
      (attemptsOrStraining && pain) ||
      lowOrNoOutput)
  );
}

function splitHealthClauses(message) {
  return String(message || "")
    .toLowerCase()
    .split(/(?:[.;!?]|\n)+/)
    .map((part) => part.trim())
    .filter(Boolean);
}

function hasNegation(clause) {
  return /\b(no|not|none|never|without|haven't|havent|hasn't|hasnt|don't|dont|doesn't|doesnt|isn't|isnt|aren't|arent)\b/i.test(
    clause,
  );
}

function hasAffirmedPattern(message, pattern, allowedNegatedPattern = null) {
  return splitHealthClauses(message).some((clause) => {
    if (!pattern.test(clause)) return false;
    if (allowedNegatedPattern?.test(clause)) return true;
    return !hasNegation(clause);
  });
}

function hasDeniedPattern(message, pattern) {
  return splitHealthClauses(message).some(
    (clause) => pattern.test(clause) && hasNegation(clause),
  );
}

function extractDeniedSymptoms(message) {
  const denied = [];
  const checks = [
    ["swelling", /\b(swelling|swollen)\b/i],
    ["vomiting", /\b(vomit|vomiting|vomited|throwing up|threw up)\b/i],
    ["blood", /\b(blood|bloody|bleeding)\b/i],
    ["weakness", /\b(weak|letharg|low energy|very tired|collapsed)\b/i],
    [
      "hair loss",
      /\b(hair loss|bald patch|bald patches|patches of hair loss)\b/i,
    ],
    ["discharge", /\b(discharge|pus|oozing)\b/i],
    [
      "difficulty breathing",
      /\b(trouble breathing|difficulty breathing|struggling to breathe|breathing difficulty)\b/i,
    ],
    [
      "open sores",
      /\b(open sore|open sores|wound|wounds|raw skin|skin lesion|skin lesions)\b/i,
    ],
    ["scabs", /\b(scab|scabs)\b/i],
  ];
  checks.forEach(([label, pattern]) => {
    if (hasDeniedPattern(message, pattern)) denied.push(label);
  });
  return [...new Set(denied)];
}

function extractRoutineProductContext(message) {
  const matched = ROUTINE_PRODUCT_CONTEXTS.find((item) =>
    item.pattern.test(message),
  );
  return matched ? { ...matched.context } : {};
}

function extractSymptoms(message) {
  const lower = String(message || "").toLowerCase();
  const symptoms = [];
  if (
    /\b(diarrhea|diarrhoea|loose motion|loose motions|loose stool|watery stool|soft stool|watery poop|runny poop)\b/.test(
      lower,
    )
  )
    symptoms.push("diarrhea");
  if (
    hasAffirmedPattern(
      message,
      /\b(vomit|vomiting|vomited|throwing up|threw up)\b/i,
    )
  )
    symptoms.push("vomiting");
  if (/\b(digestive|stomach upset)\b/.test(lower)) symptoms.push("digestive");
  if (
    /\b(urinate|urinating|pee|peeing|wee|litter box|litter tray|few drops|only drops|small amount|straining|can't pee|cant pee|cannot pee|can't urinate|cant urinate|cannot urinate)\b/.test(
      lower,
    )
  ) {
    symptoms.push("urinary difficulty");
  }
  if (
    /\b(blood in stool|bloody stool|blood in poop)\b/.test(lower) &&
    !/\b(no blood|without blood|no blood in stool)\b/.test(lower)
  )
    symptoms.push("blood in stool");
  if (
    /\b(vomiting blood|blood in vomit)\b/.test(lower) &&
    !/\b(no blood|without blood|no blood in vomit)\b/.test(lower)
  )
    symptoms.push("blood in vomit");
  if (
    hasAffirmedPattern(
      message,
      /\b(chok|can't breathe|cant breathe|difficulty breathing|trouble breathing|struggling to breathe)\b/i,
      /\b(can't breathe|cant breathe)\b/i,
    )
  )
    symptoms.push("breathing distress");
  if (/\b(swallowed|ate something|foreign body|object)\b/.test(lower))
    symptoms.push("possible foreign-body ingestion");
  if (/\b(scratch|scratching|itch|itching|rash|skin)\b/.test(lower))
    symptoms.push("itching");
  if (
    /\b(anxiety|anxious|nervous|stress|stressed|calm|calming|loud noise|loud noises|fireworks|thunder|travel|car ride|journey)\b/.test(
      lower,
    )
  )
    symptoms.push("anxiety");
  if (/\b(not eating|refusing food|no appetite)\b/.test(lower))
    symptoms.push("reduced appetite");
  if (hasAffirmedPattern(message, /\b(weak|letharg|collapse|collapsed)\b/i))
    symptoms.push("weakness");
  if (
    hasAffirmedPattern(
      message,
      /\b(pale gums|white gums|gum looks white|gums look white|persistently white|persistently pale)\b/i,
    )
  )
    symptoms.push("pale gums");
  if (/\b(seizure|seizures)\b/.test(lower)) symptoms.push("seizure");
  return [...new Set(symptoms)];
}

function hasEmergencySignal(message) {
  const lower = String(message || "").toLowerCase();
  if (hasCatUrinaryObstructionSignal(message)) return true;
  if (
    hasAffirmedPattern(
      message,
      /\b(chok|can't breathe|cant breathe|difficulty breathing|trouble breathing|struggling to breathe|struggle to breathe|breathing difficulty|collapse|collapsed|unresponsive|seizure|seizures|poison|poisonous|toxic|rat poison|swallowed something|foreign body|object stuck|severe bleeding)\b/i,
      /\b(can't breathe|cant breathe|not breathing)\b/i,
    )
  ) {
    return true;
  }
  return hasAffirmedPattern(
    message,
    /\b(vomiting blood|blood in vomit|blood in (his |her |the )?stool|bloody stool|black stool|significant bleeding|severe bleeding)\b/i,
  );
}

function hasHighRiskSignal(message) {
  const seriousSkin = hasAffirmedPattern(
    message,
    /\b(bleeding|blood|bloody|open sore|open sores|raw skin|skin lesion|skin lesions|pus|oozing|severe swelling|face swollen|facial swelling)\b/i,
  );
  const weak = hasAffirmedPattern(
    message,
    /\b(very weak|severe weakness|weak|letharg|collapsed|severe pain)\b/i,
  );
  const water =
    hasAffirmedPattern(
      message,
      /\b(refusing water|not drinking|dehydrated)\b/i,
      /\b(refusing water|not drinking)\b/i,
    ) &&
    !/\b(drinking normally|drinking fine|normal water|eating and drinking normally)\b/i.test(
      message,
    );
  const vomiting = hasAffirmedPattern(
    message,
    /\b(repeated vomiting|severe vomiting|vomiting repeatedly|keeps vomiting|can't keep water down|cant keep water down)\b/i,
  );
  const worsening = hasAffirmedPattern(
    message,
    /\b(worsening rapidly|rapidly spreading|getting much worse)\b/i,
  );
  const paleGums = hasAffirmedPattern(
    message,
    /\b(pale gums|white gums|gum looks white|gums look white|persistently white|persistently pale)\b/i,
  );
  return seriousSkin || weak || water || vomiting || worsening || paleGums;
}

function classifyIntent(message, previousIntent) {
  if (hasAny(GREETING_PATTERNS, message)) return INTENTS.GENERAL_CONVERSATION;
  if (hasAny(ORDER_PATTERNS, message)) return INTENTS.ORDER_QUESTION;
  if (hasEmergencySignal(message)) return INTENTS.EMERGENCY_HEALTH;
  const routineContext = extractRoutineProductContext(message);
  const directShopping = isDirectShoppingRequest(message);
  const healthDomain = extractHealthDomain(message);
  if (
    directShopping &&
    healthDomain === "urinary" &&
    (extractCategory(message) || extractProductType(message))
  )
    return INTENTS.PRODUCT_RECOMMENDATION;
  if (healthDomain && isGeneralHealthInfoQuestion(message))
    return INTENTS.HEALTH_QUESTION;
  if (hasAny(MEDICATION_PATTERNS, message)) return INTENTS.MEDICATION_QUESTION;
  if (healthDomain === "behavior" && isReportedPetProblem(message))
    return INTENTS.BEHAVIOR;
  if (healthDomain && isReportedPetProblem(message))
    return INTENTS.SYMPTOM_HEALTH;
  if (
    directShopping &&
    (routineContext.category ||
      routineContext.productType ||
      routineContext.concern)
  )
    return INTENTS.PRODUCT_RECOMMENDATION;
  if (hasAny(VACCINATION_PATTERNS, message)) return INTENTS.VACCINATION;
  if (isHealthOrWellnessProblem(message) && !directShopping) {
    if (hasAny(BEHAVIOR_PATTERNS, message)) return INTENTS.BEHAVIOR;
    return INTENTS.SYMPTOM_HEALTH;
  }
  if (hasAny(GROOMING_PATTERNS, message) && directShopping)
    return INTENTS.PRODUCT_RECOMMENDATION;
  if (
    hasAny(HEALTH_PATTERNS, message) ||
    /\b(energy|appetite|drinking|eating)\b/i.test(message)
  )
    return INTENTS.SYMPTOM_HEALTH;
  if (hasAny(FOOD_PATTERNS, message))
    return hasAny(PRODUCT_PATTERNS, message)
      ? INTENTS.FOOD_NUTRITION
      : INTENTS.FOOD_NUTRITION;
  if (hasAny(GROOMING_PATTERNS, message))
    return directShopping ? INTENTS.PRODUCT_RECOMMENDATION : INTENTS.GROOMING;
  if (hasAny(BEHAVIOR_PATTERNS, message)) return INTENTS.BEHAVIOR;
  if (
    directShopping &&
    (extractCategory(message) ||
      extractProductType(message) ||
      extractSpecies(message) ||
      extractBreed(message))
  )
    return INTENTS.PRODUCT_RECOMMENDATION;
  if (/\b(price of|tell me about|available|availability)\b/i.test(message))
    return INTENTS.PRODUCT_INFORMATION;
  if (
    [
      INTENTS.SYMPTOM_HEALTH,
      INTENTS.EMERGENCY_HEALTH,
      INTENTS.PRODUCT_RECOMMENDATION,
      INTENTS.FOOD_NUTRITION,
    ].includes(previousIntent)
  ) {
    return previousIntent;
  }
  if (healthDomain)
    return isGeneralHealthInfoQuestion(message)
      ? INTENTS.HEALTH_QUESTION
      : INTENTS.SYMPTOM_HEALTH;
  return INTENTS.UNKNOWN;
}

function extractPetInfo(message) {
  return {
    name: extractPetName(message),
    species: extractSpecies(message),
    breed: extractBreed(message),
    age: extractAge(message),
    weight: extractWeight(message),
    gender: extractGender(message),
    neuteredSpayed: extractBoolean(message, [/\b(neutered|spayed)\b/i]),
  };
}

function extractHealthDetails(message) {
  return {
    duration: extractDuration(message),
    frequency:
      String(message || "").match(
        /\b(\d+\s*(?:times|x)|once|twice|three times|four times)\b/i,
      )?.[0] || null,
    bloodInStool: extractBoolean(
      message,
      [/\b(blood in stool|bloody stool|blood in poop)\b/i],
      [/\b(no blood|without blood|no blood in stool|no bloody stool)\b/i],
    ),
    bloodInVomit: extractBoolean(message, [
      /\b(vomiting blood|blood in vomit)\b/i,
    ]),
    vomiting: extractBoolean(
      message,
      [/\b(vomit|vomiting|vomited|throwing up|threw up)\b/i],
      [
        /\b(no vomiting|not vomiting|isn't vomiting|isnt vomiting|doesn't vomit|doesnt vomit|without vomiting)\b/i,
      ],
    ),
    appetite: extractBoolean(
      message,
      [
        /\b(eating and drinking normally|eating normally|eating fine|appetite normal|good appetite|normal appetite|no appetite problems?|food intake is normal)\b/i,
      ],
      [
        /\b(not eating|refusing food|no appetite|hasn't been eating much|has not been eating much|doesn't seem interested in food|not interested in food)\b/i,
      ],
    ),
    waterIntake: extractBoolean(
      message,
      [
        /\b(eating and drinking normally|drinking normally|drinking fine|water intake normal|drinks water|normal water)\b/i,
      ],
      [/\b(not drinking|refusing water|no water)\b/i],
    ),
    energyLevel: extractBoolean(
      message,
      [
        /\b(active|very active|energetic|lots of energy|normal energy|good energy|behaving normally|acting normally|energy level(?: is|:)?\s*(?:normal|good)|energy is normal|his energy is good|her energy is good|playful)\b/i,
      ],
      [
        /\b(weak|letharg|low energy|collapsed|very weak|energy level(?: is|:)?\s*(?:low|very weak))\b/i,
      ],
    ),
    skinBleeding: extractBoolean(
      message,
      [
        /\b(bleeding|open wound|open wounds|open sore|open sores|raw skin|skin lesion|skin lesions|oozing|pus|scab|scabs)\b/i,
      ],
      [
        /\b(no|not|none|without|haven't|havent|hasn't|hasnt|don't|dont|doesn't|doesnt|isn't|isnt)\b/i,
      ],
    ),
    fleaTickExposure: extractBoolean(message, [/\b(flea|tick)\b/i]),
    recentProductChange: extractBoolean(message, [
      /\b(new shampoo|new food|changed food|diet change|new product)\b/i,
    ]),
    warningSigns:
      hasHighRiskSignal(message) || hasEmergencySignal(message)
        ? true
        : extractBoolean(
            message,
            [],
            [
              /\b(no blood|no vomiting|not weak|drinking normally|eating normally|normal energy|none)\b/i,
            ],
          ),
    possibleUrinaryObstruction: hasCatUrinaryObstructionSignal(message)
      ? true
      : null,
    deniedSymptoms: extractDeniedSymptoms(message),
  };
}

function isUnknownAnswer(message) {
  return /\b(i don't know|i dont know|don't know|dont know|not sure|unsure|no idea)\b/i.test(
    message,
  );
}

function extractUnknownFields(message, previousContext = {}) {
  if (!isUnknownAnswer(message)) return [];
  const lower = String(message || "").toLowerCase();
  const explicit = [];
  if (/\b(weight|weigh)\b/.test(lower)) explicit.push("weight");
  if (/\b(age|old)\b/.test(lower)) explicit.push("age");
  if (/\b(breed)\b/.test(lower)) explicit.push("breed");
  if (/\b(duration|how long|since)\b/.test(lower)) explicit.push("duration");
  if (/\b(energy)\b/.test(lower)) explicit.push("energyLevel");
  if (explicit.length) return explicit;

  const currentFields = fieldsForQuestionKey(
    previousContext.questionState?.currentQuestionKey,
  );
  return currentFields.length
    ? currentFields
    : missingHealthInfo(previousContext).slice(0, 1);
}

function extractPendingHealthAnswer(message, previousContext = {}) {
  const currentQuestionKey = previousContext.questionState?.currentQuestionKey;
  if (currentQuestionKey === "general_condition") {
    const lower = String(message || "").toLowerCase();
    if (
      /\b(yes|normal|everything else is normal|otherwise normal|eating.*drinking.*normal|acting normally|behaving normally|fine|okay|ok)\b/.test(
        lower,
      )
    ) {
      return { appetite: true, waterIntake: true, energyLevel: true };
    }
    if (/\b(not eating|no appetite|refusing food)\b/.test(lower))
      return { appetite: false };
    if (/\b(not drinking|refusing water|no water)\b/.test(lower))
      return { waterIntake: false };
    if (
      /\b(weak|lethargic|low energy|not behaving normally|very tired)\b/.test(
        lower,
      )
    )
      return { energyLevel: false };
  }

  const pendingField =
    fieldsForQuestionKey(currentQuestionKey)[0] ||
    missingHealthInfo(previousContext)[0];
  if (!pendingField) return {};
  const lower = String(message || "").toLowerCase();

  if (pendingField === "energyLevel") {
    if (/\b(normal|active|energetic|good|playful|fine|okay|ok)\b/.test(lower))
      return { energyLevel: true };
    if (
      /\b(little low|low|weak|very weak|lethargic|tired|collapsed)\b/.test(
        lower,
      )
    )
      return { energyLevel: false };
  }

  if (pendingField === "appetite") {
    if (/\b(eating|appetite normal|normal|yes|fine|okay|ok)\b/.test(lower))
      return { appetite: true };
    if (/\b(not eating|refusing food|no appetite|no)\b/.test(lower))
      return { appetite: false };
  }

  if (pendingField === "waterIntake") {
    if (/\b(drinking|water normal|normal|yes|fine|okay|ok)\b/.test(lower))
      return { waterIntake: true };
    if (/\b(not drinking|refusing water|no water|no)\b/.test(lower))
      return { waterIntake: false };
  }

  if (pendingField === "vomiting") {
    if (/\b(vomit|vomiting|yes)\b/.test(lower)) return { vomiting: true };
    if (/\b(no|not vomiting|only loose stool)\b/.test(lower))
      return { vomiting: false };
  }

  if (pendingField === "bloodInStool") {
    if (
      /\b(blood|bloody|yes)\b/.test(lower) &&
      !/\b(no blood|without blood)\b/.test(lower)
    )
      return { bloodInStool: true };
    if (/\b(no|no blood|without blood)\b/.test(lower))
      return { bloodInStool: false };
  }

  if (pendingField === "bloodInVomit") {
    if (
      /\b(blood|bloody|yes)\b/.test(lower) &&
      !/\b(no blood|without blood)\b/.test(lower)
    )
      return { bloodInVomit: true };
    if (/\b(no|no blood|without blood)\b/.test(lower))
      return { bloodInVomit: false };
  }

  if (pendingField === "warningSigns") {
    if (/\b(no|none|normal|no blood|not vomiting|not weak)\b/.test(lower))
      return { warningSigns: false };
    if (hasHighRiskSignal(message) || hasEmergencySignal(message))
      return { warningSigns: true };
  }

  return {};
}

function compactObject(object) {
  return Object.fromEntries(
    Object.entries(object || {}).filter(
      ([, value]) => value !== null && value !== undefined && value !== "",
    ),
  );
}

function mergePet(previous = {}, next = {}) {
  return { ...previous, ...compactObject(next) };
}

function mergeHealth(previous = {}, next = {}) {
  const compactNext = compactObject(next);
  const deniedSymptoms = [
    ...(Array.isArray(previous.deniedSymptoms) ? previous.deniedSymptoms : []),
    ...(Array.isArray(compactNext.deniedSymptoms)
      ? compactNext.deniedSymptoms
      : []),
  ];
  const merged = { ...previous, ...compactNext };
  if (deniedSymptoms.length)
    merged.deniedSymptoms = [...new Set(deniedSymptoms)];
  return merged;
}

function classifyRisk({
  message,
  intent,
  pet = {},
  health = {},
  symptoms = [],
}) {
  const lower = String(message || "").toLowerCase();
  const hasEmergency =
    intent === INTENTS.EMERGENCY_HEALTH || hasEmergencySignal(message);
  if (hasEmergency) {
    const urinaryObstruction =
      hasCatUrinaryObstructionSignal(message, pet) ||
      health.possibleUrinaryObstruction === true;
    return {
      riskLevel: RISK_LEVELS.EMERGENCY,
      shouldRecommendVet: true,
      vetUrgency: "EMERGENCY",
      reason: urinaryObstruction
        ? "Possible urinary obstruction reported"
        : symptoms.includes("breathing distress")
          ? "Breathing distress or choking reported"
          : "Emergency warning sign reported",
      emergencyReason: urinaryObstruction
        ? "possible_urinary_obstruction"
        : "emergency_warning_sign",
    };
  }

  const persistentUrgentContext =
    symptoms.includes("pale gums") ||
    health.bloodInStool === true ||
    health.bloodInVomit === true ||
    health.energyLevel === false ||
    health.waterIntake === false;
  if (persistentUrgentContext) {
    return {
      riskLevel: RISK_LEVELS.HIGH,
      shouldRecommendVet: true,
      vetUrgency: "URGENT",
      reason:
        health.bloodInStool || health.bloodInVomit
          ? "Blood was reported"
          : symptoms.includes("pale gums")
            ? "Pale or white gums reported"
            : "High-risk symptom or vulnerable pet reported",
    };
  }

  if (
    isDirectShoppingRequest(message) ||
    intent === INTENTS.HEALTH_QUESTION ||
    isGeneralHealthInfoQuestion(message)
  ) {
    return {
      riskLevel: RISK_LEVELS.LOW,
      shouldRecommendVet: false,
      vetUrgency: null,
      reason: null,
    };
  }

  const healthContext = HEALTH_INTENTS.has(intent) || symptoms.length > 0;
  const youngHighRisk =
    ["puppy", "kitten"].some((term) => lower.includes(term)) &&
    symptoms.length > 0;
  const highRisk =
    healthContext &&
    (hasHighRiskSignal(message) ||
      health.bloodInStool === true ||
      health.bloodInVomit === true ||
      health.energyLevel === false ||
      health.waterIntake === false ||
      youngHighRisk);
  if (highRisk) {
    return {
      riskLevel: RISK_LEVELS.HIGH,
      shouldRecommendVet: true,
      vetUrgency: "URGENT",
      reason:
        health.bloodInStool || health.bloodInVomit
          ? "Blood was reported"
          : "High-risk symptom or vulnerable pet reported",
    };
  }

  if (primarySymptom(symptoms) === "itching" && !highRisk) {
    return {
      riskLevel: RISK_LEVELS.LOW,
      shouldRecommendVet: false,
      vetUrgency: null,
      reason: null,
    };
  }

  if (healthContext) {
    const hasSomeContext = Boolean(pet.age || pet.weight || health.duration);
    return {
      riskLevel: hasSomeContext ? RISK_LEVELS.LOW : RISK_LEVELS.MEDIUM,
      shouldRecommendVet: false,
      vetUrgency: null,
      reason: null,
    };
  }

  return {
    riskLevel: RISK_LEVELS.LOW,
    shouldRecommendVet: false,
    vetUrgency: null,
    reason: null,
  };
}

function normalizedSafetyResult(safety = {}) {
  const riskMap = {
    [RISK_LEVELS.LOW]: "routine",
    [RISK_LEVELS.MEDIUM]: "monitor",
    [RISK_LEVELS.HIGH]: "urgent",
    [RISK_LEVELS.EMERGENCY]: "emergency",
  };
  const normalizedRiskLevel = riskMap[safety.riskLevel] || "routine";
  const emergency = normalizedRiskLevel === "emergency";
  const requiresUrgentVet = emergency || normalizedRiskLevel === "urgent";
  return {
    riskLevel: normalizedRiskLevel,
    legacyRiskLevel: safety.riskLevel || RISK_LEVELS.LOW,
    emergency,
    requiresUrgentVet,
    productRecommendationAllowed: !requiresUrgentVet,
    reason: safety.reason || null,
    emergencyReason: safety.emergencyReason || null,
  };
}

function primarySymptom(symptoms = []) {
  if (symptoms.includes("diarrhea")) return "diarrhea";
  if (symptoms.includes("vomiting")) return "vomiting";
  if (symptoms.includes("digestive")) return "digestive";
  if (symptoms.includes("urinary difficulty")) return "urinary difficulty";
  if (symptoms.includes("itching")) return "itching";
  if (symptoms.includes("anxiety")) return "anxiety";
  return symptoms[0] || "generic";
}

function questionKeyForField(field) {
  return FIELD_TO_QUESTION_KEY[field] || field;
}

function fieldForQuestionKey(key) {
  return QUESTION_KEY_TO_FIELD[key] || key;
}

function fieldsForQuestionKey(key) {
  if (!key) return [];
  return COMBINED_QUESTION_FIELDS[key] || [fieldForQuestionKey(key)];
}

function hasFieldAnswer(context, field) {
  const key = questionKeyForField(field);
  const answer = context.questionState?.answers?.[key];
  if (
    answer?.status === "answered" ||
    answer?.status === "unknown" ||
    answer?.status === "not_applicable"
  )
    return true;
  if (["age", "weight", "species", "breed", "gender"].includes(field)) {
    return (
      context.pet?.[field] !== undefined &&
      context.pet?.[field] !== null &&
      context.pet?.[field] !== ""
    );
  }
  return (
    context.health?.[field] !== undefined && context.health?.[field] !== null
  );
}

function answerValueForField(context, field) {
  if (["age", "weight", "species", "breed", "gender"].includes(field))
    return context.pet?.[field];
  return context.health?.[field];
}

function normalizeAnswerValue(value, field) {
  if (value === true) {
    if (field === "energyLevel") return "normal";
    return true;
  }
  if (value === false) return false;
  return value;
}

function reconcileQuestionState(
  previousContext = {},
  context = {},
  options = {},
) {
  const previous = previousContext.questionState || {};
  const answers = { ...(previous.answers || {}) };
  const askedSet = new Set(previous.askedQuestions || []);
  const answeredSet = new Set(previous.answeredQuestions || []);
  const unknownSet = new Set(previous.unknownQuestions || []);
  const history = [...(previous.questionHistory || [])];

  extractUnknownFields(options.message, previousContext).forEach((field) => {
    const key = questionKeyForField(field);
    answers[key] = {
      value: null,
      status: "unknown",
      answeredAt: new Date().toISOString(),
    };
    answeredSet.add(key);
    unknownSet.add(key);
    const index = history.findLastIndex?.((item) => item.key === key) ?? -1;
    if (index >= 0)
      history[index] = {
        ...history[index],
        answer: null,
        status: "unknown",
        answeredAt: answers[key].answeredAt,
      };
  });

  [...Object.keys(FIELD_TO_QUESTION_KEY), "breed", "gender"].forEach(
    (field) => {
      const value = answerValueForField(context, field);
      if (value === undefined || value === null || value === "") return;
      const key = questionKeyForField(field);
      const normalized = normalizeAnswerValue(value, field);
      answers[key] = {
        value: normalized,
        status: "answered",
        answeredAt: new Date().toISOString(),
      };
      answeredSet.add(key);
      unknownSet.delete(key);
      const index = history.findLastIndex?.((item) => item.key === key) ?? -1;
      if (index >= 0)
        history[index] = {
          ...history[index],
          answer: normalized,
          status: "answered",
          answeredAt: answers[key].answeredAt,
        };
    },
  );

  return {
    answers,
    askedQuestions: [...askedSet],
    answeredQuestions: [...answeredSet],
    unknownQuestions: [...unknownSet],
    questionHistory: history.slice(-50),
    currentQuestionKey: previous.currentQuestionKey || null,
    lastQuestionKeys: previous.lastQuestionKeys || [],
  };
}

function missingHealthInfo(context) {
  const symptom = primarySymptom(context.symptoms);
  const required = HEALTH_REQUIREMENTS[symptom] || HEALTH_REQUIREMENTS.generic;
  return required.filter((field) => {
    return !hasFieldAnswer(context, field);
  });
}

function questionTextForKey(key, context) {
  const missing = missingHealthInfo(context);
  const petLabel = context.pet?.breed || context.pet?.species || "pet";
  if (key === "age_weight")
    return `I'm sorry your ${petLabel} is not feeling well. How old is your ${petLabel}, and approximately how much does your ${petLabel} weigh?`;
  if (key === "species")
    return "I can help you think through this safely. Is this for a dog, cat, or another pet?";
  if (key === "duration" && primarySymptom(context.symptoms) === "itching")
    return "I can help you work through that. How long has the itching been happening?";
  if (key === "duration") return "How long has this been happening?";
  if (key === "vomiting_blood_in_stool")
    return `Is your ${petLabel} vomiting or passing blood in the stool?`;
  if (key === "blood_in_vomit")
    return `Have you noticed any blood in the vomit?`;
  if (key === "vomiting")
    return `Is your ${petLabel} vomiting too, or is it only loose stool?`;
  if (key === "appetite_water_intake")
    return `Is your ${petLabel} eating and drinking normally?`;
  if (key === "appetite") return `Is your ${petLabel} eating normally?`;
  if (key === "water_intake")
    return `Is your ${petLabel} drinking water normally?`;
  if (key === "energy_level")
    return `How is your ${petLabel}'s energy level: normal, a little low, or very weak?`;
  if (key === "warning_signs")
    return `Have you noticed any blood, repeated vomiting, severe weakness, or refusal to drink water?`;
  if (key === "skin_bleeding")
    return "Have you noticed redness, hair loss, wounds, swelling, fleas/ticks, or an unusual smell?";
  if (key === "general_condition")
    return `Is your ${petLabel} otherwise eating, drinking and behaving normally?`;
  if (key === "skin_context")
    return `Have you noticed fleas/ticks, or did you recently change food, shampoo, bedding, or any skin product?`;
  if (missing.length) {
    const field = missing[0];
    if (field === "age") return `How old is your ${petLabel}?`;
    if (field === "weight")
      return `About how much does your ${petLabel} weigh?`;
  }
  return null;
}

function selectNextHealthQuestion(context) {
  const missing = missingHealthInfo(context);
  const asked = new Set(context.questionState?.askedQuestions || []);
  const recent = new Set(context.questionState?.lastQuestionKeys || []);
  const candidates = [
    missing.includes("species")
      ? { key: "species", fields: ["species"] }
      : null,
    missing.includes("age") && missing.includes("weight")
      ? { key: "age_weight", fields: ["age", "weight"] }
      : null,
    missing.includes("age") ? { key: "age", fields: ["age"] } : null,
    missing.includes("weight") ? { key: "weight", fields: ["weight"] } : null,
    missing.includes("duration")
      ? { key: "duration", fields: ["duration"] }
      : null,
    missing.includes("vomiting") && missing.includes("bloodInStool")
      ? { key: "vomiting_blood_in_stool", fields: ["vomiting", "bloodInStool"] }
      : null,
    missing.includes("bloodInVomit")
      ? { key: "blood_in_vomit", fields: ["bloodInVomit"] }
      : null,
    missing.includes("vomiting")
      ? { key: "vomiting", fields: ["vomiting"] }
      : null,
    missing.includes("bloodInStool")
      ? { key: "blood_in_stool", fields: ["bloodInStool"] }
      : null,
    missing.includes("warningSigns")
      ? { key: "warning_signs", fields: ["warningSigns"] }
      : null,
    missing.includes("skinBleeding")
      ? { key: "skin_bleeding", fields: ["skinBleeding"] }
      : null,
    missing.includes("appetite") &&
    missing.includes("waterIntake") &&
    missing.includes("energyLevel")
      ? {
          key: "general_condition",
          fields: ["appetite", "waterIntake", "energyLevel"],
        }
      : null,
    missing.includes("appetite") && missing.includes("waterIntake")
      ? { key: "appetite_water_intake", fields: ["appetite", "waterIntake"] }
      : null,
    missing.includes("appetite")
      ? { key: "appetite", fields: ["appetite"] }
      : null,
    missing.includes("waterIntake")
      ? { key: "water_intake", fields: ["waterIntake"] }
      : null,
    missing.includes("energyLevel")
      ? { key: "energy_level", fields: ["energyLevel"] }
      : null,
    missing.includes("fleaTickExposure") &&
    missing.includes("recentProductChange")
      ? {
          key: "skin_context",
          fields: ["fleaTickExposure", "recentProductChange"],
        }
      : null,
    missing.includes("fleaTickExposure")
      ? { key: "flea_tick_exposure", fields: ["fleaTickExposure"] }
      : null,
    missing.includes("recentProductChange")
      ? { key: "recent_product_change", fields: ["recentProductChange"] }
      : null,
  ].filter(Boolean);

  const uniqueCandidates = candidates.filter(
    (candidate, index, all) =>
      all.findIndex((item) => item.key === candidate.key) === index &&
      candidate.fields.some((field) => !hasFieldAnswer(context, field)),
  );

  const next =
    uniqueCandidates.find(
      (candidate) => !asked.has(candidate.key) && !recent.has(candidate.key),
    ) ||
    uniqueCandidates.find((candidate) => !asked.has(candidate.key)) ||
    null;
  if (!next) return null;
  return { ...next, question: questionTextForKey(next.key, context) };
}

function markQuestionAsked(questionState = {}, question) {
  if (!question?.key) return questionState;
  const askedSet = new Set(questionState.askedQuestions || []);
  question.fields.forEach((field) => askedSet.add(questionKeyForField(field)));
  askedSet.add(question.key);
  const history = [
    ...(questionState.questionHistory || []),
    {
      key: question.key,
      fields: question.fields,
      question: question.question,
      status: "asked",
      askedAt: new Date().toISOString(),
    },
  ];
  return {
    ...questionState,
    askedQuestions: [...askedSet],
    currentQuestionKey: question.key,
    lastQuestionKeys: [
      question.key,
      ...(questionState.lastQuestionKeys || []),
    ].slice(0, 5),
    questionHistory: history.slice(-50),
  };
}

function buildHealthQuestion(context) {
  return selectNextHealthQuestion(context)?.question || null;
}

function buildMissingProductFields(context, intent) {
  const missing = [];
  if (!context.pet?.species) missing.push("species");
  if (!context.product?.category && !context.product?.productType)
    missing.push("category");
  if (intent === INTENTS.FOOD_NUTRITION && !context.pet?.age)
    missing.push("age");
  if (context.product?.category === "grooming" && !context.product?.concern)
    missing.push("concern");
  return missing;
}

function buildProductQuestion(context, intent) {
  const missing = buildMissingProductFields(context, intent);
  const species = context.pet?.species || "pet";
  if (missing.includes("species"))
    return "Absolutely. Is this for a dog, cat, or another pet?";
  if (missing.includes("age"))
    return `How old is your ${species}? Puppy/kitten nutrition changes a lot by age.`;
  if (missing.includes("category"))
    return `What are you looking for your ${species}: food, grooming, supplements, toys, or something else?`;
  if (missing.includes("concern"))
    return `What should the grooming product mainly help with: dry skin, itching, odor, fleas/ticks, or general cleaning?`;
  return null;
}

function isAssessmentIntent(intent) {
  return (
    HEALTH_INTENTS.has(intent) &&
    ![
      INTENTS.EMERGENCY_HEALTH,
      INTENTS.MEDICATION_QUESTION,
      INTENTS.VACCINATION,
      INTENTS.HEALTH_QUESTION,
    ].includes(intent)
  );
}

function modeForIntent(intent, safety, assessmentComplete, products = []) {
  if (
    safety.riskLevel === RISK_LEVELS.EMERGENCY ||
    intent === INTENTS.EMERGENCY_HEALTH
  )
    return MODES.EMERGENCY;
  if (safety.shouldRecommendVet) return MODES.URGENT_HEALTH;
  if (intent === INTENTS.GENERAL_CONVERSATION) return MODES.GREETING;
  if (intent === INTENTS.ORDER_QUESTION) return MODES.ORDER_SUPPORT;
  if (isAssessmentIntent(intent) && !assessmentComplete)
    return MODES.HEALTH_ASSESSMENT;
  if (products.length) return MODES.PRODUCT_RECOMMENDATION;
  if (
    [
      INTENTS.PRODUCT_RECOMMENDATION,
      INTENTS.FOOD_NUTRITION,
      INTENTS.GROOMING,
      INTENTS.PRODUCT_INFORMATION,
    ].includes(intent)
  )
    return MODES.PRODUCT_SEARCH;
  if (intent === INTENTS.UNKNOWN) return MODES.UNKNOWN;
  return MODES.GENERAL_PET_CARE;
}

function responseTypeFor({ mode, products, planned }) {
  if (planned.error) return "error";
  if (mode === MODES.EMERGENCY) return "emergency";
  if (mode === MODES.URGENT_HEALTH) return "urgent_health";
  if (planned.followUpQuestion) return "assessment_question";
  if (planned.noMatchingProduct) return "no_matching_product";
  if (planned.consultantReferral) return "consultant_referral";
  if (products.length) return "product_recommendation";
  if (mode === MODES.ORDER_SUPPORT) return "order_support";
  return "message";
}

function buildGuidance(context, safety) {
  const pet = context.pet?.species || "pet";
  const symptom = primarySymptom(context.symptoms);
  if (safety.riskLevel === RISK_LEVELS.EMERGENCY) {
    if (
      safety.emergencyReason === "possible_urinary_obstruction" ||
      context.health?.possibleUrinaryObstruction
    ) {
      return "This could be an urgent urinary problem. Repeated attempts to urinate with only a small amount coming out can be serious in cats. Please contact a veterinarian or emergency veterinary service as soon as possible. Do not wait for a store product or give medication unless a veterinarian advises it.";
    }
    return "This can be serious and should not be managed only through an online chatbot. Please contact a veterinarian or emergency veterinary service as soon as possible.";
  }
  if (safety.riskLevel === RISK_LEVELS.HIGH) {
    return "Based on what you shared, this may need prompt veterinary attention. Please contact a veterinarian today, especially if symptoms are worsening, there is blood, repeated vomiting, severe weakness, or your pet is refusing water.";
  }
  if (symptom === "diarrhea") {
    return `Loose motions can have several possible causes, including diet change, stomach upset, parasites, infection, or eating something unusual. Keep fresh water available and avoid giving human or prescription medicines unless a veterinarian has advised it. A veterinarian should examine your ${pet} if it lasts more than 24-48 hours, gets worse, or any warning signs appear.`;
  }
  if (symptom === "vomiting") {
    return `Vomiting can happen for many reasons, from mild stomach upset to more serious problems. Keep an eye on hydration and energy, and do not give medicine without veterinary advice. Please contact a veterinarian if vomiting repeats, blood appears, your ${pet} becomes weak, or water cannot be kept down.`;
  }
  if (symptom === "urinary difficulty" || context.healthDomain === "urinary") {
    return `Urinary changes can have several causes, including irritation, infection, stones, or blockage. A veterinarian should evaluate your ${pet} promptly if urination is painful, frequent, bloody, reduced, or stops.`;
  }
  if (symptom === "itching") {
    return `Scratching can be related to fleas/ticks, allergies, dry skin, infection, or irritation. If there are open sores, bleeding, swelling, or intense discomfort, a veterinarian should check your ${pet} before you try new topical products.`;
  }
  return `This can have several possible causes. I can share general guidance, but a veterinarian should examine your ${pet} if symptoms are severe, persistent, worsening, or paired with warning signs.`;
}

function buildConsultantReferralMessage(context, safety) {
  const guidance = buildGuidance(context, safety);
  return `${guidance} Based on what you've shared, I don't currently see a suitable product in our catalog for the information you've provided. You can contact our pet care team for additional help.`;
}

function buildNoMatchingProductMessage(context = {}) {
  const pet = context.pet?.species ? `${context.pet.species}s` : "pets";
  const type =
    context.product?.requestedProductType || context.product?.productType;
  const category = context.product?.category;
  if (type === "food" && context.healthDomain === "urinary") {
    return `I couldn't find a kidney/urinary veterinary diet for ${pet} currently available in our catalog. I won't substitute a kidney-support liquid or supplement for a food request. You can contact our pet care team for help finding the exact diet your veterinarian recommended.`;
  }
  const requested = [category, type].filter(Boolean).join(" ");
  return `I couldn't find a matching active ${requested || "product"} for ${pet} in our catalog right now. You can contact our pet care team for help finding a suitable option.`;
}

function buildConsultantSummary(context = {}) {
  const pet = context.pet || {};
  const health = context.health || {};
  const lines = [];
  const petLine = [pet.species, pet.breed].filter(Boolean).join(" - ");
  if (petLine) lines.push(`Pet: ${petLine}`);
  if (pet.age) lines.push(`Age: ${pet.age}`);
  if (pet.weight) lines.push(`Weight: ${pet.weight}`);
  if (context.symptoms?.length)
    lines.push(`Problem: ${context.symptoms.join(", ")}`);
  if (health.duration) lines.push(`Duration: ${health.duration}`);
  if (health.frequency) lines.push(`Frequency: ${health.frequency}`);
  if (health.bloodInVomit === false) lines.push("Blood in vomit: no");
  if (health.bloodInStool === false) lines.push("Blood in stool: no");
  if (health.vomiting === false) lines.push("Vomiting: no");
  if (health.vomiting === true) lines.push("Vomiting: yes");
  if (health.appetite === false) lines.push("Appetite: reduced");
  if (health.appetite === true) lines.push("Appetite: normal");
  if (health.waterIntake === false) lines.push("Water intake: reduced");
  if (health.waterIntake === true) lines.push("Water intake: normal");
  if (health.energyLevel === false) lines.push("Energy: low/weak");
  if (health.energyLevel === true) lines.push("Energy: normal");
  lines.push("Product search: no suitable store product found");
  return lines.join("\n");
}

function buildOrderReply(orderContext) {
  if (orderContext.requiresLogin) return orderContext.summary;
  if (!orderContext.orders.length) return orderContext.summary;
  const order = orderContext.orders[0];
  const shipment = order.trackingNumber
    ? ` Tracking number: ${order.trackingNumber}.`
    : "";
  return `Your latest order ${order.id} is ${order.orderStatus}; payment is ${order.paymentStatus}; shipment is ${order.shipmentStatus || "Pending"}.${shipment}`;
}

function buildKnownPetSummary(context) {
  const pet = context.pet || {};
  const health = context.health || {};
  const parts = [];
  if (pet.name) parts.push(`name: ${pet.name}`);
  if (pet.species) parts.push(`species: ${pet.species}`);
  if (pet.breed) parts.push(`breed: ${pet.breed}`);
  if (pet.age) parts.push(`age: ${pet.age}`);
  if (pet.weight) parts.push(`weight: ${pet.weight}`);
  if (pet.gender) parts.push(`gender: ${pet.gender}`);
  if (context.symptoms?.length)
    parts.push(`symptoms mentioned: ${context.symptoms.join(", ")}`);
  if (health.duration) parts.push(`duration: ${health.duration}`);
  if (health.energyLevel === true) parts.push("energy: normal");
  if (health.energyLevel === false) parts.push("energy: low/weak");
  if (health.appetite === true) parts.push("appetite: normal");
  if (health.appetite === false) parts.push("appetite: reduced");
  if (health.waterIntake === true) parts.push("water intake: normal");
  if (health.waterIntake === false) parts.push("water intake: reduced");
  if (health.vomiting === false) parts.push("vomiting: no");
  if (health.vomiting === true) parts.push("vomiting: yes");
  if (health.bloodInStool === false) parts.push("blood in stool: no");
  if (health.bloodInStool === true) parts.push("blood in stool: yes");
  if (!parts.length)
    return "I do not have pet details in this conversation yet.";
  return `Here's what I know so far: ${parts.join("; ")}.`;
}

function publicConversationState(context) {
  return {
    pet: context.pet || {},
    symptoms: context.symptoms || [],
    healthDomain: context.healthDomain || null,
    health: context.health || {},
    product: context.product || {},
    conversation: context.conversation || {},
    questionState: {
      askedQuestions: context.questionState?.askedQuestions || [],
      answeredQuestions: context.questionState?.answeredQuestions || [],
      unknownQuestions: context.questionState?.unknownQuestions || [],
      currentQuestionKey: context.questionState?.currentQuestionKey || null,
      answers: context.questionState?.answers || {},
    },
    lastIntent: context.intent || null,
  };
}

function parseWeightInLbs(weight) {
  const match = String(weight || "").match(
    /\b(\d+(?:\.\d+)?)\s*(kg|kgs|kilo|kilos|kilogram|kilograms|lb|lbs|pound|pounds)\b/i,
  );
  if (!match) return null;
  const value = Number(match[1]);
  if (!Number.isFinite(value)) return null;
  return /kg|kilo/.test(match[2].toLowerCase()) ? value * 2.20462 : value;
}

function variantMatchesWeight(variant, weightLbs) {
  if (!Number.isFinite(weightLbs)) return false;
  const label = String(
    variant.weightRange || variant.size || variant.label || "",
  ).toLowerCase();
  const numbers = [...label.matchAll(/(\d+(?:\.\d+)?)/g)].map((match) =>
    Number(match[1]),
  );
  if (!numbers.length) return false;
  const comparableWeight = /\bkg|kilo|kilogram/.test(label)
    ? weightLbs / 2.20462
    : weightLbs;
  if (/\b(up to|under|below|less than|<=?)\b/.test(label))
    return comparableWeight <= numbers[0];
  if (numbers.length >= 2)
    return comparableWeight >= numbers[0] && comparableWeight <= numbers[1];
  if (/\b(over|above|more than|greater than|\+)\b/.test(label))
    return comparableWeight >= numbers[0];
  return false;
}

function selectRecommendedVariant(activeVariants = [], context = {}) {
  const weightLbs = parseWeightInLbs(context.pet?.weight);
  const matchingVariant = activeVariants.find((variant) =>
    variantMatchesWeight(variant, weightLbs),
  );
  if (Number.isFinite(weightLbs)) return matchingVariant || null;
  return activeVariants.length === 1 ? activeVariants[0] : null;
}

function serializeProduct(product, reason = "", context = {}) {
  const normalized = normalizeProduct(product);
  const activeVariants = (normalized.optionVariants || []).filter(
    (variant) => variant.isAvailable,
  );
  const selectedSize = selectRecommendedVariant(activeVariants, context);
  const description = cleanText(normalized.description);
  const normalizedProductTypes = normalizedProductTypesForProduct(normalized);
  const selectedPricing = selectedSize?.pricing || normalized.pricing;
  const selectedInventory = selectedSize?.inventory || normalized.inventory;
  return {
    id: normalized.id,
    productId: normalized.id,
    slug: normalized.id,
    name: normalized.name,
    description: description.slice(0, 160),
    image:
      selectedSize?.image ||
      normalized.image ||
      normalized.gallery?.[0] ||
      "/images/img_product_item_image.png",
    price: selectedPricing?.finalPrice ?? normalized.price,
    oldPrice: selectedPricing?.hasDiscount ? selectedPricing.price : 0,
    stock: selectedInventory?.stockQuantity ?? normalized.stock,
    inventory: selectedInventory,
    variantId: selectedSize?.id || null,
    variant: selectedSize
      ? {
          id: selectedSize.id,
          label: selectedSize.label,
          size: selectedSize.size,
          weightRange: selectedSize.weightRange,
          dose: selectedSize.dose,
          packSize: selectedSize.packSize,
          sku: selectedSize.sku,
          price: selectedPricing?.finalPrice ?? selectedSize.price,
          oldPrice: selectedPricing?.hasDiscount ? selectedPricing.price : 0,
          image: selectedSize.image || null,
          stock: selectedInventory?.stockQuantity ?? selectedSize.stock,
          inventory: selectedInventory,
        }
      : null,
    selectedSize,
    hasVariants: activeVariants.length > 1,
    prescriptionRequired: Boolean(normalized.prescriptionRequired),
    vetOnly: Boolean(normalized.vetOnly),
    petType: normalized.petType,
    category: normalized.category?.name || null,
    normalizedProductTypes,
    reason,
  };
}

function normalizeProductType(value) {
  const lower = String(value || "")
    .toLowerCase()
    .replace(/[_-]/g, " ")
    .trim();
  if (!lower) return null;
  for (const [type, aliases] of Object.entries(PRODUCT_TYPE_ALIASES)) {
    if (
      type.replace(/_/g, " ") === lower ||
      aliases.some((alias) => lower.includes(alias))
    ) {
      return type;
    }
  }
  if (/\bfood|diet|kibble|meal\b/.test(lower)) return "food";
  if (/\bliquid|suspension|syrup\b/.test(lower)) return "oral_suspension";
  if (/\bchew|chewable|treat\b/.test(lower)) return "chewable";
  return null;
}

function requestedProductTypesForContext(context = {}) {
  const requested = normalizeProductType(
    context.product?.requestedProductType || context.product?.productType,
  );
  if (!requested) return [];
  return [...(PRODUCT_TYPE_GROUPS[requested] || new Set([requested]))];
}

function productTypeMetadata(product = {}) {
  const description = cleanText(product.description || "");
  const match = description.match(/Product type:\s*([^.]+)/i);
  return [
    match?.[1],
    product.productType,
    typeof product.category === "string"
      ? product.category
      : product.category?.name,
    product.name,
    description,
  ]
    .filter(Boolean)
    .join(" ");
}

function normalizedProductTypesForProduct(product = {}) {
  const metadata = productTypeMetadata(product).toLowerCase();
  const types = new Set();
  for (const [type, aliases] of Object.entries(PRODUCT_TYPE_ALIASES)) {
    if (
      metadata.includes(type.replace(/_/g, " ")) ||
      aliases.some((alias) => metadata.includes(alias))
    ) {
      types.add(type);
    }
  }
  if (
    /\bveterinary hpm\b|\bveterinary diet\b|\bcat food\b|\bdog food\b|\bdry food\b|\bwet food\b|\bkibble\b|\bfood\b/.test(
      metadata,
    )
  ) {
    types.add("food");
  }
  if (
    /\bveterinary diet\b|\bveterinary hpm\b|\bprescription diet\b|\bhypoallergy\b|\bdigestive support cat food\b|\bweight loss .* food\b/.test(
      metadata,
    )
  ) {
    types.add("veterinary_diet");
  }
  if (
    /\boral suspension\b|\bliquid\b|\bbottle\b/.test(metadata) &&
    /\bsupport|kidney|pronefra|suspension\b/.test(metadata)
  ) {
    types.add("oral_suspension");
  }
  if (/\bshampoo\b/.test(metadata)) types.add("shampoo");
  if (/\bear cleaner\b/.test(metadata)) types.add("ear_cleaner");
  if (/\bchew|chews|chewable\b/.test(metadata)) types.add("chewable");
  if (
    /\btoothpaste|toothbrush|oral rinse|water additive|dental\b/.test(metadata)
  )
    types.add("dental_product");
  if (/\bcollar\b/.test(metadata)) types.add("collar");
  if (/\bspot[- ]?on|pipette\b/.test(metadata)) types.add("spot_on");
  if (/\bspray\b/.test(metadata)) types.add("spray");
  if (/\bprobiotic\b/.test(metadata)) types.add("probiotic");
  if (/\bsupplement|support\b/.test(metadata) && !types.has("food"))
    types.add("supplement");
  return [...types];
}

function healthDomainsForProduct(product = {}) {
  const category =
    typeof product.category === "string"
      ? product.category
      : product.category?.name;
  const haystack = [product.name, product.description, category]
    .join(" ")
    .toLowerCase();
  const domains = new Set();
  if (/\bkidney|urinary|urine|bladder|renal|pronefra\b/.test(haystack))
    domains.add("urinary");
  if (/\bdigestive|gastro|stomach|gut|probiotic\b/.test(haystack))
    domains.add("digestive");
  if (
    /\bskin|coat|dermatology|itch|allergy|allermyl|allerderm|shampoo\b/.test(
      haystack,
    )
  )
    domains.add("skin");
  if (/\bear\b/.test(haystack)) domains.add("ear");
  if (/\bdental|tooth|teeth|oral|breath|chew\b/.test(haystack))
    domains.add("dental");
  if (/\bjoint|mobility|movoflex|arthritis\b/.test(haystack))
    domains.add("mobility");
  if (/\bcalm|calming|anxiety|pheromone|zenidog|anxitane\b/.test(haystack))
    domains.add("behavior");
  if (/\bflea|tick|worm|deworm|parasite\b/.test(haystack))
    domains.add("parasites");
  return [...domains];
}

function healthDomainMatchesRequest(productDomains = [], requestDomain) {
  if (!requestDomain || requestDomain === "general illness") return true;
  if (requestDomain === "urinary") return productDomains.includes("urinary");
  if (requestDomain === "allergy") return productDomains.includes("skin");
  if (requestDomain === "behavior") return productDomains.includes("behavior");
  return productDomains.includes(requestDomain);
}

function evaluateProductEligibility(product, context = {}) {
  const requestedTypes = requestedProductTypesForContext(context);
  const productTypes = product.normalizedProductTypes?.length
    ? product.normalizedProductTypes
    : normalizedProductTypesForProduct(product);
  const productDomains = healthDomainsForProduct(product);
  const explicitProductType = requestedTypes.length > 0;
  const productTypeMatch =
    !explicitProductType ||
    requestedTypes.some((type) => productTypes.includes(type));
  const healthDomainMatch = healthDomainMatchesRequest(
    productDomains,
    context.healthDomain,
  );
  const requiresDomainMatch =
    explicitProductType &&
    [
      "urinary",
      "digestive",
      "skin",
      "dental",
      "mobility",
      "behavior",
      "parasites",
    ].includes(context.healthDomain);
  const eligible =
    productTypeMatch && (!requiresDomainMatch || healthDomainMatch);
  return {
    eligible,
    productTypeMatch,
    healthDomainMatch,
    normalizedProductTypes: productTypes,
    healthDomains: productDomains,
    requestedProductTypes: requestedTypes,
    scoreBonus:
      (productTypeMatch && explicitProductType ? 8 : 0) +
      (healthDomainMatch ? 4 : 0),
  };
}

function productSearchTerms(message, context = {}) {
  const requestedTypes = requestedProductTypesForContext(context);
  const requestedAliases = requestedTypes.flatMap(
    (type) => PRODUCT_TYPE_ALIASES[type] || [],
  );
  return [
    ...(context.product?.searchTerms || []),
    ...requestedTypes.map((type) => type.replace(/_/g, " ")),
    ...requestedAliases,
    ...tokenize(message),
    context.pet?.species,
    context.product?.category,
    context.product?.productType,
    context.product?.concern,
    context.pet?.breed,
  ]
    .filter(Boolean)
    .slice(0, 10);
}

function buildProductReason(product, context = {}) {
  const reasons = [];
  const eligibility = evaluateProductEligibility(product, context);
  if (
    context.pet?.species &&
    String(product.petType || "")
      .toLowerCase()
      .includes(context.pet.species)
  )
    reasons.push(`compatible with ${context.pet.species}s`);
  if (
    context.product?.category &&
    String(product.category || "")
      .toLowerCase()
      .includes(String(context.product.category).toLowerCase())
  )
    reasons.push(`listed in ${context.product.category}`);
  if (
    eligibility.requestedProductTypes.length &&
    eligibility.productTypeMatch
  ) {
    reasons.push(
      `matches your ${context.product.requestedProductType || context.product.productType} request`,
    );
  }
  if (context.healthDomain && eligibility.healthDomainMatch)
    reasons.push(`matches the ${context.healthDomain} care area`);
  if (
    context.product?.budgetMax &&
    Number(product.price) <= Number(context.product.budgetMax)
  )
    reasons.push("is within your budget");
  return reasons.length ? `Why it may fit: ${reasons.join(", ")}.` : "";
}

function productRelevanceScore(product, context = {}) {
  const productCategory =
    typeof product.category === "string"
      ? product.category
      : product.category?.name;
  const haystack = [
    product.name,
    product.description,
    productCategory,
    product.petType,
  ]
    .join(" ")
    .toLowerCase();
  const terms = productSearchTerms("", context).map((term) =>
    String(term).toLowerCase(),
  );
  let score = 0;
  terms.forEach((term) => {
    if (term && haystack.includes(term)) score += term.includes(" ") ? 3 : 1;
  });
  if (
    context.pet?.species &&
    String(product.petType || "")
      .toLowerCase()
      .includes(context.pet.species)
  )
    score += 3;
  if (
    context.product?.category &&
    String(product.category || "")
      .toLowerCase()
      .includes(String(context.product.category).toLowerCase())
  )
    score += 4;
  if (
    context.product?.productType &&
    haystack.includes(String(context.product.productType).toLowerCase())
  )
    score += 4;
  if (
    context.product?.concern &&
    haystack.includes(String(context.product.concern).toLowerCase())
  )
    score += 3;
  score += evaluateProductEligibility(product, context).scoreBonus;
  return score;
}

function productMatchesCareNeed(product, context = {}) {
  const hasCareNeed = Boolean(
    context.product?.category ||
    context.product?.productType ||
    context.product?.concern ||
    context.product?.searchTerms?.length,
  );
  if (!hasCareNeed) return true;

  const eligibility = evaluateProductEligibility(product, context);
  if (!eligibility.eligible) return false;

  const productCategory =
    typeof product.category === "string"
      ? product.category
      : product.category?.name;
  const haystack = [
    product.name,
    product.description,
    productCategory,
    product.petType,
  ]
    .join(" ")
    .toLowerCase();
  if (
    !requestedProductTypesForContext(context).length &&
    ["diarrhea", "vomiting", "digestive"].includes(
      primarySymptom(context.symptoms || []),
    )
  ) {
    return /\b(digestive|digestion|probiotic|stomach|gastro|supplement|hydration)\b/.test(
      haystack,
    );
  }
  const category = String(context.product?.category || "").toLowerCase();
  const productType = String(context.product?.productType || "").toLowerCase();
  const concern = String(context.product?.concern || "").toLowerCase();
  const searchTerms = (context.product?.searchTerms || []).map((term) =>
    String(term).toLowerCase(),
  );

  const hasExplicitProductType =
    requestedProductTypesForContext(context).length > 0;
  if (
    hasExplicitProductType &&
    eligibility.productTypeMatch &&
    eligibility.healthDomainMatch
  ) {
    return true;
  }
  if (
    hasExplicitProductType &&
    eligibility.productTypeMatch &&
    category &&
    haystack.includes(category)
  ) {
    return true;
  }
  if (
    !hasExplicitProductType &&
    (category.includes("flea") ||
      productType.includes("flea") ||
      concern.includes("flea"))
  ) {
    return /\b(flea|fleas|tick|ticks|spot[- ]?on|collar)\b/.test(haystack);
  }
  if (
    !hasExplicitProductType &&
    (category.includes("deworm") ||
      productType.includes("deworm") ||
      concern.includes("worm"))
  ) {
    return /\b(deworm|wormer|worming|worm|worms|tapeworm|roundworm|hookworm)\b/.test(
      haystack,
    );
  }
  if (
    !hasExplicitProductType &&
    (category.includes("joint") ||
      productType.includes("joint") ||
      concern.includes("joint"))
  ) {
    return /\b(joint|mobility|flex|arthritis|senior)\b/.test(haystack);
  }

  return Boolean(
    (category && haystack.includes(category)) ||
    (productType && haystack.includes(productType)) ||
    (concern && haystack.includes(concern)) ||
    searchTerms.some((term) => term.length > 2 && haystack.includes(term)),
  );
}

async function findProducts(message, context = {}, options = {}) {
  const terms = productSearchTerms(message, context);
  const budget = context.product?.budgetMax || extractBudget(message);
  const category = context.product?.category || context.product?.productType;
  const searchFilters = terms.flatMap((term) => [
    { name: { contains: term, mode: "insensitive" } },
    { description: { contains: term, mode: "insensitive" } },
    { petType: { contains: term, mode: "insensitive" } },
    { category: { is: { name: { contains: term, mode: "insensitive" } } } },
  ]);
  const andFilters = [
    { status: "Active" },
    context.pet?.species
      ? { petType: { contains: context.pet.species, mode: "insensitive" } }
      : null,
    budget ? { price: { lte: budget } } : null,
    category
      ? {
          OR: [
            { name: { contains: category, mode: "insensitive" } },
            { description: { contains: category, mode: "insensitive" } },
            {
              category: {
                is: { name: { contains: category, mode: "insensitive" } },
              },
            },
          ],
        }
      : null,
    searchFilters.length ? { OR: searchFilters } : null,
  ].filter(Boolean);
  const primaryRows = await safeDb(
    () =>
      prisma.product.findMany({
        where: { AND: andFilters },
        include: { category: true },
        orderBy: [{ sold: "desc" }, { createdAt: "desc" }],
        take: options.limit || MAX_PRODUCTS * 2,
      }),
    [],
  );

  const fallbackRows =
    Array.isArray(primaryRows) && primaryRows.length
      ? []
      : await safeDb(
          () =>
            prisma.product.findMany({
              where: {
                AND: [
                  { status: "Active" },
                  context.pet?.species
                    ? {
                        petType: {
                          contains: context.pet.species,
                          mode: "insensitive",
                        },
                      }
                    : null,
                  budget ? { price: { lte: budget } } : null,
                  searchFilters.length ? { OR: searchFilters } : null,
                ].filter(Boolean),
              },
              include: { category: true },
              orderBy: [{ sold: "desc" }, { createdAt: "desc" }],
              take: options.limit || MAX_PRODUCTS * 3,
            }),
          [],
        );

  const rowsById = new Map(
    [
      ...(Array.isArray(primaryRows) ? primaryRows : []),
      ...(Array.isArray(fallbackRows) ? fallbackRows : []),
    ].map((row) => [row.id, row]),
  );
  return [...rowsById.values()]
    .map((product) =>
      serializeProduct(product, buildProductReason(product, context), context),
    )
    .filter((product) => !product.vetOnly)
    .filter((product) => product.inventory?.isInStock)
    .filter((product) => productMatchesCareNeed(product, context))
    .map((product) => ({
      product,
      score: productRelevanceScore(product, context),
    }))
    .filter((item) => item.score > 1 || !terms.length)
    .sort(
      (a, b) =>
        b.score - a.score ||
        Number(b.product.stock || 0) - Number(a.product.stock || 0),
    )
    .slice(0, options.limit || 4)
    .map((item) => item.product);
}

async function findProductInfo(message) {
  const terms = tokenize(message);
  if (!terms.length) return [];
  const products = await prisma.product.findMany({
    where: {
      status: "Active",
      OR: terms.flatMap((term) => [
        { name: { contains: term, mode: "insensitive" } },
        { sku: { contains: term, mode: "insensitive" } },
        { description: { contains: term, mode: "insensitive" } },
      ]),
    },
    include: { category: true },
    orderBy: [{ sold: "desc" }, { createdAt: "desc" }],
    take: 3,
  });
  return products.map((product) => serializeProduct(product));
}

async function getCustomerOrderContext(customer) {
  if (!customer)
    return {
      requiresLogin: true,
      summary:
        "Please log in and ask again so I can check only your orders securely.",
      orders: [],
    };
  const orders = await prisma.order.findMany({
    where: { customerId: customer.id },
    orderBy: { orderDate: "desc" },
    take: 3,
  });
  if (!orders.length)
    return {
      requiresLogin: false,
      summary: "I do not see any orders on your account yet.",
      orders: [],
    };
  return {
    requiresLogin: false,
    summary: orders
      .map(
        (order) =>
          `${order.id}: ${order.orderStatus}, payment ${order.paymentStatus}, total ${toMoney(order.total)}`,
      )
      .join("; "),
    orders: orders.map((order) => ({
      id: order.id,
      orderStatus: order.orderStatus,
      paymentStatus: order.paymentStatus,
      shipmentStatus: order.shipmentStatus,
      trackingNumber: order.trackingNumber,
      total: toMoney(order.total),
      orderDate: order.orderDate,
    })),
  };
}

function model(name) {
  return prisma[name] || null;
}

async function safeDb(task, fallback = null) {
  try {
    return await task();
  } catch {
    return fallback;
  }
}

async function loadPersistedContext(conversationId, customer) {
  const conversationModel = model("petGPTConversation");
  if (!conversationModel) return {};
  const conversation = await safeDb(() =>
    conversationModel.findFirst({
      where: {
        id: conversationId,
        ...(customer ? { customerId: customer.id } : {}),
      },
      include: { pet: true },
    }),
  );
  if (!conversation) return {};
  return {
    ...(conversation.conversationState || {}),
    pet: mergePet(conversation.conversationState?.pet, conversation.pet || {}),
  };
}

async function findKnownPet(customer, pet) {
  const petModel = model("pet");
  if (!customer || !petModel) return null;
  if (pet.name) {
    const byName = await safeDb(() =>
      petModel.findFirst({
        where: {
          customerId: customer.id,
          name: { equals: pet.name, mode: "insensitive" },
        },
      }),
    );
    if (byName) return byName;
  }
  return safeDb(() =>
    petModel.findFirst({
      where: { customerId: customer.id },
      orderBy: { updatedAt: "desc" },
    }),
  );
}

async function loadPetById(customer, petId) {
  const petModel = model("pet");
  if (!customer || !petId || !petModel) return null;
  return safeDb(() =>
    petModel.findFirst({ where: { id: petId, customerId: customer.id } }),
  );
}

async function persistPet(customer, pet) {
  const petModel = model("pet");
  if (!customer || !petModel) return null;
  const data = compactObject({
    name: pet.name,
    species: pet.species,
    breed: pet.breed,
    age: pet.age,
    weight: pet.weight,
    gender: pet.gender,
    neuteredSpayed: pet.neuteredSpayed,
  });
  if (!Object.keys(data).length) return null;
  const known = await findKnownPet(customer, pet);
  if (known) {
    return safeDb(
      () => petModel.update({ where: { id: known.id }, data }),
      known,
    );
  }
  return safeDb(() =>
    petModel.create({ data: { ...data, customerId: customer.id } }),
  );
}

async function persistConversation({
  conversationId,
  customer,
  petRecord,
  context,
  intent,
  safety,
  userMessage,
  assistantMessage,
  clientMessageId,
  products,
  productSearchCompleted = false,
  consultantReferral = false,
}) {
  const conversationModel = model("petGPTConversation");
  const messageModel = model("petGPTMessage");
  const symptomModel = model("petGPTSymptom");
  const analyticsModel = model("petGPTAnalyticsEvent");
  if (!conversationModel || !messageModel) return;

  await safeDb(() =>
    conversationModel.upsert({
      where: { id: conversationId },
      create: {
        id: conversationId,
        customerId: customer?.id || null,
        petId: petRecord?.id || null,
        intent,
        riskLevel: safety.riskLevel,
        conversationState: context,
        lastMessageAt: new Date(),
      },
      update: {
        customerId: customer?.id || undefined,
        petId: petRecord?.id || undefined,
        intent,
        riskLevel: safety.riskLevel,
        conversationState: context,
        lastMessageAt: new Date(),
      },
    }),
  );

  await safeDb(() =>
    messageModel.create({
      data: {
        conversationId,
        role: "USER",
        content: userMessage,
        intent,
        riskLevel: safety.riskLevel,
        clientMessageId,
        metadata: { structured: context },
      },
    }),
  );
  await safeDb(() =>
    messageModel.create({
      data: {
        conversationId,
        role: "ASSISTANT",
        content: assistantMessage,
        intent,
        riskLevel: safety.riskLevel,
        metadata: {
          productIds: products.map((product) => product.id),
          safety,
          productSearchCompleted,
          consultantReferral,
        },
      },
    }),
  );
  if (symptomModel && context.symptoms?.length) {
    await Promise.all(
      context.symptoms.map((symptom) =>
        safeDb(() =>
          symptomModel.create({
            data: {
              conversationId,
              petId: petRecord?.id || null,
              symptom,
              duration: context.health?.duration || null,
              riskLevel: safety.riskLevel,
              metadata: context.health || {},
            },
          }),
        ),
      ),
    );
  }
  if (analyticsModel) {
    await safeDb(() =>
      analyticsModel.create({
        data: {
          conversationId,
          customerId: customer?.id || null,
          eventType: safety.shouldRecommendVet
            ? "VET_ESCALATION"
            : consultantReferral
              ? "CONSULTANT_REFERRAL"
              : productSearchCompleted && !products.length
                ? "NO_MATCHING_PRODUCT"
                : products.length
                  ? "PRODUCT_RECOMMENDATION"
                  : "CHAT",
          intent,
          riskLevel: safety.riskLevel,
          metadata: {
            symptomCount: context.symptoms?.length || 0,
            productCount: products.length,
            productSearchCompleted,
            consultantReferral,
          },
        },
      }),
    );
  }
}

function buildSuggestions(intent, safety, followUpQuestion) {
  if (safety?.riskLevel === RISK_LEVELS.EMERGENCY)
    return ["Consult a vet", "Open support"];
  if (followUpQuestion && HEALTH_INTENTS.has(intent))
    return [
      "2 years, 18 kg",
      "Since yesterday",
      "No blood or vomiting",
      "Eating and drinking normally",
    ];
  if (followUpQuestion)
    return ["Dog", "Cat", "Puppy", "Dry skin", "No preference"];
  if (intent === INTENTS.ORDER_QUESTION)
    return ["Track my last order", "Show recent orders"];
  return [
    "My dog has loose motions",
    "What food is good for a Labrador puppy?",
    "Which shampoo should I buy?",
    "Where is my order?",
  ];
}

function buildCtas(safety, products, options = {}) {
  const actions = [];
  if (safety.shouldRecommendVet) {
    actions.push({
      type:
        safety.riskLevel === RISK_LEVELS.EMERGENCY
          ? "EMERGENCY_VET_CARE"
          : "CONSULT_VET",
      label:
        safety.riskLevel === RISK_LEVELS.EMERGENCY
          ? "Emergency Veterinary Care"
          : "Consult a Vet",
      urgency: safety.vetUrgency,
      reason: safety.reason,
    });
  }
  products.forEach((product) => {
    actions.push({
      type: product.inventory?.isInStock
        ? "VIEW_PRODUCT_OR_ADD_TO_CART"
        : "VIEW_PRODUCT",
      productId: product.id,
    });
  });
  if (options.consultantReferral) {
    actions.push({
      type: "CONTACT_CONSULTANT",
      label: "Contact Our Consultant",
      route: "/contact",
      source: "PETGPT",
    });
  }
  return actions;
}

async function generateAiReply({
  message,
  history,
  products,
  orderContext,
  context,
  intent,
  safety,
  followUpQuestion,
  recommendationReady,
}) {
  if (followUpQuestion || safety.riskLevel === RISK_LEVELS.EMERGENCY)
    return null;
  return generatePetAssistantMessage({
    message,
    history,
    products,
    orderContext,
    context,
    intent,
    safety,
    recommendationReady,
  });
}

function planResponse({
  message,
  intent,
  context,
  safety,
  products,
  orderContext,
  needsHealthAssessment,
  productSearchCompleted,
  aiDecision,
  aiError,
}) {
  if (aiError && intent === INTENTS.UNKNOWN) {
    return {
      message:
        "I'm having trouble responding right now. Please try again in a moment.",
      followUpQuestion: null,
      error: true,
    };
  }
  if (
    /\b(what do you know|what have you saved|what do you remember|known about my (?:dog|cat|pet))\b/i.test(
      message,
    )
  ) {
    return { message: buildKnownPetSummary(context), followUpQuestion: null };
  }
  if (intent === INTENTS.GENERAL_CONVERSATION) {
    return {
      message:
        "Hi! I can help with pet health questions, product recommendations, orders, grooming, nutrition, and general pet care. What can I help you with today?",
      followUpQuestion: null,
    };
  }
  if (intent === INTENTS.ORDER_QUESTION) {
    return { message: buildOrderReply(orderContext), followUpQuestion: null };
  }
  if (intent === INTENTS.GENERAL_PET_CARE) {
    return {
      message:
        "I can help with that. Ask me anything about pet care, behavior, nutrition, grooming, shopping, orders, or routine wellness.",
      followUpQuestion: null,
    };
  }
  if (intent === INTENTS.HEALTH_QUESTION) {
    if (context.healthDomain === "urinary") {
      return {
        message:
          "Common signs of urinary problems in pets can include frequent trips to pee, straining, accidents, blood in urine, crying while urinating, or passing very little urine. If a cat is trying to urinate and little or nothing comes out, that can be urgent and needs veterinary care quickly.",
        followUpQuestion: null,
      };
    }
    return { message: buildGuidance(context, safety), followUpQuestion: null };
  }
  if (intent === INTENTS.MEDICATION_QUESTION && !context.symptoms?.length) {
    return {
      message:
        "I would not recommend a medicine without knowing the problem and your pet's health context. What symptoms is your pet having?",
      followUpQuestion: "What symptoms is your pet having?",
    };
  }
  if (
    safety.riskLevel === RISK_LEVELS.EMERGENCY ||
    safety.riskLevel === RISK_LEVELS.HIGH
  ) {
    return { message: buildGuidance(context, safety), followUpQuestion: null };
  }
  if (needsHealthAssessment) {
    if (aiDecision?.needsMoreInfo && aiDecision.nextQuestion) {
      return {
        message: aiDecision.nextQuestion,
        followUpQuestion: aiDecision.nextQuestion,
        nextQuestionKey: "ai_follow_up",
        nextQuestionFields: [],
        nextQuestion: {
          key: "ai_follow_up",
          fields: [],
          question: aiDecision.nextQuestion,
        },
      };
    }
    const question = selectNextHealthQuestion(context);
    if (question?.question) {
      return {
        message: question.question,
        followUpQuestion: question.question,
        nextQuestionKey: question.key,
        nextQuestionFields: question.fields,
        nextQuestion: question,
      };
    }
    if (products.length) {
      const symptom = primarySymptom(context.symptoms);
      if (symptom === "itching") {
        return {
          message: `Thanks. I'll check our store for routine skin/itch-care products that match what you've described. If the itching persists, becomes severe, or you notice wounds, swelling, or other concerning symptoms, a veterinarian should evaluate your ${context.pet?.species || "pet"}.`,
          followUpQuestion: null,
        };
      }
      return {
        message: `${buildGuidance(context, safety)} Based on what you shared, I found these in-stock store products that may support ${context.product?.concern || context.product?.productType || "care"}. Please follow the product label and veterinary advice.`,
        followUpQuestion: null,
      };
    }
    if (productSearchCompleted) {
      return {
        message: buildConsultantReferralMessage(context, safety),
        followUpQuestion: null,
        consultantReferral: true,
      };
    }
    return { message: buildGuidance(context, safety), followUpQuestion: null };
  }
  if (intent === INTENTS.FOOD_NUTRITION) {
    const question = buildProductQuestion(context, intent);
    if (question) return { message: question, followUpQuestion: question };
    return {
      message:
        "For nutrition, choose food matched to species, age, size, activity level, and any sensitivities. I found relevant store options below; introduce any new food gradually over several days.",
      followUpQuestion: null,
    };
  }
  if (intent === INTENTS.PRODUCT_INFORMATION && products.length) {
    const product = products[0];
    const availability = product.inventory?.isInStock
      ? `${product.stock} in stock`
      : "currently out of stock";
    return {
      message: `${product.name} is ${availability} and costs ${product.price}. ${product.description || "I do not have more description details for this product."}`,
      followUpQuestion: null,
    };
  }
  if (
    intent === INTENTS.PRODUCT_RECOMMENDATION ||
    intent === INTENTS.GROOMING
  ) {
    if (context.symptoms?.length && safety.riskLevel !== RISK_LEVELS.LOW) {
      return {
        message: buildGuidance(context, safety),
        followUpQuestion: null,
      };
    }
    const question = buildProductQuestion(context, intent);
    if (question) return { message: question, followUpQuestion: question };
    if (products.length)
      return {
        message:
          "Thanks. I found these matching products from our actual catalog.",
        followUpQuestion: null,
      };
    if (productSearchCompleted) {
      return {
        message: buildNoMatchingProductMessage(context),
        followUpQuestion: null,
        noMatchingProduct: true,
      };
    }
    return {
      message:
        "I could not find a matching active product in the catalog. Try a broader need, such as dog shampoo, cat food, or probiotics.",
      followUpQuestion: null,
    };
  }
  if (intent === INTENTS.BEHAVIOR) {
    return {
      message:
        "I can help with general behavior guidance. What behavior are you noticing, and how long has it been happening?",
      followUpQuestion:
        "What behavior are you noticing, and how long has it been happening?",
    };
  }
  return {
    message:
      "I didn't fully understand that. Are you looking for help with your pet's health, a product from our store, or an order?",
    followUpQuestion: null,
  };
}

function extractProductContext(message) {
  const routineContext = extractRoutineProductContext(message);
  const productType = extractProductType(message);
  return compactObject({
    ...routineContext,
    category: extractCategory(message),
    productType,
    requestedProductType: normalizeProductType(productType),
    concern: extractConcern(message),
    budgetMax: extractBudget(message),
  });
}

function deriveProductContextFromHealth(context = {}) {
  const symptom = primarySymptom(context.symptoms || []);
  return compactObject(HEALTH_PRODUCT_HINTS[symptom] || {});
}

function shouldResetProductContextForHealth(
  message,
  intent,
  symptoms = [],
  derivedProduct = {},
  extractedProduct = {},
) {
  if (isDirectShoppingRequest(message)) return false;
  if (!isAssessmentIntent(intent) && !symptoms.length) return false;
  const hasCurrentProductSignal = Boolean(
    derivedProduct.category ||
    derivedProduct.productType ||
    derivedProduct.concern ||
    extractedProduct.category ||
    extractedProduct.productType ||
    extractedProduct.concern,
  );
  return !hasCurrentProductSignal;
}

function normalizeAiPet(decision = {}) {
  return compactObject({
    species: decision.petType ? String(decision.petType).toLowerCase() : null,
    breed: decision.breed,
    age: decision.age,
    weight: decision.weight,
  });
}

function normalizeAiProduct(decision = {}) {
  const productType = decision.requestedProductType || decision.productType;
  return compactObject({
    category: decision.requestedCategory || decision.recommendedCategory,
    productType,
    requestedProductType: normalizeProductType(productType),
    requestedForm: decision.requestedForm,
    lifeStage: decision.lifeStage,
    concern: decision.concern || decision.problem,
    searchTerms: Array.isArray(decision.searchTerms)
      ? decision.searchTerms.filter(Boolean).slice(0, 8)
      : [],
  });
}

function intentFromAiDecision(decision, fallbackIntent) {
  if (!decision?.intent) return fallbackIntent;
  return AI_INTENT_TO_INTERNAL[decision.intent] || fallbackIntent;
}

function applyAiDecisionToContext(context, decision) {
  if (!decision) return context;
  const aiSymptoms = Array.isArray(decision.symptoms)
    ? decision.symptoms.filter(Boolean)
    : [];
  const healthDomain =
    decision.healthDomain ||
    context.healthDomain ||
    extractHealthDomain("", [...(context.symptoms || []), ...aiSymptoms]);
  return {
    ...context,
    aiDecision: decision,
    pet: mergePet(context.pet, normalizeAiPet(decision)),
    healthDomain,
    symptoms: [...new Set([...(context.symptoms || []), ...aiSymptoms])],
    product: {
      ...(context.product || {}),
      ...normalizeAiProduct(decision),
    },
    health: mergeHealth(context.health, {
      possibleUrinaryObstruction:
        decision.emergencyReason === "possible_urinary_obstruction" ||
        /urinary obstruction/i.test(String(decision.emergencyReason || ""))
          ? true
          : null,
    }),
  };
}

async function chatInternal(payload, customer = null) {
  const message = payload.message.trim();
  const conversationId = getConversationId(
    payload.conversationId || payload.sessionId,
  );
  const local = getLocalConversation(conversationId);
  if (
    payload.clientMessageId &&
    local.processedMessages?.[payload.clientMessageId]
  ) {
    return local.processedMessages[payload.clientMessageId];
  }

  const persistedContext = await loadPersistedContext(conversationId, customer);
  const previousContext = { ...persistedContext, ...(local.context || {}) };
  const selectedPet = await loadPetById(customer, payload.petId);
  let intent = classifyIntent(message, previousContext.intent);
  const pet = mergePet(
    mergePet(previousContext.pet, selectedPet || {}),
    extractPetInfo(message),
  );
  const symptoms = [
    ...new Set([
      ...(previousContext.symptoms || []),
      ...extractSymptoms(message),
    ]),
  ];
  const healthDomain =
    extractHealthDomain(message, symptoms) ||
    previousContext.healthDomain ||
    null;
  const extractedHealth = mergeHealth(
    extractHealthDetails(message),
    extractPendingHealthAnswer(message, previousContext),
  );
  const health = mergeHealth(previousContext.health, extractedHealth);
  const derivedProduct = deriveProductContextFromHealth({
    ...previousContext,
    symptoms,
  });
  const extractedProduct = extractProductContext(message);
  const productBase = shouldResetProductContextForHealth(
    message,
    intent,
    symptoms,
    derivedProduct,
    extractedProduct,
  )
    ? {}
    : previousContext.product || {};
  const product = { ...productBase, ...derivedProduct, ...extractedProduct };
  let context = {
    ...previousContext,
    intent,
    pet,
    symptoms,
    healthDomain,
    health,
    product,
  };
  context.questionState = reconcileQuestionState(previousContext, context, {
    message,
    extractedHealth,
  });
  let safety = classifyRisk({ message, intent, pet, health, symptoms });
  let aiDecision = null;
  let aiError = null;
  if (!safety.shouldRecommendVet) {
    try {
      aiDecision = await runPetAssistantDecision({
        message,
        history: local.history,
        context: publicConversationState(context),
        safety,
      });
    } catch (error) {
      aiError = {
        message: error?.message,
        status: error?.status || error?.code || null,
      };
    }
  }
  if (aiDecision) {
    const aiIntent = intentFromAiDecision(aiDecision, intent);
    intent =
      aiIntent === INTENTS.EMERGENCY_HEALTH &&
      !safety.shouldRecommendVet &&
      !hasEmergencySignal(message)
        ? INTENTS.SYMPTOM_HEALTH
        : aiIntent;
    context = applyAiDecisionToContext({ ...context, intent }, aiDecision);
    context.product = {
      ...deriveProductContextFromHealth(context),
      ...(context.product || {}),
    };
    context.questionState = reconcileQuestionState(previousContext, context, {
      message,
      extractedHealth,
    });
    safety = classifyRisk({
      message,
      intent,
      pet: context.pet,
      health: context.health,
      symptoms: context.symptoms,
    });
  }
  const normalizedSafety = normalizedSafetyResult(safety);
  if (!normalizedSafety.productRecommendationAllowed) {
    context = {
      ...context,
      product: {},
    };
  }
  const petRecord = await persistPet(customer, context.pet);
  if (petRecord) context.pet = mergePet(context.pet, petRecord);

  rememberLocal(conversationId, "user", message, {
    intent,
    riskLevel: safety.riskLevel,
  });

  let products = [];
  let orderContext = null;
  if (intent === INTENTS.ORDER_QUESTION) {
    orderContext = await getCustomerOrderContext(customer);
  } else if (intent === INTENTS.PRODUCT_INFORMATION) {
    products = await findProductInfo(message);
  }

  const directShopping = isDirectShoppingRequest(message);
  const seriousHealthShoppingRequest = [
    "diarrhea",
    "vomiting",
    "digestive",
  ].includes(primarySymptom(context.symptoms));
  const needsHealthAssessment =
    normalizedSafety.productRecommendationAllowed &&
    (!directShopping || seriousHealthShoppingRequest) &&
    (isAssessmentIntent(intent) || context.symptoms.length > 0);
  const pendingAssessmentQuestion = needsHealthAssessment
    ? selectNextHealthQuestion(context)
    : null;
  const assessmentComplete = needsHealthAssessment
    ? !pendingAssessmentQuestion
    : true;
  const readyForProductSearch =
    normalizedSafety.productRecommendationAllowed &&
    (directShopping ||
      (needsHealthAssessment && assessmentComplete) ||
      !needsHealthAssessment);

  const shouldSearchProducts =
    readyForProductSearch &&
    normalizedSafety.productRecommendationAllowed &&
    ([
      INTENTS.PRODUCT_RECOMMENDATION,
      INTENTS.FOOD_NUTRITION,
      INTENTS.GROOMING,
    ].includes(intent) ||
      (needsHealthAssessment &&
        assessmentComplete &&
        safety.riskLevel === RISK_LEVELS.LOW)) &&
    !buildProductQuestion(context, intent);

  let productSearchCompleted = false;
  if (shouldSearchProducts) {
    products = await findProducts(message, context);
    productSearchCompleted = true;
  }

  if (needsHealthAssessment && !assessmentComplete) {
    products = [];
  }

  const planned = planResponse({
    message,
    intent,
    context,
    safety,
    products,
    orderContext,
    needsHealthAssessment,
    productSearchCompleted,
    aiDecision,
    aiError,
  });
  const mode =
    needsHealthAssessment && !assessmentComplete
      ? MODES.HEALTH_ASSESSMENT
      : modeForIntent(intent, safety, assessmentComplete, products);
  const responseType = responseTypeFor({ mode, products, planned });
  const consultantReferral = responseType === "consultant_referral";
  const noMatchingProduct = responseType === "no_matching_product";
  const finalProducts =
    responseType === "product_recommendation" ? products : [];
  const finalRecommendationReady =
    responseType === "product_recommendation" && finalProducts.length > 0;
  if (planned.nextQuestion) {
    context = {
      ...context,
      questionState: markQuestionAsked(
        context.questionState,
        planned.nextQuestion,
      ),
    };
  } else {
    context = {
      ...context,
      questionState: {
        ...(context.questionState || {}),
        currentQuestionKey: null,
      },
    };
  }
  context = {
    ...context,
    conversation: {
      mode,
      assessmentComplete,
      readyForProductSearch,
      productSearchCompleted,
      assessmentStatus:
        consultantReferral || noMatchingProduct
          ? "referred_to_consultant"
          : undefined,
      questionsAsked: context.questionState?.askedQuestions || [],
    },
  };
  const aiReply =
    consultantReferral || noMatchingProduct || planned.error
      ? null
      : await generateAiReply({
          message,
          history: local.history,
          products,
          orderContext,
          context,
          intent,
          safety,
          followUpQuestion: planned.followUpQuestion,
          recommendationReady: finalRecommendationReady,
        }).catch(() => null);

  const reply = planned.followUpQuestion || aiReply || planned.message;
  const missingInformation =
    HEALTH_INTENTS.has(intent) || context.symptoms?.length
      ? missingHealthInfo(context)
      : buildMissingProductFields(context, intent);
  const conversationStage = safety.shouldRecommendVet
    ? "VET_ESCALATION"
    : planned.followUpQuestion
      ? "FOLLOW_UP"
      : consultantReferral || noMatchingProduct
        ? "CONSULTANT_REFERRAL"
        : finalProducts.length
          ? "RECOMMENDATION"
          : "GUIDANCE";

  if (
    process.env.NODE_ENV !== "production" &&
    process.env.PETGPT_DEBUG_STATE === "true"
  ) {
    console.log("[PetAssistant] route", {
      message,
      intent,
      healthDomain: context.healthDomain,
      petType: context.pet?.species || null,
      emergency: safety.riskLevel === RISK_LEVELS.EMERGENCY,
      emergencyReason: safety.emergencyReason || null,
      presentSymptoms: context.symptoms || [],
      deniedSymptoms: context.health?.deniedSymptoms || [],
      normalizedRiskLevel: normalizedSafety.riskLevel,
      riskReason: normalizedSafety.reason,
      assessmentComplete,
      productSearchAllowed: normalizedSafety.productRecommendationAllowed,
      categories: context.product?.category || null,
      productType: context.product?.productType || null,
      concern: context.product?.concern || null,
      searchTerms: context.product?.searchTerms || [],
      productsFound: finalProducts.length,
      route: responseType,
    });
    console.log("[PetGPT STATE]", {
      intent,
      riskLevel: safety.riskLevel,
      known: {
        pet: compactObject(context.pet || {}),
        health: compactObject(context.health || {}),
      },
      asked: context.questionState?.askedQuestions || [],
      answered: context.questionState?.answeredQuestions || [],
      unknown: context.questionState?.unknownQuestions || [],
      missing: missingInformation,
      selectedNextQuestion: planned.nextQuestionKey || null,
    });
  }

  setLocalContext(conversationId, {
    ...context,
    conversation: {
      mode,
      assessmentComplete,
      readyForProductSearch,
      productSearchCompleted,
      assessmentStatus:
        consultantReferral || noMatchingProduct
          ? "referred_to_consultant"
          : undefined,
      questionsAsked: context.questionState?.askedQuestions || [],
    },
    riskLevel: safety.riskLevel,
    normalizedRiskLevel: normalizedSafety.riskLevel,
    productSearchAllowed: normalizedSafety.productRecommendationAllowed,
    showProducts: responseType === "product_recommendation",
    safety: normalizedSafety,
    shouldRecommendVet: safety.shouldRecommendVet,
    lastMessageAt: new Date().toISOString(),
  });
  rememberLocal(conversationId, "assistant", reply, {
    intent,
    riskLevel: safety.riskLevel,
    productCount: finalProducts.length,
    missingInformation,
  });

  await persistConversation({
    conversationId,
    customer,
    petRecord,
    context,
    intent,
    safety,
    userMessage: message,
    assistantMessage: reply,
    clientMessageId: payload.clientMessageId || null,
    products: finalProducts,
    productSearchCompleted,
    consultantReferral,
  });

  const response = {
    type: responseType,
    messageId: `msg_${crypto.randomBytes(8).toString("hex")}`,
    conversationId,
    message: reply,
    mode,
    assessmentComplete,
    readyForProductSearch,
    intent,
    riskLevel: safety.riskLevel,
    normalizedRiskLevel: normalizedSafety.riskLevel,
    productSearchAllowed: normalizedSafety.productRecommendationAllowed,
    showProducts: responseType === "product_recommendation",
    safety: normalizedSafety,
    healthDomain: context.healthDomain,
    symptoms: context.symptoms || [],
    pet: publicConversationState(context).pet,
    conversationStage,
    conversationState: publicConversationState(context),
    questionKey: planned.nextQuestionKey || null,
    missingInformation,
    missingFields: missingInformation,
    shouldAskFollowUp: Boolean(planned.followUpQuestion),
    requiresFollowUp: Boolean(planned.followUpQuestion),
    followUpQuestion: planned.followUpQuestion,
    shouldRecommendVet: safety.shouldRecommendVet,
    vetUrgency: safety.vetUrgency,
    vetEscalationReason: safety.reason,
    emergencyReason: safety.emergencyReason || null,
    shouldRecommendProducts: finalRecommendationReady,
    recommendationReady: finalRecommendationReady,
    products: finalProducts,
    showConsultantCTA: consultantReferral || noMatchingProduct,
    consultantContactRoute:
      consultantReferral || noMatchingProduct ? "/contact" : null,
    consultantSummary:
      consultantReferral || noMatchingProduct
        ? buildConsultantSummary(context)
        : null,
    assessmentStatus:
      consultantReferral || noMatchingProduct ? "referred_to_consultant" : null,
    productSearchCompleted,
    aiDecision,
    aiError,
    actions: buildCtas(safety, finalProducts, {
      consultantReferral: consultantReferral || noMatchingProduct,
    }),
    suggestions: buildSuggestions(intent, safety, planned.followUpQuestion),
  };

  if (payload.clientMessageId) {
    const updated = getLocalConversation(conversationId);
    updated.processedMessages = {
      ...(updated.processedMessages || {}),
      [payload.clientMessageId]: response,
    };
    const ids = Object.keys(updated.processedMessages).slice(-20);
    updated.processedMessages = Object.fromEntries(
      ids.map((id) => [id, updated.processedMessages[id]]),
    );
  }

  return response;
}

async function withConversationLock(conversationId, task) {
  const previous = conversationLocks.get(conversationId) || Promise.resolve();
  const current = previous.catch(() => undefined).then(task);
  conversationLocks.set(conversationId, current);
  try {
    return await current;
  } finally {
    if (conversationLocks.get(conversationId) === current) {
      conversationLocks.delete(conversationId);
    }
  }
}

async function chat(payload, customer = null) {
  const conversationId = getConversationId(
    payload.conversationId || payload.sessionId,
  );
  return withConversationLock(conversationId, () =>
    chatInternal({ ...payload, conversationId }, customer),
  );
}

module.exports = {
  chat,
  INTENTS,
  RISK_LEVELS,
  __resetForTests: () => {
    conversations.clear();
    conversationLocks.clear();
  },
  searchProducts: findProducts,
  getProductDetails: async (productId) => {
    if (!productId) return null;
    const product = await prisma.product.findFirst({
      where: { id: productId, status: "Active" },
      include: { category: true },
    });
    return product ? serializeProduct(product) : null;
  },
  checkInventory: async (productId) => {
    if (!productId) return null;
    const product = await prisma.product.findFirst({
      where: { id: productId, status: "Active" },
      include: { category: true },
    });
    if (!product) return null;
    const serialized = serializeProduct(product);
    return {
      productId: serialized.id,
      variantId: serialized.variantId,
      stock: serialized.stock,
      inventory: serialized.inventory,
      isInStock: Boolean(serialized.inventory?.isInStock),
    };
  },
  _private: {
    classifyIntent,
    extractPetInfo,
    extractSymptoms,
    extractHealthDetails,
    classifyRisk,
    hasEmergencySignal,
    hasHighRiskSignal,
    buildHealthQuestion,
    planResponse,
    missingHealthInfo,
  },
};
