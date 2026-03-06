import { Resend } from "resend";
import { render } from "@react-email/render";
import { OrderConfirmedEmail } from "@/emails/order-confirmed";

const resend = new Resend(process.env.RESEND_API_KEY);
const fromEmail = "AmbaStore <orders@order.ambaastore.com>";

export async function sendOrderConfirmedEmail({
  to,
  customerName,
  orderNumber,
  items,
  total,
  shippingAddress,
  deliveryInfo,
  customerEmail,
  customerPhone,
}: {
  to: string;
  customerName: string;
  orderNumber: string;
  items: Array<{
    title: string;
    quantity: number;
    price: number;
    variant?: string;
    image?: string;
  }>;
  total: number;
  shippingAddress: string;
  deliveryInfo: string;
  customerEmail?: string;
  customerPhone?: string;
}) {
  try {
    const html = await render(
      OrderConfirmedEmail({
        customerName,
        orderNumber,
        items,
        total,
        shippingAddress,
        deliveryInfo,
        customerEmail,
        customerPhone,
      })
    );

    const { data, error } = await resend.emails.send({
      from: fromEmail,
      to,
      subject: `Order Confirmed #${orderNumber} - AmbaStore`,
      html,
    });

    if (error) {
      console.error("Resend error:", error);
      return { success: false, error };
    }

    console.log("Email sent successfully:", data);
    return { success: true, data };
  } catch (error) {
    console.error("Email sending failed:", error);
    return { success: false, error };
  }
}