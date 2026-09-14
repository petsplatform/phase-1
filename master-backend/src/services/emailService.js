const nodemailer = require("nodemailer");
const fs = require("fs");
const path = require("path");
const { getCurrentStore } = require("../config/tenantContext");
const ApiError = require("../utils/apiError");
const { getRawSettings } = require("./settingsService");

const DEFAULT_STORE_NAME = "Best Vet Care";
const STORE_EMAIL_BRANDS = {
  STORE_1: "Best Vet Care",
  STORE_2: "Paws And Care",
  STORE_3: "Healthy Paws Store",
  STORE_4: "Vet Supply Express",
  STORE_5: "Happy pet",
  STORE_6: "Pet Meds Direct",
  STORE_7: "Budget Petshop",
};
const STORE_LOGO_FILES = {
  STORE_1: "logo1.png",
  STORE_2: "logo2.png",
  STORE_3: "logo3.png",
  STORE_4: "logo4.png",
  STORE_5: "logo5.png",
  STORE_6: "logo6.png",
  STORE_7: "logo7.png",
};
const logoDataUriCache = new Map();

async function getSmtpConfig({ forceEnv = false } = {}) {
  const store = getCurrentStore();
  const shouldUseStoreSettings = store && !forceEnv;
  const settings = shouldUseStoreSettings ? await getRawSettings().catch(() => null) : null;
  const smtpEmail = String(
    shouldUseStoreSettings ? settings?.smtpEmail || "" : process.env.SMTP_EMAIL || "",
  ).trim();
  const smtpHost = String(
    shouldUseStoreSettings ? settings?.smtpHost || "" : process.env.SMTP_HOST || "",
  ).trim();
  const rawSmtpPass = shouldUseStoreSettings ? settings?.smtpPass || "" : process.env.SMTP_PASS || "";
  const smtpPass = normalizeSmtpPassword(rawSmtpPass, smtpHost);
  const smtpPort = Number(
    shouldUseStoreSettings ? settings?.smtpPort || 587 : process.env.SMTP_PORT || 587,
  );

  if (!smtpEmail || !smtpPass || !smtpHost || !smtpPort) {
    throw new ApiError(500, "Email service is not configured. Please contact support.");
  }

  return {
    smtpEmail,
    smtpPass,
    smtpHost,
    smtpPort,
  };
}

async function createTransporter(options) {
  const { smtpEmail, smtpPass, smtpHost, smtpPort } = await getSmtpConfig(options);

  return {
    fromEmail: smtpEmail,
    transporter: nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpPort === 465,
      connectionTimeout: 8000,
      greetingTimeout: 8000,
      socketTimeout: 12000,
      auth: {
        user: smtpEmail,
        pass: smtpPass,
      },
    }),
  };
}

async function sendEmail({ to, subject, text, html, brand = getEmailBrand(), forceEnvSmtp = false }) {
  const { fromEmail, transporter } = await createTransporter({ forceEnv: forceEnvSmtp });
  const recipient = String(to || "").trim().toLowerCase();
  const info = await sendMailWithRetry(transporter, {
    from: `"${brand.name}" <${fromEmail}>`,
    to: recipient,
    subject,
    text,
    html,
  });

  const accepted = (info.accepted || []).map((email) => String(email).trim().toLowerCase());
  if (!accepted.includes(recipient)) {
    throw new Error(`Recipient rejected: ${recipient}`);
  }

  return info;
}

async function sendOtpEmail({ email, code, brand = getEmailBrand() }) {

  try {
    const info = await sendEmail({
      to: email,
      brand,
      forceEnvSmtp: true,
      subject: `Your ${brand.name} login OTP`,
      text: `Your ${brand.name} login OTP is ${code}. This code expires in 10 minutes.`,
      html: `
        <p>Your ${escapeHtml(brand.name)} login OTP is:</p>
        <h2 style="letter-spacing: 4px;">${code}</h2>
        <p>This code expires in 10 minutes.</p>
      `,
    });

    console.info(`[${brand.name}] OTP email accepted`, {
      to: email,
      messageId: info.messageId,
    });
  } catch (error) {
    if (shouldUseLocalEmailFallback(error)) {
      console.warn(`[${brand.name}] OTP email fallback used`, {
        to: email,
        reason: error.message,
      });
      return { delivered: false, fallback: true };
    }
    if (error instanceof ApiError) {
      throw new ApiError(500, "Email OTP service is not configured. Please contact support.");
    }
    throw new ApiError(502, "Could not send OTP email. Please try again.");
  }

  return { delivered: true };
}

async function sendOrderConfirmationEmail(order, brand = getEmailBrand()) {
  const items = Array.isArray(order.items) ? order.items : [];
  const orderView = buildOrderEmailView(order, items, brand);
  const invoiceHtml = renderInvoiceHtml(order, brand);

  const itemText = items
    .map((item) => `- ${item.name} x ${item.quantity} - ${formatMoney(getLineTotal(item))}`)
    .join("\n");

  const info = await sendEmail({
    to: order.email,
    brand,
    subject: `Your ${brand.name} order is confirmed - ${order.id}`,
    text: [
      `Hi ${order.customerName},`,
      "",
      `Thank you for shopping with ${brand.name}.`,
      `Your order ${order.id} has been placed successfully and is now being processed.`,
      `Order total: ${orderView.total}`,
      `Payment status: ${order.paymentStatus}`,
      `Payment method: ${orderView.paymentMethod}`,
      `Invoice number: INV-${order.id}`,
      orderView.shippingAddress ? `Shipping address: ${orderView.shippingAddress}` : null,
      "",
      "Items:",
      itemText || "- No item details available",
      "",
      "We will notify you when your order status changes.",
      "Need help? Reply to this email and our support team will assist you.",
      brand.name,
    ].filter(Boolean).join("\n"),
    html: `${renderOrderConfirmationHtml(orderView)}${invoiceHtml}`,
  });

  console.info(`[${brand.name}] Order confirmation email accepted`, {
    orderId: order.id,
    to: order.email,
    messageId: info.messageId,
  });

  return { delivered: true, messageId: info.messageId };
}

async function sendRegistrationConfirmationEmail(customer, brand = getEmailBrand()) {
  const firstName = String(customer?.name || "Pet Parent").trim().split(/\s+/)[0] || "Pet Parent";
  const info = await sendEmail({
    to: customer.email,
    brand,
    subject: `Welcome to ${brand.name}`,
    text: [
      `Hi ${firstName},`,
      "",
      `Your ${brand.name} account has been created successfully.`,
      "You can now sign in, manage your profile, save addresses, and track your orders from your account.",
      "",
      `Thank you for joining ${brand.name}.`,
      brand.name,
    ].join("\n"),
    html: renderRegistrationConfirmationHtml(customer, brand),
  });

  console.info(`[${brand.name}] Registration confirmation email accepted`, {
    customerId: customer.id,
    to: customer.email,
    messageId: info.messageId,
  });

  return { delivered: true, messageId: info.messageId };
}

