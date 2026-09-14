-- CreateEnum
CREATE TYPE "SupportConversationStatus" AS ENUM ('OPEN', 'WAITING_FOR_AGENT', 'ASSIGNED', 'IN_PROGRESS', 'WAITING_FOR_CUSTOMER', 'RESOLVED', 'CLOSED');

-- CreateEnum
CREATE TYPE "SupportPriority" AS ENUM ('LOW', 'NORMAL', 'HIGH', 'URGENT');

-- CreateEnum
CREATE TYPE "SupportSource" AS ENUM ('WEBSITE', 'PETGPT', 'ORDER', 'PRODUCT', 'CHECKOUT');

-- CreateEnum
CREATE TYPE "SupportSenderType" AS ENUM ('CUSTOMER', 'AGENT', 'SYSTEM', 'BOT');

-- CreateEnum
CREATE TYPE "SupportMessageType" AS ENUM ('TEXT', 'IMAGE', 'FILE', 'ORDER_REFERENCE', 'PRODUCT_REFERENCE', 'SYSTEM', 'INTERNAL_NOTE');

-- CreateTable
CREATE TABLE "SupportConversation" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "assignedAgentId" TEXT,
    "status" "SupportConversationStatus" NOT NULL DEFAULT 'WAITING_FOR_AGENT',
    "priority" "SupportPriority" NOT NULL DEFAULT 'NORMAL',
    "subject" TEXT,
    "source" "SupportSource" NOT NULL DEFAULT 'WEBSITE',
    "orderId" TEXT,
    "productId" TEXT,
    "metadata" JSONB,
    "customerUnread" INTEGER NOT NULL DEFAULT 0,
    "agentUnread" INTEGER NOT NULL DEFAULT 0,
    "lastMessageAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "firstResponseAt" TIMESTAMP(3),
    "resolvedAt" TIMESTAMP(3),
    "closedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SupportConversation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SupportMessage" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "senderId" TEXT,
    "senderType" "SupportSenderType" NOT NULL,
    "message" TEXT NOT NULL,
    "messageType" "SupportMessageType" NOT NULL DEFAULT 'TEXT',
    "metadata" JSONB,
    "clientMessageId" TEXT,
    "deliveredAt" TIMESTAMP(3),
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SupportMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SupportRating" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "feedback" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SupportRating_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SupportSettings" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "supportName" TEXT NOT NULL DEFAULT 'Customer Support',
    "welcomeMessage" TEXT NOT NULL DEFAULT 'Hi! How can we help you today?',
    "offlineMessage" TEXT NOT NULL DEFAULT 'Our support team is currently unavailable, but you can leave a message.',
    "autoAssignmentEnabled" BOOLEAN NOT NULL DEFAULT false,
    "maxConversationsPerAgent" INTEGER NOT NULL DEFAULT 5,
    "fileUploadEnabled" BOOLEAN NOT NULL DEFAULT false,
    "ratingEnabled" BOOLEAN NOT NULL DEFAULT true,
    "emailNotificationsEnabled" BOOLEAN NOT NULL DEFAULT false,
    "availability" JSONB,
    "autoCloseResolvedAfterDays" INTEGER NOT NULL DEFAULT 7,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SupportSettings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SupportConversation_customerId_idx" ON "SupportConversation"("customerId");
CREATE INDEX "SupportConversation_assignedAgentId_idx" ON "SupportConversation"("assignedAgentId");
CREATE INDEX "SupportConversation_status_idx" ON "SupportConversation"("status");
CREATE INDEX "SupportConversation_priority_idx" ON "SupportConversation"("priority");
CREATE INDEX "SupportConversation_source_idx" ON "SupportConversation"("source");
CREATE INDEX "SupportConversation_orderId_idx" ON "SupportConversation"("orderId");
CREATE INDEX "SupportConversation_productId_idx" ON "SupportConversation"("productId");
CREATE INDEX "SupportConversation_lastMessageAt_idx" ON "SupportConversation"("lastMessageAt");
CREATE UNIQUE INDEX "SupportMessage_conversationId_clientMessageId_key" ON "SupportMessage"("conversationId", "clientMessageId");
CREATE INDEX "SupportMessage_conversationId_idx" ON "SupportMessage"("conversationId");
CREATE INDEX "SupportMessage_senderType_idx" ON "SupportMessage"("senderType");
CREATE INDEX "SupportMessage_messageType_idx" ON "SupportMessage"("messageType");
CREATE INDEX "SupportMessage_createdAt_idx" ON "SupportMessage"("createdAt");
CREATE UNIQUE INDEX "SupportRating_conversationId_key" ON "SupportRating"("conversationId");
CREATE INDEX "SupportRating_customerId_idx" ON "SupportRating"("customerId");
CREATE INDEX "SupportRating_rating_idx" ON "SupportRating"("rating");
CREATE INDEX "SupportRating_createdAt_idx" ON "SupportRating"("createdAt");

-- AddForeignKey
ALTER TABLE "SupportConversation" ADD CONSTRAINT "SupportConversation_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SupportConversation" ADD CONSTRAINT "SupportConversation_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "SupportConversation" ADD CONSTRAINT "SupportConversation_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "SupportMessage" ADD CONSTRAINT "SupportMessage_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "SupportConversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SupportRating" ADD CONSTRAINT "SupportRating_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "SupportConversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SupportRating" ADD CONSTRAINT "SupportRating_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;
