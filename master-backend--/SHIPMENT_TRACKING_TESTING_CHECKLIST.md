# Shipment & Courier Tracking Testing Checklist

## Database
- Run tenant migrations and confirm `Order` has shipment fields.
- Confirm `Courier`, `ShipmentHistory`, and `ShipmentSettings` exist in every tenant database.
- Confirm default couriers are seeded once.

## Admin APIs
- `GET /api/shipments` returns paginated shipment records.
- `GET /api/orders/:id/shipment` returns shipment and timeline.
- `POST /api/orders/:id/shipment` rejects cancelled orders.
- `POST /api/orders/:id/shipment` requires courier and tracking number.
- `POST /api/orders/:id/shipment` rejects duplicate tracking numbers.
- `PUT /api/orders/:id/shipment/status` rejects Delivered before Shipped.
- `DELETE /api/orders/:id/shipment` marks shipment Cancelled.
- `POST /api/shipments/bulk` reports per-row success and failure.
- Courier CRUD endpoints require admin authentication.

## Customer APIs
- `GET /api/customer/orders/:id/shipment` only returns the logged-in customer's order.
- `GET /api/customer/orders/:id/tracking` only returns the logged-in customer's order.
- Tracking response includes progress, timeline, courier, tracking number, estimated delivery, and shipping address.

## Admin UI
- Orders menu shows Shipment Management.
- Shipment Management loads couriers, settings summary, filters, and shipment table.
- Bulk CSV accepts `Order Number, Tracking Number, AWB Number`.
- Order Details can create/update shipment details.
- Status buttons append timeline rows.
- Cancel Shipment changes status and refreshes order data.

## Customer UI
- My Orders shows courier, tracking number, status, estimated delivery, and tracking action after shipment exists.
- External tracking URL opens courier website.
- Internal tracking page shows progress bar, timeline, courier information, and shipping address.

## Notifications, Email, Audit
- Shipment create/update/status changes write audit log metadata with old/new values.
- Customer notifications are created for shipment status updates.
- Admin notifications are created for shipment creation and delivery completion.
- Shipment emails are sent for created/status events when SMTP is configured.