async function sendSubscriptionConfirmationEmail(subscriber, brand = getEmailBrand()) {
  const firstName = String(subscriber?.name || "Pet Parent").trim().split(/\s+/)[0] || "Pet Parent";
  const info = await sendEmail({
    to: subscriber.email,
    brand,
    subject: `You're subscribed to ${brand.name} updates`,
    text: [
      `Hi ${firstName},`,
      "",
      `Your ${brand.name} subscription is confirmed.`,
      "You will receive updates about new pet essentials, pet care tips, and offers.",
      "",
      `Thanks for subscribing to ${brand.name}.`,
      brand.name,
    ].join("\n"),
    html: renderSubscriptionConfirmationHtml(subscriber, brand),
  });

  console.info(`[${brand.name}] Subscription confirmation email accepted`, {
    subscriberId: subscriber.id,
    to: subscriber.email,
    messageId: info.messageId,
  });

  return { delivered: true, messageId: info.messageId };
}

async function sendNewsletterUpdateEmail({ subscriber, subject, title, body, ctaText, ctaUrl }, brand = getEmailBrand()) {
  const firstName = String(subscriber?.name || "Pet Parent").trim().split(/\s+/)[0] || "Pet Parent";
  const safeTitle = title || subject || `${brand.name} update`;
  const info = await sendEmail({
    to: subscriber.email,
    brand,
    subject: subject || `${brand.name} update`,
    text: [
      `Hi ${firstName},`,
      "",
      safeTitle,
      "",
      body,
      "",
      ctaUrl ? `${ctaText || "Shop now"}: ${ctaUrl}` : null,
      "",
      `You are receiving this because you subscribed to ${brand.name} updates.`,
      brand.name,
    ].filter(Boolean).join("\n"),
    html: renderNewsletterUpdateHtml({ subscriber, title: safeTitle, body, ctaText, ctaUrl, brand }),
  });

  console.info(`[${brand.name}] Newsletter update email accepted`, {
    subscriberId: subscriber.id,
    to: subscriber.email,
    messageId: info.messageId,
  });

  return { delivered: true, messageId: info.messageId };
}

async function sendOrderStatusUpdateEmail(order, previousStatus, brand = getEmailBrand()) {
  const nextStatus = formatOrderStatus(order.orderStatus);
  const oldStatus = formatOrderStatus(previousStatus);
  const info = await sendEmail({
    to: order.email,
    brand,
    subject: `Your ${brand.name} order is ${nextStatus} - ${order.id}`,
    text: [
      `Hi ${order.customerName || "Pet Parent"},`,
      "",
      oldStatus && oldStatus !== nextStatus
        ? `Your order ${order.id} status changed from ${oldStatus} to ${nextStatus}.`
        : `Your order ${order.id} status is now ${nextStatus}.`,
      `Order total: ${formatMoney(order.total)}`,
      `Payment status: ${order.paymentStatus || "Pending"}`,
      order.trackingNumber ? `Tracking number: ${order.trackingNumber}` : null,
      order.courierName ? `Courier: ${order.courierName}` : null,
      "",
      "We will keep you posted as your order moves forward.",
      "Need help? Reply to this email and our support team will assist you.",
      brand.name,
    ].filter(Boolean).join("\n"),
    html: renderOrderStatusUpdateHtml(order, previousStatus, brand),
  });

  console.info(`[${brand.name}] Order status email accepted`, {
    orderId: order.id,
    to: order.email,
    status: order.orderStatus,
    messageId: info.messageId,
  });

  return { delivered: true, messageId: info.messageId };
}

async function sendAbandonedCartEmail({ customer, items, coupon, cartTotal, checkoutUrl, brand = getEmailBrand() }) {
  const itemList = (Array.isArray(items) ? items : [])
    .slice(0, 5)
    .map((item) => `- ${item.name || "Cart item"} x ${item.quantity || 1} - ${formatMoney(getLineTotal(item))}`)
    .join("\n");
  const couponText = coupon
    ? `${coupon.code} for ${coupon.type === "percentage" ? `${Number(coupon.value || 0)}% off` : `${formatMoney(coupon.value)} off`}`
    : "your cart recovery discount";

  const info = await sendEmail({
    to: customer.email,
    brand,
    subject: `Still thinking it over? Save on your ${brand.name} cart`,
    text: [
      `Hi ${customer.name || "Pet Parent"},`,
      "",
      `You left some pet essentials in your ${brand.name} cart.`,
      `Use coupon ${couponText} when you checkout.`,
      `Cart total: ${formatMoney(cartTotal)}`,
      "",
      "Items:",
      itemList || "- Your saved cart items",
      "",
      checkoutUrl ? `Complete checkout: ${checkoutUrl}` : null,
      "",
      "This reminder was sent because items were added to your cart but checkout was not completed.",
      brand.name,
    ].filter(Boolean).join("\n"),
    html: renderAbandonedCartHtml({ customer, items, coupon, cartTotal, checkoutUrl, brand }),
  });

  console.info(`[${brand.name}] Abandoned cart email accepted`, {
    customerId: customer.id,
    to: customer.email,
    messageId: info.messageId,
  });

  return { delivered: true, messageId: info.messageId };
}

