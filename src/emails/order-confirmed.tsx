import {
  Body,
  Container,
  Column,
  Head,
  Heading,
  Hr,
  Html,
  Img,
  Link,
  Preview,
  Row,
  Section,
  Text,
} from "@react-email/components";
import * as React from "react";

interface OrderConfirmedProps {
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
}

export const OrderConfirmedEmail = ({
  customerName,
  orderNumber,
  items,
  total,
  shippingAddress,
  deliveryInfo,
  customerEmail,
  customerPhone,
}: OrderConfirmedProps) => {
  const previewText = `Your order ${orderNumber} has been confirmed!`;

  // Parse shipping info
  const parseShippingInfo = (info: string) => {
    const lines = info.split("\n");
    const fullName =
      lines
        .find((l) => l.startsWith("Full Name:"))
        ?.replace("Full Name:", "")
        .trim() || "";
    const phone =
      lines
        .find((l) => l.startsWith("Phone:"))
        ?.replace("Phone:", "")
        .trim() ||
      customerPhone ||
      "";
    const address =
      lines
        .find((l) => l.startsWith("Address:"))
        ?.replace("Address:", "")
        .trim() || "";
    return { fullName, phone, address };
  };

  const shipping = parseShippingInfo(shippingAddress);

  const formatPrice = (price: number) => {
    return `ETB ${price.toLocaleString("en-US")}`;
  };

  const itemTotalPrice = (price: number, quantity: number) => {
    return price * quantity;
  };

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Header with Logo */}
          <Section style={header}>
            <Row>
              <Column align="center">
                <div style={logoContainer}>
                  <span style={logoText}>
                    Amba<span style={logoAccent}>Store</span>
                  </span>
                </div>
              </Column>
            </Row>
            <Row>
              <Column align="center">
                <Text style={headerTitle}>Order Confirmed! 🎉</Text>
                <Text style={headerSubtitle}>
                  Thank you for shopping with us
                </Text>
              </Column>
            </Row>
          </Section>

          {/* Order Number Badge */}
          <Section style={orderBadge}>
            <Text style={orderNumberText}>Order #{orderNumber}</Text>
          </Section>

          {/* Customer Info */}
          <Section style={infoSection}>
            <Row>
              <Column>
                <Text style={infoTitle}>Customer Information</Text>
                <Text style={infoText}>
                  <strong>Name:</strong> {shipping.fullName || customerName}
                </Text>
                {customerEmail && (
                  <Text style={infoText}>
                    <strong>Email:</strong> {customerEmail}
                  </Text>
                )}
                {(shipping.phone || customerPhone) && (
                  <Text style={infoText}>
                    <strong>Phone:</strong> {shipping.phone || customerPhone}
                  </Text>
                )}
              </Column>
              <Column>
                <Text style={infoTitle}>Shipping Address</Text>
                <Text style={infoText}>{shipping.address}</Text>
              </Column>
            </Row>
          </Section>

          {/* Delivery Info */}
          <Section style={deliverySection}>
            <Row>
              <Column align="center">
                <div style={deliveryBadge}>
                  <Text style={deliveryText}>{deliveryInfo}</Text>
                </div>
              </Column>
            </Row>
          </Section>

          {/* Order Items */}
          <Section style={itemsSection}>
            <Text style={sectionTitle}>Order Items</Text>
            {items.map((item, index) => (
              <Row key={index} style={itemRow}>
                <Column style={itemImageColumn}>
                  {item.image ? (
                    <Img
                      src={item.image}
                      alt={item.title}
                      width="60"
                      height="60"
                      style={itemImage}
                    />
                  ) : (
                    <div style={itemImagePlaceholder}>
                      <Text style={placeholderText}>📦</Text>
                    </div>
                  )}
                </Column>
                <Column style={itemDetailsColumn}>
                  <Text style={itemTitle}>{item.title}</Text>
                  {item.variant && (
                    <Text style={itemVariant}>{item.variant}</Text>
                  )}
                  <Text style={itemQuantity}>Qty: {item.quantity}</Text>
                </Column>
                <Column style={itemPriceColumn} align="right">
                  <Text style={itemPrice}>{formatPrice(item.price)}</Text>
                  <Text style={itemTotal}>
                    Total:{" "}
                    {formatPrice(itemTotalPrice(item.price, item.quantity))}
                  </Text>
                </Column>
              </Row>
            ))}
          </Section>

          {/* Order Summary */}
          <Section style={summarySection}>
            <Row style={summaryRow}>
              <Column>
                <Text style={summaryLabel}>Subtotal</Text>
              </Column>
              <Column align="right">
                <Text style={summaryValue}>{formatPrice(total)}</Text>
              </Column>
            </Row>
            <Row style={summaryRow}>
              <Column>
                <Text style={summaryLabel}>Shipping</Text>
              </Column>
              <Column align="right">
                <Text style={summaryValueFree}>Free (Addis Ababa)</Text>
              </Column>
            </Row>
            <Row style={summaryRow}>
              <Column>
                <Text style={summaryLabel}>Payment</Text>
              </Column>
              <Column align="right">
                <Text style={summaryValue}>
                  Pay on Delivery (50% now, 50% later)
                </Text>
              </Column>
            </Row>
            <Hr style={divider} />
            <Row style={totalRow}>
              <Column>
                <Text style={totalLabel}>Total</Text>
              </Column>
              <Column align="right">
                <Text style={totalValue}>{formatPrice(total)}</Text>
              </Column>
            </Row>
          </Section>

          {/* Footer */}
          <Section style={footer}>
            <Row>
              <Column align="center">
                <Link href="https://ambaastore.com" style={footerLink}>
                  Visit Our Store
                </Link>
                <Text style={footerText}>
                  © 2024 AmbaStore. All rights reserved.
                </Text>
                <Text style={footerAddress}>Addis Ababa, Ethiopia</Text>
                <Text style={footerContact}>
                  <Link href="mailto:support@ambaastore.com" style={footerLink}>
                    support@ambaastore.com
                  </Link>
                  {" • "}
                  <Link href="tel:+251912345678" style={footerLink}>
                    +251 912 345 678
                  </Link>
                </Text>
              </Column>
            </Row>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

