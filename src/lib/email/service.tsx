// Email service - implement with your email provider
// This is a template for Mailjet (as specified in requirements)

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

/**
 * Send email using Mailjet API
 * Prerequisites:
 * - Install: npm install node-mailjet
 * - Set env vars: MAILJET_API_KEY and MAILJET_SECRET_KEY
 */
export async function sendEmail(options: EmailOptions): Promise<void> {
  // This is a placeholder implementation
  // In production, use:
  // const mailjet = require('node-mailjet').connect(
  //   process.env.MAILJET_API_KEY,
  //   process.env.MAILJET_SECRET_KEY
  // )

  console.log("[Email Service]", {
    to: options.to,
    subject: options.subject,
    preview: options.html.slice(0, 100),
  });

  // For development, just log the email
  // In production, uncomment and use Mailjet:
  /*
  try {
    await mailjet.post('send', { version: 'v3.1' }).request({
      Messages: [
        {
          From: {
            Email: process.env.MAILJET_FROM_EMAIL || 'noreply@ecommerce.com',
            Name: 'E-Commerce Store',
          },
          To: [{ Email: options.to }],
          Subject: options.subject,
          HTMLPart: options.html,
          TextPart: options.text,
        },
      ],
    })
  } catch (error) {
    console.error('Email send failed:', error)
    throw error
  }
  */
}

/**
 * Send order confirmation email
 */
export async function sendOrderConfirmationEmail(
  email: string,
  orderId: string,
  totalPrice: number,
  items: Array<{ title: string; quantity: number; price: number }>,
): Promise<void> {
  const itemsHtml = items
    .map(
      (item) =>
        `<tr>
      <td style="padding: 8px; border-bottom: 1px solid #eee;">${item.title}</td>
      <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
      <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">$${item.price.toLocaleString("en-US")}</td>
    </tr>`,
    )
    .join("");

  const html = `
    <h2>Order Confirmation</h2>
    <p>Thank you for your order!</p>
    <p><strong>Order ID:</strong> ${orderId}</p>
    <table style="width: 100%; margin: 20px 0; border-collapse: collapse;">
      <thead>
        <tr style="background: #f5f5f5;">
          <th style="padding: 8px; text-align: left;">Product</th>
          <th style="padding: 8px;">Qty</th>
          <th style="padding: 8px; text-align: right;">Price</th>
        </tr>
      </thead>
      <tbody>
        ${itemsHtml}
      </tbody>
      <tfoot>
        <tr>
          <td colspan="2" style="padding: 8px; text-align: right;"><strong>Total:</strong></td>
          <td style="padding: 8px; text-align: right;"><strong>$${totalPrice.toLocaleString("en-US")}</strong></td>
        </tr>
      </tfoot>
    </table>
    <p>Your order has been received and is being processed.</p>
    <p>You will receive a shipping confirmation soon.</p>
  `;

  await sendEmail({
    to: email,
    subject: `Order Confirmation - #${orderId.slice(0, 8)}`,
    html,
    text: `Order ID: ${orderId}\nTotal: $${totalPrice.toLocaleString("en-US")}`,
  });
}

/**
 * Send order status update email
 */
export async function sendOrderStatusEmail(
  email: string,
  orderId: string,
  status: string,
): Promise<void> {
  const statusMessages: Record<string, string> = {
    CONFIRMED:
      "Your order has been confirmed and is being prepared for shipment.",
    SHIPPED: "Your order has been shipped! You can track your package.",
    READY: "Your order is ready for pickup or delivery.",
    COMPLETED: "Your order has been delivered successfully.",
    CANCELED: "Your order has been canceled.",
    FAILED: "There was an issue processing your order. Please contact support.",
  };

  const html = `
    <h2>Order Status Update</h2>
    <p>Order ID: <strong>${orderId}</strong></p>
    <p>Status: <strong>${status}</strong></p>
    <p>${statusMessages[status] || "Your order status has been updated."}</p>
  `;

  await sendEmail({
    to: email,
    subject: `Order Status Update - #${orderId.slice(0, 8)}`,
    html,
  });
}

/**
 * Send password reset email
 */
export async function sendPasswordResetEmail(
  email: string,
  resetLink: string,
): Promise<void> {
  const html = `
    <h2>Reset Your Password</h2>
    <p>Click the link below to reset your password:</p>
    <p>
      <a href="${resetLink}" style="display: inline-block; padding: 12px 24px; background: #007bff; color: white; text-decoration: none; border-radius: 4px;">
        Reset Password
      </a>
    </p>
    <p>This link will expire in 24 hours.</p>
    <p>If you didn't request a password reset, you can ignore this email.</p>
  `;

  await sendEmail({
    to: email,
    subject: "Reset Your Password",
    html,
  });
}

/**
 * Send welcome email
 */
export async function sendWelcomeEmail(
  email: string,
  name: string,
): Promise<void> {
  const html = `
    <h2>Welcome to Our Store!</h2>
    <p>Hi ${name},</p>
    <p>Thank you for creating an account. We're excited to have you!</p>
    <p>You can now browse our products and place orders.</p>
    <p style="margin-top: 20px;">
      <a href="${process.env.NEXT_PUBLIC_APP_URL || "https://example.com"}/products" style="display: inline-block; padding: 12px 24px; background: #007bff; color: white; text-decoration: none; border-radius: 4px;">
        Start Shopping
      </a>
    </p>
  `;

  await sendEmail({
    to: email,
    subject: "Welcome to Our Store",
    html,
  });
}