function renderAbandonedCartHtml({ customer, items = [], coupon, cartTotal, checkoutUrl, brand }) {
  const itemRows = items.slice(0, 5).map((item) => `
    <tr>
      <td style="padding:12px 0; border-bottom:1px solid #edf2f7; font-size:14px; font-weight:800; color:#122a50;">${escapeHtml(item.name || "Cart item")}</td>
      <td align="center" style="padding:12px 10px; border-bottom:1px solid #edf2f7; font-size:13px; font-weight:700; color:#64748b;">${escapeHtml(item.quantity || 1)}</td>
      <td align="right" style="padding:12px 0; border-bottom:1px solid #edf2f7; font-size:14px; font-weight:800; color:#122a50;">${escapeHtml(formatMoney(getLineTotal(item)))}</td>
    </tr>
  `).join("");
  const discountLabel = coupon
    ? coupon.type === "percentage"
      ? `${Number(coupon.value || 0)}% OFF`
      : `${formatMoney(coupon.value)} OFF`
    : "Special discount";

  return `
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#f7f4ed; margin:0; padding:0;">
      <tr>
        <td align="center" style="padding:28px 14px;">
          <table role="presentation" width="640" cellspacing="0" cellpadding="0" border="0" style="width:100%; max-width:640px; font-family:Arial, Helvetica, sans-serif; color:#122a50;">
            <tr>
              <td style="font-size:24px; line-height:30px; font-weight:800; color:#17345f; padding:0 0 14px;">${escapeHtml(brand.name)}</td>
            </tr>
            <tr>
              <td style="overflow:hidden; border-radius:18px; background:#ffffff; border:1px solid #e7dfcf; box-shadow:0 10px 28px rgba(18,42,80,0.08);">
                <div style="background:#17345f; color:#ffffff; padding:28px 30px;">
                  <div style="display:inline-block; margin-bottom:14px; padding:6px 12px; border-radius:999px; background:#d9aa3d; color:#17345f; font-size:12px; font-weight:800; text-transform:uppercase;">${escapeHtml(discountLabel)}</div>
                  <h1 style="margin:0; font-size:26px; line-height:34px; font-weight:800;">Your cart is waiting, ${escapeHtml(customer.name || "Pet Parent")}.</h1>
                  <p style="margin:10px 0 0; font-size:15px; line-height:23px; color:#eef4ff;">Complete checkout and use your recovery discount before it expires.</p>
                </div>
                <div style="padding:24px 30px;">
                  ${coupon ? `
                    <div style="margin-bottom:18px; border:1px dashed #d9aa3d; border-radius:14px; background:#fffaf0; padding:16px;">
                      <div style="font-size:12px; font-weight:800; color:#64748b; text-transform:uppercase;">Coupon code</div>
                      <div style="margin-top:6px; font-size:24px; font-weight:900; letter-spacing:1px; color:#17345f;">${escapeHtml(coupon.code)}</div>
                    </div>
                  ` : ""}
                  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="border-collapse:collapse;">
                    <thead>
                      <tr>
                        <th align="left" style="padding:10px 0; border-bottom:1px solid #e7dfcf; font-size:12px; color:#64748b; text-transform:uppercase;">Item</th>
                        <th align="center" style="padding:10px; border-bottom:1px solid #e7dfcf; font-size:12px; color:#64748b; text-transform:uppercase;">Qty</th>
                        <th align="right" style="padding:10px 0; border-bottom:1px solid #e7dfcf; font-size:12px; color:#64748b; text-transform:uppercase;">Amount</th>
                      </tr>
                    </thead>
                    <tbody>${itemRows || `<tr><td colspan="3" style="padding:16px 0; color:#64748b;">Your saved cart items</td></tr>`}</tbody>
                  </table>
                  <div style="margin-top:18px; text-align:right; font-size:18px; font-weight:900; color:#17345f;">Cart total: ${escapeHtml(formatMoney(cartTotal))}</div>
                  ${checkoutUrl ? `
                    <div style="margin-top:22px;">
                      <a href="${escapeHtml(checkoutUrl)}" style="display:inline-block; border-radius:12px; background:#d9aa3d; color:#122a50; padding:13px 20px; font-size:14px; font-weight:900; text-decoration:none;">Complete Checkout</a>
                    </div>
                  ` : ""}
                </div>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  `;
}

function renderSubscriptionConfirmationHtml(subscriber, brand = getEmailBrand()) {
  const name = String(subscriber?.name || "Pet Parent").trim() || "Pet Parent";
  const topics = ["New pet essentials", "Pet care tips", "Offers and savings"];

  return `
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#f7f4ed; margin:0; padding:0;">
      <tr>
        <td align="center" style="padding:28px 14px;">
          <table role="presentation" width="640" cellspacing="0" cellpadding="0" border="0" style="width:100%; max-width:640px; font-family:Arial, Helvetica, sans-serif; color:#122a50;">
            <tr>
              <td style="font-size:24px; line-height:30px; font-weight:800; color:#17345f; padding:0 0 14px;">${escapeHtml(brand.name)}</td>
            </tr>
            <tr>
              <td style="overflow:hidden; border-radius:18px; background:#ffffff; border:1px solid #e7dfcf; box-shadow:0 10px 28px rgba(18,42,80,0.08);">
                <div style="background:#17345f; color:#ffffff; padding:28px 30px;">
                  <div style="display:inline-block; margin-bottom:14px; padding:6px 12px; border-radius:999px; background:#d9aa3d; color:#17345f; font-size:12px; font-weight:800; text-transform:uppercase;">Subscription confirmed</div>
                  <h1 style="margin:0; font-size:26px; line-height:34px; font-weight:800;">You're on the list, ${escapeHtml(name)}.</h1>
                  <p style="margin:10px 0 0; font-size:15px; line-height:23px; color:#eef4ff;">We will send helpful updates from ${escapeHtml(brand.name)}.</p>
                </div>
                <div style="padding:24px 30px;">
                  <p style="margin:0; font-size:15px; line-height:24px; color:#475569;">You will receive updates about:</p>
                  <ul style="margin:14px 0 0; padding-left:20px; color:#475569; font-size:14px; line-height:24px; font-weight:700;">
                    ${topics.map((topic) => `<li>${escapeHtml(topic)}</li>`).join("")}
                  </ul>
                  <div style="margin-top:20px; padding:16px; border-radius:14px; background:#fffaf0; border:1px solid #f0dfb4;">
                    <div style="font-size:12px; font-weight:800; color:#64748b; text-transform:uppercase;">Subscribed email</div>
                    <div style="margin-top:6px; font-size:15px; line-height:22px; font-weight:800; color:#122a50;">${escapeHtml(subscriber?.email || "")}</div>
                  </div>
                </div>
                <div style="padding:20px 30px; background:#fbf8f0; border-top:1px solid #eee4cf;">
                  <p style="margin:0; font-size:12px; line-height:19px; font-weight:600; color:#64748b;">Thanks for subscribing to ${escapeHtml(brand.name)}.</p>
                </div>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  `;
}

