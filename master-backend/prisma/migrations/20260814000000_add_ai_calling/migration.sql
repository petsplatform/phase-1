DO $$ BEGIN
  CREATE TYPE "AiCallAgentLanguage" AS ENUM ('english', 'hindi', 'gujarati', 'multilingual');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "AiCallLeadStatus" AS ENUM ('new', 'queued', 'calling', 'interested', 'not_interested', 'callback_requested', 'information_sent', 'do_not_call', 'no_answer', 'failed', 'completed');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "AiCallCampaignStatus" AS ENUM ('DRAFT', 'RUNNING', 'PAUSED', 'STOPPED', 'COMPLETED');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "AiCallStatus" AS ENUM ('queued', 'calling', 'ringing', 'answered', 'completed', 'no_answer', 'busy', 'voicemail', 'failed', 'cancelled');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "AiCallOutcome" AS ENUM ('interested', 'not_interested', 'callback_requested', 'information_sent', 'no_answer', 'busy', 'voicemail', 'failed', 'do_not_call', 'completed');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "AiCallMessageRole" AS ENUM ('customer', 'agent', 'system', 'tool');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "AiCallActionStatus" AS ENUM ('pending', 'success', 'failed', 'skipped');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "AiCallConsentStatus" AS ENUM ('unknown', 'opted_in', 'opted_out');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

ALTER TABLE "Customer" ADD COLUMN IF NOT EXISTS "whatsappNumber" TEXT;
ALTER TABLE "Customer" ADD COLUMN IF NOT EXISTS "petType" TEXT;
ALTER TABLE "Customer" ADD COLUMN IF NOT EXISTS "petName" TEXT;
ALTER TABLE "Customer" ADD COLUMN IF NOT EXISTS "city" TEXT;
ALTER TABLE "Customer" ADD COLUMN IF NOT EXISTS "notes" TEXT;
ALTER TABLE "Customer" ADD COLUMN IF NOT EXISTS "leadStatus" "AiCallLeadStatus" NOT NULL DEFAULT 'new';
ALTER TABLE "Customer" ADD COLUMN IF NOT EXISTS "consentStatus" "AiCallConsentStatus" NOT NULL DEFAULT 'unknown';
ALTER TABLE "Customer" ADD COLUMN IF NOT EXISTS "doNotCall" BOOLEAN NOT NULL DEFAULT false;

