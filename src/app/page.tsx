import HeroSection from "@/components/user/home/hero-section";
import FeaturedProducts from "@/components/user/home/featured-products";
import CategoryShowcase from "@/components/user/home/category-showcase";

export default function HomePage() {
  return (
    <>
      <main>
        <HeroSection />
        <FeaturedProducts />
        <CategoryShowcase />
      </main>
    </>
  );
}