function renderNewsletterUpdateHtml({ subscriber, title, body, ctaText, ctaUrl, brand }) {
  const name = String(subscriber?.name || "Pet Parent").trim() || "Pet Parent";

  return `
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#f7f4ed; margin:0; padding:0;">
      <tr>
        <td align="center" style="padding:28px 14px;">
          <table role="presentation" width="640" cellspacing="0" cellpadding="0" border="0" style="width:100%; max-width:640px; font-family:Arial, Helvetica, sans-serif; color:#122a50;">
            <tr>
              <td style="font-size:24px; line-height:30px; font-weight:800; color:#17345f; padding:0 0 14px;">${escapeHtml(brand.name)}</td>
            </tr>
            <tr>
              <td style="overflow:hidden; border-radius:18px; background:#ffffff; border:1px solid #e7dfcf; box-shadow:0 10px 28px rgba(18,42,80,0.08);">
                <div style="background:#17345f; color:#ffffff; padding:28px 30px;">
                  <div style="display:inline-block; margin-bottom:14px; padding:6px 12px; border-radius:999px; background:#d9aa3d; color:#17345f; font-size:12px; font-weight:800; text-transform:uppercase;">${escapeHtml(brand.name)} update</div>
                  <h1 style="margin:0; font-size:26px; line-height:34px; font-weight:800;">${escapeHtml(title)}</h1>
                  <p style="margin:10px 0 0; font-size:15px; line-height:23px; color:#eef4ff;">Hi ${escapeHtml(name)}, here is what is new.</p>
                </div>
                <div style="padding:24px 30px;">
                  <p style="margin:0; font-size:15px; line-height:24px; color:#475569; white-space:pre-line;">${escapeHtml(body)}</p>
                  ${ctaUrl ? `
                    <div style="margin-top:22px;">
                      <a href="${escapeHtml(ctaUrl)}" style="display:inline-block; border-radius:12px; background:#d9aa3d; color:#122a50; padding:13px 20px; font-size:14px; font-weight:900; text-decoration:none;">${escapeHtml(ctaText || "Shop now")}</a>
                    </div>
                  ` : ""}
                </div>
                <div style="padding:20px 30px; background:#fbf8f0; border-top:1px solid #eee4cf;">
                  <p style="margin:0; font-size:12px; line-height:19px; font-weight:600; color:#64748b;">You are receiving this because you subscribed to ${escapeHtml(brand.name)} updates.</p>
                </div>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  `;
}

function buildOrderEmailView(order, items, brand = getEmailBrand()) {
  const subtotal = toFiniteMoney(order.subtotal);
  const shipping = toFiniteMoney(order.shipping);
  const tax = toFiniteMoney(order.tax);
  const discount = toFiniteMoney(order.discount);
  const total = toFiniteMoney(order.total);

  return {
    customerName: order.customerName || "Pet Parent",
    brand,
    id: order.id,
    total: formatMoney(total),
    subtotal: formatMoney(subtotal),
    shipping: formatMoney(shipping),
    tax: formatMoney(tax),
    discount: formatMoney(discount),
    hasDiscount: discount > 0,
    paymentStatus: order.paymentStatus || "Pending",
    paymentMethod: formatPaymentMethod(order.paymentMethod),
    shippingAddress: formatAddress(order.shippingAddress),
    items,
  };
}

function renderOrderConfirmationHtml(order) {
  const itemRows = order.items.length
    ? order.items.map(renderOrderItemRow).join("")
    : `<tr><td colspan="3" style="padding: 18px 0; color: #64748b;">No item details available</td></tr>`;

  return `
    <div style="display:none; max-height:0; overflow:hidden; opacity:0; color:transparent;">
      Your ${escapeHtml(order.brand.name)} order ${escapeHtml(order.id)} has been placed successfully.
    </div>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin:0; padding:0; width:100%; background:#f7f4ed;">
      <tr>
        <td align="center" style="padding:28px 14px;">
          <table role="presentation" width="640" cellspacing="0" cellpadding="0" border="0" style="width:100%; max-width:640px; border-collapse:collapse; font-family:Arial, Helvetica, sans-serif; color:#122a50;">
            <tr>
              <td style="padding:0 0 14px;">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                  <tr>
                    <td style="font-size:24px; line-height:30px; font-weight:800; color:#17345f;">
                      ${escapeHtml(order.brand.name)}
                    </td>
                    <td align="right" style="font-size:12px; line-height:18px; font-weight:700; color:#64748b;">
                      Order Confirmation
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <tr>
              <td style="border-radius:18px; overflow:hidden; background:#ffffff; border:1px solid #e7dfcf; box-shadow:0 10px 28px rgba(18,42,80,0.08);">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                  <tr>
                    <td style="background:#17345f; padding:28px 30px; color:#ffffff;">
                      <div style="display:inline-block; margin-bottom:14px; padding:6px 12px; border-radius:999px; background:#d9aa3d; color:#17345f; font-size:12px; line-height:16px; font-weight:800; text-transform:uppercase;">
                        Order placed
                      </div>
                      <h1 style="margin:0; font-size:26px; line-height:34px; font-weight:800;">Thank you for your order, ${escapeHtml(order.customerName)}.</h1>
                      <p style="margin:10px 0 0; font-size:15px; line-height:23px; color:#eef4ff;">
                        We received your order and will start processing it soon.
                      </p>
                    </td>
                  </tr>

                  <tr>
                    <td style="padding:26px 30px 10px;">
                      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#fffaf0; border:1px solid #f0dfb4; border-radius:14px;">
                        <tr>
                          <td style="padding:18px 18px; width:50%; vertical-align:top;">
                            <div style="font-size:12px; line-height:16px; font-weight:700; color:#64748b; text-transform:uppercase;">Order number</div>
                            <div style="margin-top:5px; font-size:15px; line-height:22px; font-weight:800; color:#122a50;">${escapeHtml(order.id)}</div>
                          </td>
                          <td style="padding:18px 18px; width:50%; vertical-align:top; border-left:1px solid #f0dfb4;">
                            <div style="font-size:12px; line-height:16px; font-weight:700; color:#64748b; text-transform:uppercase;">Order total</div>
                            <div style="margin-top:5px; font-size:20px; line-height:26px; font-weight:800; color:#17345f;">${escapeHtml(order.total)}</div>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>

                  <tr>
                    <td style="padding:18px 30px 8px;">
                      <h2 style="margin:0; font-size:18px; line-height:24px; font-weight:800; color:#122a50;">Order summary</h2>
                    </td>
                  </tr>

                  <tr>
                    <td style="padding:0 30px 22px;">
                      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="border-collapse:collapse;">
                        <thead>
                          <tr>
                            <th align="left" style="padding:10px 0; border-bottom:1px solid #e7dfcf; font-size:12px; line-height:16px; color:#64748b; text-transform:uppercase;">Item</th>
                            <th align="center" style="padding:10px 0; border-bottom:1px solid #e7dfcf; font-size:12px; line-height:16px; color:#64748b; text-transform:uppercase;">Qty</th>
                            <th align="right" style="padding:10px 0; border-bottom:1px solid #e7dfcf; font-size:12px; line-height:16px; color:#64748b; text-transform:uppercase;">Amount</th>
                          </tr>
                        </thead>
                        <tbody>${itemRows}</tbody>
                      </table>
                    </td>
                  </tr>

                  <tr>
                    <td style="padding:0 30px 24px;">
                      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                        <tr>
                          <td style="vertical-align:top; padding-right:12px; width:50%;">
                            <div style="border:1px solid #e7dfcf; border-radius:14px; padding:16px;">
                              <div style="font-size:13px; line-height:18px; font-weight:800; color:#122a50;">Ship to</div>
                              <div style="margin-top:8px; font-size:13px; line-height:20px; font-weight:600; color:#475569;">${escapeHtml(order.shippingAddress || "Shipping address not available")}</div>
                            </div>
                          </td>
                          <td style="vertical-align:top; padding-left:12px; width:50%;">
                            <div style="border:1px solid #e7dfcf; border-radius:14px; padding:16px;">
                              <div style="font-size:13px; line-height:18px; font-weight:800; color:#122a50;">Payment</div>
                              <div style="margin-top:8px; font-size:13px; line-height:20px; font-weight:600; color:#475569;">${escapeHtml(order.paymentStatus)} via ${escapeHtml(order.paymentMethod)}</div>
                            </div>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>

                  <tr>
                    <td style="padding:0 30px 26px;">
                      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#f8fafc; border-radius:14px; padding:0;">
                        ${renderTotalRow("Subtotal", order.subtotal)}
                        ${renderTotalRow("Shipping", order.shipping)}
                        ${renderTotalRow("Tax", order.tax)}
                        ${order.hasDiscount ? renderTotalRow("Discount", `-${order.discount}`) : ""}
                        <tr>
                          <td style="padding:12px 18px 16px; border-top:1px solid #e2e8f0; font-size:16px; line-height:22px; font-weight:800; color:#122a50;">Total</td>
                          <td align="right" style="padding:12px 18px 16px; border-top:1px solid #e2e8f0; font-size:18px; line-height:24px; font-weight:800; color:#17345f;">${escapeHtml(order.total)}</td>
                        </tr>
                      </table>
                    </td>
                  </tr>

                  <tr>
                    <td style="padding:22px 30px; background:#fbf8f0; border-top:1px solid #eee4cf;">
                      <p style="margin:0; font-size:13px; line-height:21px; font-weight:700; color:#122a50;">
                        We will notify you when your order status changes.
                      </p>
                      <p style="margin:8px 0 0; font-size:12px; line-height:19px; font-weight:600; color:#64748b;">
                        Need help with your order? Reply to this email and the ${escapeHtml(order.brand.name)} support team will assist you.
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <tr>
              <td align="center" style="padding:18px 10px 0; font-size:11px; line-height:18px; color:#64748b;">
                ${escapeHtml(order.brand.name)} - Quality products for happier pets.
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  `;
}