CREATE TABLE IF NOT EXISTS "CustomerLeadStatusHistory" (
  "id" TEXT NOT NULL,
  "customerId" TEXT NOT NULL,
  "previousStatus" "AiCallLeadStatus",
  "nextStatus" "AiCallLeadStatus" NOT NULL,
  "reason" TEXT,
  "source" TEXT NOT NULL DEFAULT 'ai_calling',
  "callId" TEXT,
  "createdBy" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "CustomerLeadStatusHistory_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "AiCallAgent" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "purpose" TEXT NOT NULL,
  "systemPrompt" TEXT NOT NULL,
  "language" "AiCallAgentLanguage" NOT NULL DEFAULT 'multilingual',
  "voice" JSONB,
  "openingMessage" TEXT NOT NULL,
  "allowedActions" JSONB NOT NULL DEFAULT '[]',
  "active" BOOLEAN NOT NULL DEFAULT true,
  "createdBy" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "AiCallAgent_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "AiCallCampaign" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "agentId" TEXT NOT NULL,
  "goal" TEXT NOT NULL,
  "status" "AiCallCampaignStatus" NOT NULL DEFAULT 'DRAFT',
  "scheduledStart" TIMESTAMP(3),
  "callingHours" JSONB,
  "maxAttempts" INTEGER NOT NULL DEFAULT 1,
  "retryDelayMinutes" INTEGER NOT NULL DEFAULT 1440,
  "maxConcurrentCalls" INTEGER NOT NULL DEFAULT 1,
  "informationTemplate" TEXT,
  "whatsappTemplate" TEXT,
  "emailTemplate" TEXT,
  "complianceConfig" JSONB,
  "createdBy" TEXT,
  "startedAt" TIMESTAMP(3),
  "pausedAt" TIMESTAMP(3),
  "stoppedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "AiCallCampaign_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "AiCallCampaignCustomer" (
  "id" TEXT NOT NULL,
  "campaignId" TEXT NOT NULL,
  "customerId" TEXT NOT NULL,
  "phone" TEXT NOT NULL,
  "status" "AiCallLeadStatus" NOT NULL DEFAULT 'queued',
  "attemptCount" INTEGER NOT NULL DEFAULT 0,
  "nextAttemptAt" TIMESTAMP(3),
  "lastAttemptAt" TIMESTAMP(3),
  "eligibilitySnapshot" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "AiCallCampaignCustomer_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "AiCall" (
  "id" TEXT NOT NULL,
  "campaignId" TEXT,
  "customerId" TEXT NOT NULL,
  "agentId" TEXT NOT NULL,
  "vobizCallId" TEXT,
  "status" "AiCallStatus" NOT NULL DEFAULT 'queued',
  "outcome" "AiCallOutcome",
  "attempt" INTEGER NOT NULL DEFAULT 1,
  "phone" TEXT NOT NULL,
  "startedAt" TIMESTAMP(3),
  "answeredAt" TIMESTAMP(3),
  "endedAt" TIMESTAMP(3),
  "duration" INTEGER,
  "summary" JSONB,
  "usage" JSONB,
  "error" TEXT,
  "idempotencyKey" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "AiCall_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "AiCallMessage" (
  "id" TEXT NOT NULL,
  "callId" TEXT NOT NULL,
  "role" "AiCallMessageRole" NOT NULL,
  "content" TEXT NOT NULL,
  "language" TEXT,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AiCallMessage_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "AiCallAction" (
  "id" TEXT NOT NULL,
  "callId" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "status" "AiCallActionStatus" NOT NULL DEFAULT 'pending',
  "idempotencyKey" TEXT NOT NULL,
  "payload" JSONB,
  "result" JSONB,
  "error" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "AiCallAction_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "AiCallCallback" (
  "id" TEXT NOT NULL,
  "customerId" TEXT NOT NULL,
  "campaignId" TEXT,
  "callId" TEXT,
  "scheduledAt" TIMESTAMP(3) NOT NULL,
  "timezone" TEXT NOT NULL,
  "notes" TEXT,
  "status" TEXT NOT NULL DEFAULT 'scheduled',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "AiCallCallback_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "AiCallCampaignCustomer_campaignId_customerId_key" ON "AiCallCampaignCustomer"("campaignId", "customerId");
CREATE UNIQUE INDEX IF NOT EXISTS "AiCall_vobizCallId_key" ON "AiCall"("vobizCallId") WHERE "vobizCallId" IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS "AiCall_idempotencyKey_key" ON "AiCall"("idempotencyKey");
CREATE UNIQUE INDEX IF NOT EXISTS "AiCallAction_idempotencyKey_key" ON "AiCallAction"("idempotencyKey");

CREATE INDEX IF NOT EXISTS "Customer_leadStatus_idx" ON "Customer"("leadStatus");
CREATE INDEX IF NOT EXISTS "Customer_doNotCall_idx" ON "Customer"("doNotCall");
CREATE INDEX IF NOT EXISTS "Customer_city_idx" ON "Customer"("city");
CREATE INDEX IF NOT EXISTS "Customer_petType_idx" ON "Customer"("petType");
CREATE INDEX IF NOT EXISTS "CustomerLeadStatusHistory_customerId_idx" ON "CustomerLeadStatusHistory"("customerId");
CREATE INDEX IF NOT EXISTS "CustomerLeadStatusHistory_callId_idx" ON "CustomerLeadStatusHistory"("callId");
CREATE INDEX IF NOT EXISTS "CustomerLeadStatusHistory_nextStatus_idx" ON "CustomerLeadStatusHistory"("nextStatus");
CREATE INDEX IF NOT EXISTS "CustomerLeadStatusHistory_createdAt_idx" ON "CustomerLeadStatusHistory"("createdAt");
CREATE INDEX IF NOT EXISTS "AiCallAgent_active_idx" ON "AiCallAgent"("active");
CREATE INDEX IF NOT EXISTS "AiCallAgent_createdAt_idx" ON "AiCallAgent"("createdAt");
CREATE INDEX IF NOT EXISTS "AiCallCampaign_agentId_idx" ON "AiCallCampaign"("agentId");
CREATE INDEX IF NOT EXISTS "AiCallCampaign_status_idx" ON "AiCallCampaign"("status");
CREATE INDEX IF NOT EXISTS "AiCallCampaign_scheduledStart_idx" ON "AiCallCampaign"("scheduledStart");
CREATE INDEX IF NOT EXISTS "AiCallCampaign_createdAt_idx" ON "AiCallCampaign"("createdAt");
CREATE INDEX IF NOT EXISTS "AiCallCampaignCustomer_campaignId_idx" ON "AiCallCampaignCustomer"("campaignId");
CREATE INDEX IF NOT EXISTS "AiCallCampaignCustomer_customerId_idx" ON "AiCallCampaignCustomer"("customerId");
CREATE INDEX IF NOT EXISTS "AiCallCampaignCustomer_status_idx" ON "AiCallCampaignCustomer"("status");
CREATE INDEX IF NOT EXISTS "AiCallCampaignCustomer_nextAttemptAt_idx" ON "AiCallCampaignCustomer"("nextAttemptAt");
CREATE INDEX IF NOT EXISTS "AiCall_campaignId_idx" ON "AiCall"("campaignId");
CREATE INDEX IF NOT EXISTS "AiCall_customerId_idx" ON "AiCall"("customerId");
CREATE INDEX IF NOT EXISTS "AiCall_agentId_idx" ON "AiCall"("agentId");
CREATE INDEX IF NOT EXISTS "AiCall_status_idx" ON "AiCall"("status");
CREATE INDEX IF NOT EXISTS "AiCall_outcome_idx" ON "AiCall"("outcome");
CREATE INDEX IF NOT EXISTS "AiCall_createdAt_idx" ON "AiCall"("createdAt");
CREATE INDEX IF NOT EXISTS "AiCallMessage_callId_idx" ON "AiCallMessage"("callId");
CREATE INDEX IF NOT EXISTS "AiCallMessage_role_idx" ON "AiCallMessage"("role");
CREATE INDEX IF NOT EXISTS "AiCallMessage_createdAt_idx" ON "AiCallMessage"("createdAt");
CREATE INDEX IF NOT EXISTS "AiCallAction_callId_idx" ON "AiCallAction"("callId");
CREATE INDEX IF NOT EXISTS "AiCallAction_type_idx" ON "AiCallAction"("type");
CREATE INDEX IF NOT EXISTS "AiCallAction_status_idx" ON "AiCallAction"("status");
CREATE INDEX IF NOT EXISTS "AiCallAction_createdAt_idx" ON "AiCallAction"("createdAt");
CREATE INDEX IF NOT EXISTS "AiCallCallback_customerId_idx" ON "AiCallCallback"("customerId");
CREATE INDEX IF NOT EXISTS "AiCallCallback_campaignId_idx" ON "AiCallCallback"("campaignId");
CREATE INDEX IF NOT EXISTS "AiCallCallback_callId_idx" ON "AiCallCallback"("callId");
CREATE INDEX IF NOT EXISTS "AiCallCallback_scheduledAt_idx" ON "AiCallCallback"("scheduledAt");
CREATE INDEX IF NOT EXISTS "AiCallCallback_status_idx" ON "AiCallCallback"("status");

DO $$ BEGIN
  ALTER TABLE "CustomerLeadStatusHistory" ADD CONSTRAINT "CustomerLeadStatusHistory_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "CustomerLeadStatusHistory" ADD CONSTRAINT "CustomerLeadStatusHistory_callId_fkey" FOREIGN KEY ("callId") REFERENCES "AiCall"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "AiCallCampaign" ADD CONSTRAINT "AiCallCampaign_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "AiCallAgent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "AiCallCampaignCustomer" ADD CONSTRAINT "AiCallCampaignCustomer_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "AiCallCampaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "AiCallCampaignCustomer" ADD CONSTRAINT "AiCallCampaignCustomer_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "AiCall" ADD CONSTRAINT "AiCall_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "AiCallCampaign"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "AiCall" ADD CONSTRAINT "AiCall_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "AiCall" ADD CONSTRAINT "AiCall_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "AiCallAgent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "AiCallMessage" ADD CONSTRAINT "AiCallMessage_callId_fkey" FOREIGN KEY ("callId") REFERENCES "AiCall"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "AiCallAction" ADD CONSTRAINT "AiCallAction_callId_fkey" FOREIGN KEY ("callId") REFERENCES "AiCall"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "AiCallCallback" ADD CONSTRAINT "AiCallCallback_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "AiCallCallback" ADD CONSTRAINT "AiCallCallback_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "AiCallCampaign"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "AiCallCallback" ADD CONSTRAINT "AiCallCallback_callId_fkey" FOREIGN KEY ("callId") REFERENCES "AiCall"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null;
END $$;