// Styles
const main = {
  backgroundColor: "#f6f9fc",
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
  padding: "20px 0",
};

const container = {
  backgroundColor: "#ffffff",
  border: "1px solid #f0f0f0",
  borderRadius: "12px",
  margin: "0 auto",
  maxWidth: "600px",
  overflow: "hidden",
};

const header = {
  backgroundColor: "#00014a",
  padding: "30px 20px",
};

const logoContainer = {
  marginBottom: "15px",
};

const logoText = {
  color: "#ffffff",
  fontSize: "28px",
  fontWeight: "bold",
  margin: "0",
};

const logoAccent = {
  color: "#f73a00",
};

const headerTitle = {
  color: "#ffffff",
  fontSize: "24px",
  fontWeight: "bold",
  margin: "10px 0 5px",
};

const headerSubtitle = {
  color: "#e0e0ff",
  fontSize: "16px",
  margin: "0",
};

const orderBadge = {
  backgroundColor: "#f73a00",
  padding: "15px 20px",
  textAlign: "center" as const,
};

const orderNumberText = {
  color: "#ffffff",
  fontSize: "20px",
  fontWeight: "bold",
  margin: "0",
  letterSpacing: "1px",
};

const infoSection = {
  padding: "30px 20px",
};

const infoTitle = {
  color: "#00014a",
  fontSize: "16px",
  fontWeight: "bold",
  margin: "0 0 10px",
  textTransform: "uppercase" as const,
};

const infoText = {
  color: "#333333",
  fontSize: "14px",
  margin: "5px 0",
  lineHeight: "1.6",
};

const deliverySection = {
  padding: "0 20px 20px",
};

const deliveryBadge = {
  backgroundColor: "#f73a0010",
  border: "1px solid #f73a00",
  borderRadius: "8px",
  padding: "12px 20px",
};

const deliveryText = {
  color: "#f73a00",
  fontSize: "14px",
  fontWeight: "500",
  margin: "0",
  textAlign: "center" as const,
};

const itemsSection = {
  padding: "20px",
  backgroundColor: "#fafafa",
};

const sectionTitle = {
  color: "#00014a",
  fontSize: "18px",
  fontWeight: "bold",
  margin: "0 0 20px",
};

const itemRow = {
  marginBottom: "15px",
  paddingBottom: "15px",
  borderBottom: "1px solid #eaeaea",
};

const itemImageColumn = {
  width: "70px",
};

const itemImage = {
  borderRadius: "8px",
  objectFit: "cover" as const,
};

const itemImagePlaceholder = {
  width: "60px",
  height: "60px",
  backgroundColor: "#f0f0f0",
  borderRadius: "8px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

const placeholderText = {
  fontSize: "24px",
  margin: "0",
};

const itemDetailsColumn = {
  paddingLeft: "10px",
};

const itemTitle = {
  color: "#333333",
  fontSize: "16px",
  fontWeight: "500",
  margin: "0 0 5px",
};

const itemVariant = {
  color: "#666666",
  fontSize: "13px",
  margin: "0 0 5px",
};

const itemQuantity = {
  color: "#999999",
  fontSize: "13px",
  margin: "0",
};

const itemPriceColumn = {
  paddingLeft: "10px",
};

const itemPrice = {
  color: "#00014a",
  fontSize: "16px",
  fontWeight: "bold",
  margin: "0 0 3px",
};

const itemTotal = {
  color: "#666666",
  fontSize: "13px",
  margin: "0",
};

const summarySection = {
  padding: "20px",
  backgroundColor: "#ffffff",
};

const summaryRow = {
  marginBottom: "8px",
};

const summaryLabel = {
  color: "#666666",
  fontSize: "14px",
  margin: "0",
};

const summaryValue = {
  color: "#333333",
  fontSize: "14px",
  fontWeight: "500",
  margin: "0",
};

const summaryValueFree = {
  color: "#00a86b",
  fontSize: "14px",
  fontWeight: "500",
  margin: "0",
};

const divider = {
  borderColor: "#eaeaea",
  margin: "20px 0",
};

const totalRow = {
  marginTop: "10px",
};

const totalLabel = {
  color: "#00014a",
  fontSize: "18px",
  fontWeight: "bold",
  margin: "0",
};

const totalValue = {
  color: "#f73a00",
  fontSize: "24px",
  fontWeight: "bold",
  margin: "0",
};

const footer = {
  backgroundColor: "#00014a",
  padding: "30px 20px",
};

const footerLink = {
  color: "#ffffff",
  fontSize: "14px",
  textDecoration: "underline",
  margin: "0 5px",
};

const footerText = {
  color: "#9999ff",
  fontSize: "12px",
  margin: "10px 0",
};

const footerAddress = {
  color: "#ccccff",
  fontSize: "12px",
  margin: "5px 0",
};

const footerContact = {
  color: "#ccccff",
  fontSize: "12px",
  margin: "10px 0 0",
};

export default OrderConfirmedEmail;