function renderInvoiceHtml(order, brand = getEmailBrand()) {
  const items = Array.isArray(order.items) ? order.items : [];
  const view = buildOrderEmailView(order, items, brand);
  const invoiceNumber = `INV-${order.id}`;
  const orderDate = order.orderDate || order.createdAt;
  const itemRows = items.length
    ? items.map((item) => `
      <tr>
        <td style="padding:10px 0; border-bottom:1px solid #e5e7eb;">
          <strong>${escapeHtml(item.name || item.productName || "Item")}</strong>
          ${formatItemOptions(item) ? `<div style="font-size:12px; color:#64748b;">${escapeHtml(formatItemOptions(item))}</div>` : ""}
        </td>
        <td align="center" style="padding:10px; border-bottom:1px solid #e5e7eb;">${escapeHtml(item.quantity || 1)}</td>
        <td align="right" style="padding:10px 0; border-bottom:1px solid #e5e7eb;">${escapeHtml(formatMoney(getLineTotal(item)))}</td>
      </tr>
    `).join("")
    : `<tr><td colspan="3" style="padding:16px 0; color:#64748b;">No item details available</td></tr>`;

  return `
    <div style="margin:28px auto; max-width:760px; background:#ffffff; border:1px solid #e7dfcf; border-radius:16px; overflow:hidden; font-family:Arial, Helvetica, sans-serif; color:#122a50;">
      <div style="background:#17345f; color:#ffffff; padding:24px 28px;">
        <div style="font-size:24px; font-weight:800;">${escapeHtml(brand.name)}</div>
        <div style="margin-top:6px; color:#dbeafe; font-size:13px; font-weight:700;">Tax Invoice</div>
      </div>
      <div style="padding:24px 28px;">
        <table width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;">
          <tr>
            <td style="vertical-align:top;">
              <div style="font-size:12px; color:#64748b; text-transform:uppercase; font-weight:800;">Invoice</div>
              <div style="margin-top:4px; font-size:18px; font-weight:800;">${escapeHtml(invoiceNumber)}</div>
              <div style="margin-top:4px; font-size:13px; color:#64748b;">Order ${escapeHtml(order.id)}</div>
            </td>
            <td align="right" style="vertical-align:top;">
              <div style="font-size:12px; color:#64748b; text-transform:uppercase; font-weight:800;">Date</div>
              <div style="margin-top:4px; font-size:14px; font-weight:700;">${escapeHtml(formatInvoiceDate(orderDate))}</div>
              <div style="margin-top:4px; font-size:13px; color:#64748b;">Payment: ${escapeHtml(order.paymentStatus || "Pending")}</div>
            </td>
          </tr>
        </table>

        <div style="margin-top:22px; padding:16px; background:#fffaf0; border:1px solid #f0dfb4; border-radius:12px;">
          <div style="font-size:12px; color:#64748b; text-transform:uppercase; font-weight:800;">Bill To</div>
          <div style="margin-top:6px; font-size:15px; font-weight:800;">${escapeHtml(order.customerName || "Customer")}</div>
          <div style="margin-top:3px; font-size:13px; color:#475569;">${escapeHtml(order.email || "")}</div>
          ${view.shippingAddress ? `<div style="margin-top:8px; font-size:13px; line-height:20px; color:#475569;">${escapeHtml(view.shippingAddress)}</div>` : ""}
        </div>

        <table width="100%" cellspacing="0" cellpadding="0" style="margin-top:22px; border-collapse:collapse;">
          <thead>
            <tr>
              <th align="left" style="padding:10px 0; border-bottom:2px solid #17345f; font-size:12px; color:#64748b; text-transform:uppercase;">Item</th>
              <th align="center" style="padding:10px; border-bottom:2px solid #17345f; font-size:12px; color:#64748b; text-transform:uppercase;">Qty</th>
              <th align="right" style="padding:10px 0; border-bottom:2px solid #17345f; font-size:12px; color:#64748b; text-transform:uppercase;">Amount</th>
            </tr>
          </thead>
          <tbody>${itemRows}</tbody>
        </table>

        <table width="100%" cellspacing="0" cellpadding="0" style="margin-top:18px; border-collapse:collapse;">
          ${renderInvoiceTotalRow("Subtotal", view.subtotal)}
          ${renderInvoiceTotalRow("Shipping", view.shipping)}
          ${renderInvoiceTotalRow("Tax", view.tax)}
          ${Number(order.discount || 0) > 0 ? renderInvoiceTotalRow("Discount", `-${view.discount}`) : ""}
          <tr>
            <td align="right" style="padding:12px 16px; border-top:1px solid #e5e7eb; font-size:16px; font-weight:800;">Total</td>
            <td align="right" style="padding:12px 0; border-top:1px solid #e5e7eb; font-size:20px; font-weight:800; color:#17345f; width:140px;">${escapeHtml(view.total)}</td>
          </tr>
        </table>
      </div>
    </div>
  `;
}

