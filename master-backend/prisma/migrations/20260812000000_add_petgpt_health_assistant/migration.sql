DO $$ BEGIN
  CREATE TYPE "PetGPTRiskLevel" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'EMERGENCY');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "PetGPTMessageRole" AS ENUM ('USER', 'ASSISTANT', 'SYSTEM');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS "Pet" (
  "id" TEXT NOT NULL,
  "customerId" TEXT NOT NULL,
  "name" TEXT,
  "species" TEXT,
  "breed" TEXT,
  "age" TEXT,
  "weight" TEXT,
  "gender" TEXT,
  "neuteredSpayed" BOOLEAN,
  "medicalConditions" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "allergies" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "currentMedications" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "vaccinationInfo" TEXT,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Pet_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "PetGPTConversation" (
  "id" TEXT NOT NULL,
  "customerId" TEXT,
  "petId" TEXT,
  "intent" TEXT,
  "riskLevel" "PetGPTRiskLevel" NOT NULL DEFAULT 'LOW',
  "status" TEXT NOT NULL DEFAULT 'ACTIVE',
  "conversationState" JSONB,
  "summary" TEXT,
  "lastMessageAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "PetGPTConversation_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "PetGPTMessage" (
  "id" TEXT NOT NULL,
  "conversationId" TEXT NOT NULL,
  "role" "PetGPTMessageRole" NOT NULL,
  "content" TEXT NOT NULL,
  "intent" TEXT,
  "riskLevel" "PetGPTRiskLevel",
  "metadata" JSONB,
  "clientMessageId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PetGPTMessage_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "PetGPTSymptom" (
  "id" TEXT NOT NULL,
  "conversationId" TEXT NOT NULL,
  "petId" TEXT,
  "symptom" TEXT NOT NULL,
  "severity" TEXT,
  "duration" TEXT,
  "riskLevel" "PetGPTRiskLevel" NOT NULL DEFAULT 'LOW',
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PetGPTSymptom_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "PetGPTAnalyticsEvent" (
  "id" TEXT NOT NULL,
  "conversationId" TEXT,
  "customerId" TEXT,
  "eventType" TEXT NOT NULL,
  "intent" TEXT,
  "riskLevel" TEXT,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PetGPTAnalyticsEvent_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "Pet_customerId_idx" ON "Pet"("customerId");
CREATE INDEX IF NOT EXISTS "Pet_name_idx" ON "Pet"("name");
CREATE INDEX IF NOT EXISTS "Pet_species_idx" ON "Pet"("species");

CREATE INDEX IF NOT EXISTS "PetGPTConversation_customerId_idx" ON "PetGPTConversation"("customerId");
CREATE INDEX IF NOT EXISTS "PetGPTConversation_petId_idx" ON "PetGPTConversation"("petId");
CREATE INDEX IF NOT EXISTS "PetGPTConversation_intent_idx" ON "PetGPTConversation"("intent");
CREATE INDEX IF NOT EXISTS "PetGPTConversation_riskLevel_idx" ON "PetGPTConversation"("riskLevel");
CREATE INDEX IF NOT EXISTS "PetGPTConversation_lastMessageAt_idx" ON "PetGPTConversation"("lastMessageAt");

CREATE UNIQUE INDEX IF NOT EXISTS "PetGPTMessage_conversationId_clientMessageId_key"
  ON "PetGPTMessage"("conversationId", "clientMessageId")
  WHERE "clientMessageId" IS NOT NULL;
CREATE INDEX IF NOT EXISTS "PetGPTMessage_conversationId_idx" ON "PetGPTMessage"("conversationId");
CREATE INDEX IF NOT EXISTS "PetGPTMessage_role_idx" ON "PetGPTMessage"("role");
CREATE INDEX IF NOT EXISTS "PetGPTMessage_intent_idx" ON "PetGPTMessage"("intent");
CREATE INDEX IF NOT EXISTS "PetGPTMessage_riskLevel_idx" ON "PetGPTMessage"("riskLevel");
CREATE INDEX IF NOT EXISTS "PetGPTMessage_createdAt_idx" ON "PetGPTMessage"("createdAt");

CREATE INDEX IF NOT EXISTS "PetGPTSymptom_conversationId_idx" ON "PetGPTSymptom"("conversationId");
CREATE INDEX IF NOT EXISTS "PetGPTSymptom_petId_idx" ON "PetGPTSymptom"("petId");
CREATE INDEX IF NOT EXISTS "PetGPTSymptom_symptom_idx" ON "PetGPTSymptom"("symptom");
CREATE INDEX IF NOT EXISTS "PetGPTSymptom_riskLevel_idx" ON "PetGPTSymptom"("riskLevel");
CREATE INDEX IF NOT EXISTS "PetGPTSymptom_createdAt_idx" ON "PetGPTSymptom"("createdAt");

CREATE INDEX IF NOT EXISTS "PetGPTAnalyticsEvent_conversationId_idx" ON "PetGPTAnalyticsEvent"("conversationId");
CREATE INDEX IF NOT EXISTS "PetGPTAnalyticsEvent_customerId_idx" ON "PetGPTAnalyticsEvent"("customerId");
CREATE INDEX IF NOT EXISTS "PetGPTAnalyticsEvent_eventType_idx" ON "PetGPTAnalyticsEvent"("eventType");
CREATE INDEX IF NOT EXISTS "PetGPTAnalyticsEvent_intent_idx" ON "PetGPTAnalyticsEvent"("intent");
CREATE INDEX IF NOT EXISTS "PetGPTAnalyticsEvent_riskLevel_idx" ON "PetGPTAnalyticsEvent"("riskLevel");
CREATE INDEX IF NOT EXISTS "PetGPTAnalyticsEvent_createdAt_idx" ON "PetGPTAnalyticsEvent"("createdAt");

DO $$ BEGIN
  ALTER TABLE "Pet"
    ADD CONSTRAINT "Pet_customerId_fkey"
    FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "PetGPTConversation"
    ADD CONSTRAINT "PetGPTConversation_customerId_fkey"
    FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "PetGPTConversation"
    ADD CONSTRAINT "PetGPTConversation_petId_fkey"
    FOREIGN KEY ("petId") REFERENCES "Pet"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "PetGPTMessage"
    ADD CONSTRAINT "PetGPTMessage_conversationId_fkey"
    FOREIGN KEY ("conversationId") REFERENCES "PetGPTConversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "PetGPTSymptom"
    ADD CONSTRAINT "PetGPTSymptom_conversationId_fkey"
    FOREIGN KEY ("conversationId") REFERENCES "PetGPTConversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
