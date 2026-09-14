# AI Pet Health & Shopping Assistant

The customer storefront renders a floating Pet Assistant widget backed by the existing PetGPT API. It is a tenant-aware pet health and shopping assistant, not a separate demo application.

## API Endpoints

- `POST /api/petgpt/chat`
- `POST /api/customer-panel/petgpt/chat`

Request body:

```json
{
  "message": "My dog is itching",
  "conversationId": "optional-session-id",
  "petId": "optional-owned-pet-id",
  "clientMessageId": "optional-idempotency-id"
}
```

The response returns structured conversation state, intent, risk level, product cards, actions, and suggestions.

## Architecture

- `src/routes/petgptRoutes.js` resolves optional customer auth and rate limits chat.
- `src/services/petgptService.js` collects pet and health context, persists conversations, runs safe product search, checks order ownership, applies deterministic safety gates, and delegates OpenAI understanding/wording to `src/services/openaiService.js` when enabled.
- `src/services/openaiService.js` is the single OpenAI SDK integration point. It uses the Responses API for structured routing decisions and grounded assistant messages.
- `src/prompts/petgptSystemPrompt.js` contains assistant safety and product-grounding instructions.
- `prisma/schema.prisma` includes `Pet`, `PetGPTConversation`, `PetGPTMessage`, `PetGPTSymptom`, and `PetGPTAnalyticsEvent`.

## Environment Variables

- `PETGPT_AI_ENABLED=true`
- `OPENAI_API_KEY=<secret>` in the backend environment only
- `OPENAI_MODEL=gpt-5.6-sol`

Legacy fallbacks `PETGPT_AI_API_KEY` and `PETGPT_AI_MODEL` are still accepted, but new deployments should use `OPENAI_API_KEY` and `OPENAI_MODEL`.

When AI is disabled or unavailable, the backend still returns deterministic safety, product, and order responses. OpenAI errors are logged server-side without secrets and can return a safe `type: "error"` message when the AI was needed for an otherwise unknown turn. Client errors do not expose provider details.

## Chatbot Tools

- `searchProducts()` searches active tenant catalog products and returns in-stock, non-vet-only recommendations.
- `getProductDetails(productId)` returns serialized product details from the active tenant database.
- `checkInventory(productId)` returns current inventory from the active tenant database.

Products, prices, stock, prescription flags, and order details always come from Prisma queries. The assistant must not fabricate catalog or order data.

## Medical Safety

The assistant does not diagnose, prescribe, or provide dosages. Emergency or high-risk signals such as breathing distress, collapse, seizures, poisoning, severe bleeding, blood in vomit or stool, severe weakness, or refusal to drink trigger veterinary guidance and suppress product recommendations.

Prescription-required products remain subject to the existing checkout prescription upload flow. Vet-only products are excluded from assistant recommendations.

## Tenant Isolation And Security

Public routes run through `resolvePublicTenant`, and the Prisma proxy in `src/config/db.js` uses the current tenant context. Chat conversations, pets, product searches, carts, and orders stay scoped to the resolved store or tenant.

Customer identity is derived from the optional customer JWT. The API does not trust `customerId`, `storeId`, tenant IDs, or order ownership from request bodies.

## Testing

Run the chatbot service tests:

```bash
npm test -- --runInBand src/services/petgptService.test.js
```