function renderRegistrationConfirmationHtml(customer, brand = getEmailBrand()) {
  const name = customer?.name || "Pet Parent";
  return `
    <div style="display:none; max-height:0; overflow:hidden; opacity:0; color:transparent;">
      Your ${escapeHtml(brand.name)} account is ready.
    </div>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#f7f4ed; margin:0; padding:0;">
      <tr>
        <td align="center" style="padding:28px 14px;">
          <table role="presentation" width="640" cellspacing="0" cellpadding="0" border="0" style="width:100%; max-width:640px; font-family:Arial, Helvetica, sans-serif; color:#122a50;">
            <tr>
              <td style="font-size:24px; line-height:30px; font-weight:800; color:#17345f; padding:0 0 14px;">${escapeHtml(brand.name)}</td>
            </tr>
            <tr>
              <td style="overflow:hidden; border-radius:18px; background:#ffffff; border:1px solid #e7dfcf; box-shadow:0 10px 28px rgba(18,42,80,0.08);">
                <div style="background:#17345f; color:#ffffff; padding:28px 30px;">
                  <div style="display:inline-block; margin-bottom:14px; padding:6px 12px; border-radius:999px; background:#d9aa3d; color:#17345f; font-size:12px; font-weight:800; text-transform:uppercase;">Registration confirmed</div>
                  <h1 style="margin:0; font-size:26px; line-height:34px; font-weight:800;">Welcome, ${escapeHtml(name)}.</h1>
                  <p style="margin:10px 0 0; font-size:15px; line-height:23px; color:#eef4ff;">Your account has been created successfully.</p>
                </div>
                <div style="padding:24px 30px;">
                  <p style="margin:0; font-size:15px; line-height:24px; color:#475569;">You can now sign in, manage your profile, save addresses, and track your orders from your account.</p>
                  <div style="margin-top:20px; padding:16px; border-radius:14px; background:#fffaf0; border:1px solid #f0dfb4;">
                    <div style="font-size:12px; font-weight:800; color:#64748b; text-transform:uppercase;">Account email</div>
                    <div style="margin-top:6px; font-size:15px; line-height:22px; font-weight:800; color:#122a50;">${escapeHtml(customer?.email || "")}</div>
                  </div>
                </div>
                <div style="padding:20px 30px; background:#fbf8f0; border-top:1px solid #eee4cf;">
                  <p style="margin:0; font-size:12px; line-height:19px; font-weight:600; color:#64748b;">Thanks for joining ${escapeHtml(brand.name)}.</p>
                </div>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  `;
}

function renderOrderStatusUpdateHtml(order, previousStatus, brand = getEmailBrand()) {
  const nextStatus = formatOrderStatus(order.orderStatus);
  const oldStatus = formatOrderStatus(previousStatus);
  const changedText = oldStatus && oldStatus !== nextStatus
    ? `Your order moved from ${oldStatus} to ${nextStatus}.`
    : `Your order is now ${nextStatus}.`;

  return `
    <div style="display:none; max-height:0; overflow:hidden; opacity:0; color:transparent;">
      Order ${escapeHtml(order.id)} status updated to ${escapeHtml(nextStatus)}.
    </div>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#f7f4ed; margin:0; padding:0;">
      <tr>
        <td align="center" style="padding:28px 14px;">
          <table role="presentation" width="640" cellspacing="0" cellpadding="0" border="0" style="width:100%; max-width:640px; font-family:Arial, Helvetica, sans-serif; color:#122a50;">
            <tr>
              <td style="font-size:24px; line-height:30px; font-weight:800; color:#17345f; padding:0 0 14px;">${escapeHtml(brand.name)}</td>
            </tr>
            <tr>
              <td style="overflow:hidden; border-radius:18px; background:#ffffff; border:1px solid #e7dfcf; box-shadow:0 10px 28px rgba(18,42,80,0.08);">
                <div style="background:#17345f; color:#ffffff; padding:28px 30px;">
                  <div style="display:inline-block; margin-bottom:14px; padding:6px 12px; border-radius:999px; background:#d9aa3d; color:#17345f; font-size:12px; font-weight:800; text-transform:uppercase;">Order update</div>
                  <h1 style="margin:0; font-size:26px; line-height:34px; font-weight:800;">${escapeHtml(nextStatus)}</h1>
                  <p style="margin:10px 0 0; font-size:15px; line-height:23px; color:#eef4ff;">${escapeHtml(changedText)}</p>
                </div>
                <div style="padding:24px 30px;">
                  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#fffaf0; border:1px solid #f0dfb4; border-radius:14px;">
                    <tr>
                      <td style="padding:18px; width:50%; vertical-align:top;">
                        <div style="font-size:12px; font-weight:800; color:#64748b; text-transform:uppercase;">Order number</div>
                        <div style="margin-top:5px; font-size:15px; line-height:22px; font-weight:800; color:#122a50;">${escapeHtml(order.id)}</div>
                      </td>
                      <td style="padding:18px; width:50%; vertical-align:top; border-left:1px solid #f0dfb4;">
                        <div style="font-size:12px; font-weight:800; color:#64748b; text-transform:uppercase;">Order total</div>
                        <div style="margin-top:5px; font-size:20px; line-height:26px; font-weight:800; color:#17345f;">${escapeHtml(formatMoney(order.total))}</div>
                      </td>
                    </tr>
                  </table>
                  <p style="margin:20px 0 0; font-size:14px; line-height:22px; color:#475569;">We will keep you posted as your order moves forward.</p>
                  ${order.trackingNumber || order.courierName ? `
                    <div style="margin-top:18px; padding:16px; border-radius:14px; border:1px solid #e7dfcf;">
                      ${order.courierName ? `<div style="font-size:13px; line-height:20px; color:#475569;"><strong>Courier:</strong> ${escapeHtml(order.courierName)}</div>` : ""}
                      ${order.trackingNumber ? `<div style="font-size:13px; line-height:20px; color:#475569;"><strong>Tracking number:</strong> ${escapeHtml(order.trackingNumber)}</div>` : ""}
                    </div>
                  ` : ""}
                </div>
                <div style="padding:20px 30px; background:#fbf8f0; border-top:1px solid #eee4cf;">
                  <p style="margin:0; font-size:12px; line-height:19px; font-weight:600; color:#64748b;">Need help with your order? Reply to this email and the ${escapeHtml(brand.name)} support team will assist you.</p>
                </div>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  `;
}

