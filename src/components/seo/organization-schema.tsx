export default function OrganizationSchema() {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Organization",
          name: "AmbaStore",
          url: "https://ambaastore.com",
          logo: "https://ambaastore.com/logo.png",
          sameAs: [
            "https://facebook.com/ambaastore",
            "https://instagram.com/ambaastore",
          ],
          contactPoint: {
            "@type": "ContactPoint",
            telephone: "+251912345678",
            contactType: "customer service",
            areaServed: "ET",
            availableLanguage: "English",
          },
        }),
      }}
    />
  );
}
