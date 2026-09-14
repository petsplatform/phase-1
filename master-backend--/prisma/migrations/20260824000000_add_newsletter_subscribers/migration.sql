CREATE TABLE IF NOT EXISTS "NewsletterSubscriber" (
  "id" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "name" TEXT,
  "source" TEXT NOT NULL DEFAULT 'website',
  "status" "RecordStatus" NOT NULL DEFAULT 'Active',
  "topics" TEXT[] NOT NULL DEFAULT ARRAY['pet_essentials', 'pet_care_tips', 'offers']::TEXT[],
  "confirmedAt" TIMESTAMP(3),
  "lastConfirmationEmailAt" TIMESTAMP(3),
  "lastUpdateEmailAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "NewsletterSubscriber_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "NewsletterSubscriber_email_key" ON "NewsletterSubscriber"("email");
CREATE INDEX IF NOT EXISTS "NewsletterSubscriber_status_idx" ON "NewsletterSubscriber"("status");
CREATE INDEX IF NOT EXISTS "NewsletterSubscriber_createdAt_idx" ON "NewsletterSubscriber"("createdAt");
CREATE INDEX IF NOT EXISTS "NewsletterSubscriber_lastUpdateEmailAt_idx" ON "NewsletterSubscriber"("lastUpdateEmailAt");