function renderInvoiceTotalRow(label, value) {
  return `
    <tr>
      <td align="right" style="padding:5px 16px; font-size:13px; color:#64748b; font-weight:700;">${escapeHtml(label)}</td>
      <td align="right" style="padding:5px 0; font-size:13px; color:#122a50; font-weight:800; width:140px;">${escapeHtml(value)}</td>
    </tr>
  `;
}

function renderPrintableInvoicePage(order, brand = getEmailBrand()) {
  return `<!doctype html>
    <html>
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Invoice INV-${escapeHtml(order.id)}</title>
        <style>
          body { margin: 0; background: #f8fafc; }
          .printbar { position: sticky; top: 0; padding: 12px 18px; background: #ffffff; border-bottom: 1px solid #e5e7eb; text-align: right; }
          button { border: 0; border-radius: 8px; background: #17345f; color: white; font-weight: 800; padding: 10px 14px; cursor: pointer; }
          @media print { .printbar { display: none; } body { background: white; } }
        </style>
      </head>
      <body>
        <div class="printbar"><button onclick="window.print()">Print Invoice</button></div>
        ${renderInvoiceHtml(order, brand)}
      </body>
    </html>`;
}

function renderPrintableShipmentLabelPage(order, brand = getEmailBrand()) {
  const items = Array.isArray(order.items) ? order.items : [];
  const address = formatAddress(order.shippingAddress);
  const orderDate = order.orderDate || order.createdAt;
  const itemSummary = items.length
    ? items
        .map((item) => `${item.quantity || 1} x ${item.name || item.productName || "Item"}`)
        .join(", ")
    : "Items not available";
  const trackingCode = order.trackingNumber || order.awbNumber || order.id;
  const barcodeSvg = renderBarcodeSvg(trackingCode);
  const logoDataUri = getStoreLogoDataUri(brand.storeKey);

  return `<!doctype html>
    <html>
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Shipping Label ${escapeHtml(order.id)}</title>
        <style>
          * { box-sizing: border-box; }
          html, body { margin: 0; min-height: 0; background: #eef2f7; color: #111827; font-family: Arial, Helvetica, sans-serif; }
          .printbar { position: sticky; top: 0; padding: 12px 18px; background: #ffffff; border-bottom: 1px solid #d1d5db; text-align: right; }
          button { border: 0; border-radius: 8px; background: #17345f; color: white; font-weight: 800; padding: 10px 14px; cursor: pointer; }
          .sheet { width: 102mm; margin: 18px auto; background: white; border: 1px solid #111827; padding: 6mm; page-break-inside: avoid; break-inside: avoid; }
          .row { display: flex; justify-content: space-between; gap: 10px; }
          .brandBlock { display: flex; align-items: center; gap: 10px; min-width: 0; }
          .logo { max-width: 118px; max-height: 48px; object-fit: contain; display: block; }
          .brand { font-size: 20px; font-weight: 900; color: #17345f; }
          .badge { border: 2px solid #111827; padding: 5px 8px; font-size: 12px; font-weight: 900; text-transform: uppercase; }
          .box { border: 1px solid #111827; padding: 8px; margin-top: 8px; }
          .label { margin: 0 0 5px; color: #4b5563; font-size: 10px; font-weight: 900; letter-spacing: .08em; text-transform: uppercase; }
          .value { margin: 0; font-size: 13px; line-height: 1.28; font-weight: 700; }
          .large { font-size: 18px; font-weight: 900; }
          .code { margin-top: 8px; border: 2px solid #111827; padding: 9px 8px; text-align: center; font-family: "Courier New", monospace; font-size: 18px; font-weight: 900; letter-spacing: .06em; overflow-wrap: anywhere; }
          .barcode { width: 100%; height: 46px; margin-top: 8px; display: block; }
          .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-top: 8px; }
          .footer { margin-top: 8px; display: flex; justify-content: space-between; gap: 10px; color: #4b5563; font-size: 11px; font-weight: 700; }
          @page { size: auto; margin: 10mm; }
          @media print {
            html, body { width: auto; height: auto; background: white; overflow: hidden; }
            .printbar { display: none; }
            .sheet { margin: 0 auto; border: 1px solid #111827; width: 102mm; max-height: 255mm; overflow: hidden; page-break-after: avoid; break-after: avoid; }
          }
        </style>
      </head>
      <body>
        <div class="printbar"><button onclick="window.print()">Print Label</button></div>
        <main class="sheet">
          <div class="row">
            <div class="brandBlock">
              ${logoDataUri ? `<img class="logo" src="${logoDataUri}" alt="${escapeHtml(brand.name)} logo" />` : ""}
              <div>
                <div class="brand">${escapeHtml(brand.name)}</div>
                <p class="label" style="margin-top:4px;">Shipping Label</p>
              </div>
            </div>
            <div class="badge">${escapeHtml(order.shipmentStatus || "Pending")}</div>
          </div>

          <div class="box">
            <p class="label">Ship To</p>
            <p class="value large">${escapeHtml(order.customerName || "Customer")}</p>
            ${order.phone ? `<p class="value">${escapeHtml(order.phone)}</p>` : ""}
            ${order.email ? `<p class="value">${escapeHtml(order.email)}</p>` : ""}
            <p class="value" style="margin-top:8px;">${escapeHtml(address || "Address not available")}</p>
          </div>

          <div class="grid">
            <div class="box" style="margin-top:0;">
              <p class="label">Order ID</p>
              <p class="value">${escapeHtml(order.id)}</p>
            </div>
            <div class="box" style="margin-top:0;">
              <p class="label">Order Date</p>
              <p class="value">${escapeHtml(formatInvoiceDate(orderDate))}</p>
            </div>
            <div class="box" style="margin-top:0;">
              <p class="label">Courier</p>
              <p class="value">${escapeHtml(order.courierName || "Not assigned")}</p>
            </div>
            <div class="box" style="margin-top:0;">
              <p class="label">AWB</p>
              <p class="value">${escapeHtml(order.awbNumber || "-")}</p>
            </div>
          </div>

          <div class="box">
            <p class="label">Tracking Number</p>
            <p class="value large">${escapeHtml(order.trackingNumber || "-")}</p>
            ${barcodeSvg}
            <div class="code">${escapeHtml(trackingCode)}</div>
          </div>

          <div class="box">
            <p class="label">Package Contents</p>
            <p class="value">${escapeHtml(itemSummary)}</p>
          </div>

          <div class="footer">
            <span>Payment: ${escapeHtml(order.paymentStatus || "Pending")}</span>
            <span>Total: ${escapeHtml(formatMoney(order.total))}</span>
          </div>
        </main>
      </body>
    </html>`;
}

