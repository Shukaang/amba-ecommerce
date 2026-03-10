"use client";

import { useState, useEffect } from "react";
import HeroSection from "@/components/user/home/hero-section";
import FeaturedProducts from "@/components/user/home/featured-products";
import CategoryShowcase from "@/components/user/home/category-showcase";
import CategorySection from "@/components/user/home/category-section";
import { createClient } from "@/lib/supabase/supabaseClient";
import { ArrowUp, Loader2 } from "lucide-react";

interface Category {
  id: string;
  title: string;
  parent_id: string | null;
}

export default function HomePage() {
  const [mounted, setMounted] = useState(false);
  const [rootCategories, setRootCategories] = useState<Category[]>([]);
  const [categoryDescendantsMap, setCategoryDescendantsMap] = useState<
    Map<string, string[]>
  >(new Map());
  const [showScrollTop, setShowScrollTop] = useState(false);

  // First render – show loader until component mounts
  useEffect(() => {
    setMounted(true);
  }, []);

  // Fetch categories in the background
  useEffect(() => {
    const fetchCategories = async () => {
      const supabase = createClient();
      const { data: allCategories, error } = await supabase
        .from("categories")
        .select("id, title, parent_id")
        .order("title", { ascending: false });

      if (error || !allCategories) return;

      // Build map of parent to children
      const childrenMap = new Map<string, Category[]>();
      const roots: Category[] = [];
      allCategories.forEach((cat) => {
        if (cat.parent_id) {
          if (!childrenMap.has(cat.parent_id)) {
            childrenMap.set(cat.parent_id, []);
          }
          childrenMap.get(cat.parent_id)!.push(cat);
        } else {
          roots.push(cat);
        }
      });

      // Recursive function to get all descendant IDs (including self)
      const getDescendantIds = (catId: string): string[] => {
        const children = childrenMap.get(catId) || [];
        const descendants = [catId];
        children.forEach((child) => {
          descendants.push(...getDescendantIds(child.id));
        });
        return descendants;
      };

      const descendantsMap = new Map<string, string[]>();
      roots.forEach((root) => {
        descendantsMap.set(root.id, getDescendantIds(root.id));
      });

      setRootCategories(roots);
      setCategoryDescendantsMap(descendantsMap);
    };

    fetchCategories();
  }, []);

  // Show/hide scroll-to-top button
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 400);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (!mounted) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-[#f73a00] mx-auto mb-4" />
        </div>
      </div>
    );
  }

  return (
    <>
      <main>
        <HeroSection />
        <FeaturedProducts />
        {rootCategories.map((cat) => (
          <CategorySection
            key={cat.id}
            categoryId={cat.id}
            categoryTitle={cat.title}
            descendantIds={categoryDescendantsMap.get(cat.id) || []}
            limit={4}
          />
        ))}
        <CategoryShowcase />
      </main>

      {/* Scroll to Top Button */}
      {showScrollTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-6 right-6 z-50 p-3 bg-[#f73a00] text-white rounded-full shadow-lg hover:bg-[#f73a00]/90 hover:scale-110 transition-all duration-300"
          aria-label="Scroll to top"
        >
          <ArrowUp className="h-5 w-5" />
        </button>
      )}
    </>
  );
}