function getStoreLogoDataUri(storeKey) {
  const key = String(storeKey || "STORE_1").toUpperCase();
  if (logoDataUriCache.has(key)) return logoDataUriCache.get(key);

  const fileName = STORE_LOGO_FILES[key] || STORE_LOGO_FILES.STORE_1;
  const logoPath = path.resolve(
    __dirname,
    "../../../E-Commerce-Admin-Panel/src/assets/logo",
    fileName,
  );

  try {
    const buffer = fs.readFileSync(logoPath);
    const dataUri = `data:image/png;base64,${buffer.toString("base64")}`;
    logoDataUriCache.set(key, dataUri);
    return dataUri;
  } catch (error) {
    logoDataUriCache.set(key, "");
    return "";
  }
}

function renderBarcodeSvg(value) {
  const text = String(value || "LABEL").trim() || "LABEL";
  const width = 520;
  const height = 70;
  let x = 10;
  const bars = [];

  for (const char of text) {
    const code = char.charCodeAt(0);
    for (let bit = 0; bit < 7; bit += 1) {
      const isBar = ((code >> bit) & 1) === 1 || bit === 0;
      const barWidth = ((code + bit) % 3) + 2;
      if (isBar) {
        bars.push(`<rect x="${x}" y="6" width="${barWidth}" height="52" fill="#111827"/>`);
      }
      x += barWidth + 2;
      if (x > width - 18) break;
    }
    x += 3;
    if (x > width - 18) break;
  }

  bars.unshift(`<rect x="2" y="6" width="3" height="52" fill="#111827"/>`);
  bars.push(`<rect x="${width - 6}" y="6" width="3" height="52" fill="#111827"/>`);

  return `
    <svg class="barcode" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Shipment barcode">
      <rect x="0" y="0" width="${width}" height="${height}" fill="#ffffff"/>
      ${bars.join("")}
    </svg>
  `;
}

function formatInvoiceDate(value) {
  if (!value) return "N/A";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "N/A";
  return date.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "2-digit" });
}

function renderOrderItemRow(item) {
  const optionText = formatItemOptions(item);
  return `
    <tr>
      <td style="padding:14px 0; border-bottom:1px solid #edf2f7; vertical-align:top;">
        <div style="font-size:14px; line-height:20px; font-weight:800; color:#122a50;">${escapeHtml(item.name)}</div>
        ${optionText ? `<div style="margin-top:4px; font-size:12px; line-height:18px; font-weight:600; color:#64748b;">${escapeHtml(optionText)}</div>` : ""}
      </td>
      <td align="center" style="padding:14px 10px; border-bottom:1px solid #edf2f7; vertical-align:top; font-size:13px; line-height:20px; font-weight:700; color:#475569;">${escapeHtml(item.quantity)}</td>
      <td align="right" style="padding:14px 0; border-bottom:1px solid #edf2f7; vertical-align:top; font-size:14px; line-height:20px; font-weight:800; color:#122a50;">${escapeHtml(formatMoney(getLineTotal(item)))}</td>
    </tr>
  `;
}

function renderTotalRow(label, value) {
  return `
    <tr>
      <td style="padding:12px 18px 0; font-size:13px; line-height:20px; font-weight:700; color:#64748b;">${escapeHtml(label)}</td>
      <td align="right" style="padding:12px 18px 0; font-size:13px; line-height:20px; font-weight:800; color:#122a50;">${escapeHtml(value)}</td>
    </tr>
  `;
}

async function sendMailWithRetry(transporter, message, attempts = 2) {
  let lastError;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      return await transporter.sendMail(message);
    } catch (error) {
      lastError = error;
      if (!isTransientSmtpError(error) || attempt === attempts) break;
      await wait(250 * attempt);
    }
  }
  throw lastError;
}

function isTransientSmtpError(error) {
  const code = String(error?.code || "").toUpperCase();
  return [
    "ECONNECTION",
    "ETIMEDOUT",
    "ESOCKET",
    "ECONNRESET",
    "ECONNREFUSED",
    "EAI_AGAIN",
  ].includes(code);
}

function shouldUseLocalEmailFallback(error) {
  if (process.env.NODE_ENV === "production") return false;
  if (String(process.env.ALLOW_LOCAL_EMAIL_FALLBACK || "").toLowerCase() !== "true") return false;
  return error instanceof ApiError || isTransientSmtpError(error);
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getEmailBrand(store = getCurrentStore()) {
  const storeKey = String(store?.storeKey || "").trim().toUpperCase();
  const mappedName = STORE_EMAIL_BRANDS[storeKey];
  const name = mappedName || store?.name || DEFAULT_STORE_NAME;

  return {
    name,
    storeKey: storeKey || null,
  };
}

function normalizeSmtpPassword(password, host) {
  const value = String(password || "").trim();
  if (String(host || "").toLowerCase().includes("gmail.com")) {
    return value.replace(/\s+/g, "");
  }
  return value;
}

function formatMoney(value) {
  return `$${toFiniteMoney(value).toFixed(2)}`;
}

function toFiniteMoney(value) {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : 0;
}

function getLineTotal(item = {}) {
  return toFiniteMoney(item.price) * toFiniteMoney(item.quantity || 1);
}

function formatPaymentMethod(method) {
  const value = String(method || "").trim().toLowerCase();
  if (value === "stripe") return "Card";
  if (value === "cod") return "Cash on Delivery";
  return method || "Not specified";
}

function formatOrderStatus(status) {
  return String(status || "")
    .replace(/([A-Z])/g, " $1")
    .replace(/\s+/g, " ")
    .trim();
}

function formatItemOptions(item = {}) {
  const options = [];
  const sizeLabel = item.selectedSize?.label || item.selectedSize;
  const colorLabel = item.selectedColor?.label || item.selectedColor?.name || item.selectedColor;

  if (sizeLabel) {
    options.push(`${item.optionLabel || "Size"}: ${sizeLabel}`);
  }
  if (colorLabel) {
    options.push(`Color: ${colorLabel}`);
  }

  return options.join(" | ");
}

function formatAddress(address) {
  if (!address) return "";
  if (typeof address !== "string") return Object.values(address).filter(Boolean).join(", ");

  try {
    const parsed = JSON.parse(address);
    if (parsed && typeof parsed === "object") {
      return Object.values(parsed).filter(Boolean).join(", ");
    }
  } catch (error) {
    return address;
  }

  return address;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

module.exports = {
  getEmailBrand,
  renderInvoiceHtml,
  renderPrintableInvoicePage,
  renderPrintableShipmentLabelPage,
  sendAbandonedCartEmail,
  sendEmail,
  sendNewsletterUpdateEmail,
  sendOrderConfirmationEmail,
  sendOrderStatusUpdateEmail,
  sendOtpEmail,
  sendRegistrationConfirmationEmail,
  sendSubscriptionConfirmationEmail,
};
