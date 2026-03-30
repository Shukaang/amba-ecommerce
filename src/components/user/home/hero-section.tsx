"use client";

import { notoserif } from "@/fonts/fonts";
import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  Sparkles,
  TrendingUp,
  Shield,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { createClient } from "@/lib/supabase/supabaseClient";

interface Category {
  id: string;
  title: string;
  parent_id: string | null;
}

export default function HeroSection() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [rootCategories, setRootCategories] = useState<Category[]>([]);

  const slides = [
    {
      title: "Amba Premium",
      subtitle: "ትዕዛዞን በ15 ቀን ውስጥ ይረከቡ!",
      description:
        "Place your order today and enjoy delivery within 15 days. Happy shopping",
      image:
        "https://images.unsplash.com/photo-1483985988355-763728e1935b?q=80&w=2070&auto=format&fit=crop",
      cta: "View Lookbook",
      link: "/products",
    },
    {
      title: "25% ቅናሽ",
      subtitle: "ትዕዛዞን በ15 ቀን ውስጥ ይረከቡ!",
      description: "በብዛት ለሚረከቡን ደንበኞቻችን በልዩ ቅናሽ እናስረክባለን!",
      image: "/hero-image.jpg",
      cta: "ያናግሩን",
      link: "tel:251975931671",
    },
    {
      title: "ምን ፈልገው አጡ?",
      subtitle: "ትዕዛዞን በ15 ቀን ውስጥ ይረከቡ!",
      description: "የሚፈልጉትን ማንኛውም ዕቃ ፎቶውን ይላኩልን",
      image:
        "https://images.unsplash.com/photo-1445205170230-053b83016050?q=80&w=2071&auto=format&fit=crop",
      cta: "View Lookbook",
      link: "/products",
    },
  ];

  // Fetch root categories
  useEffect(() => {
    const fetchRootCategories = async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("categories")
        .select("id, title, parent_id")
        .is("parent_id", null)
        .order("title", { ascending: false });
      if (!error && data) setRootCategories(data);
    };
    fetchRootCategories();
  }, []);

  // Auto‑advance slides
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 8000);
    return () => clearInterval(interval);
  }, []);

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };

  const scrollToSection = (categoryId: string) => {
    const element = document.getElementById(`category-${categoryId}`);
    if (element) {
      const headerOffset = 80;
      const elementPosition =
        element.getBoundingClientRect().top + window.scrollY;
      window.scrollTo({
        top: elementPosition - headerOffset,
        behavior: "smooth",
      });
    }
  };

  return (
    <>
      <section className="relative h-[50vh] min-h-[450px] w-full overflow-hidden bg-[#2d1b4d]">
        {/* Background Images */}
        {slides.map((slide, index) => (
          <div
            key={index}
            className={`absolute inset-0 transition-opacity duration-1000 ${
              currentSlide === index ? "opacity-100" : "opacity-0"
            }`}
          >
            <div className="absolute inset-0 bg-black/20 z-10" />
            <div
              className="absolute inset-0 bg-cover bg-center scale-110 transition-transform duration-10000"
              style={{
                backgroundImage: `url(${slide.image})`,
                transform: currentSlide === index ? "scale(1)" : "scale(1.1)",
              }}
            />
          </div>
        ))}

        <div className="absolute inset-0 bg-gradient-to-r from-black/30 via-black/10 to-transparent z-20" />

        {/* Left/Right Navigation Arrows - improved mobile tap area */}
        <button
          onClick={prevSlide}
          className="absolute left-0 sm:left-4 top-3/4 -translate-y-1/2 z-50 p-3 lg-ml-2 sm:p-2 sm:-ml-1 rounded-full bg-black/30 backdrop-blur-sm text-white hover:bg-black/50 transition-all"
          aria-label="Previous slide"
        >
          <ChevronLeft className="h-5 w-5 sm:h-8 sm:w-8" />
        </button>
        <button
          onClick={nextSlide}
          className="absolute right-0 sm:right-4 top-3/4 -translate-y-1/2 z-50 p-3 lg-mr-2 sm:p-2 sm:-mr-1 rounded-full bg-black/30 backdrop-blur-sm text-white hover:bg-black/50 transition-all"
          aria-label="Next slide"
        >
          <ChevronRight className="h-5 w-5 sm:h-8 sm:w-8" />
        </button>

        {/* Content (unchanged) */}
        <div className="relative z-30 h-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col pt-15">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 sm:px-4 sm:py-2 bg-[#ffe9ad]/50 backdrop-blur-sm rounded-full border border-white/70 text-white text-xs sm:text-sm font-medium mb-4 sm:mb-6">
              {slides[currentSlide].subtitle}
            </div>
            <h1
              className={`text-3xl sm:text-4xl md:text-5xl font-extrabold text-white mb-3 sm:mb-4 leading-tight ${notoserif.className}`}
            >
              {slides[currentSlide].title.split(" ").map((word, i, arr) =>
                i === arr.length - 1 ? (
                  <span key={i} className="relative">
                    {word}
                    <span className="absolute -bottom-1 sm:-bottom-2 left-0 w-full h-0.5 sm:h-1 bg-[#f73a00] rounded-full"></span>
                  </span>
                ) : (
                  <span key={i} className="text-[#ffe9ad]">
                    {word}{" "}
                  </span>
                ),
              )}
            </h1>
            <p className="text-sm sm:text-base text-white/80 mb-6 sm:mb-8 max-w-xl leading-relaxed">
              {slides[currentSlide].description}
            </p>
            <div className="flex flex-wrap gap-3 sm:gap-4">
              <Link href={slides[currentSlide].link}>
                <Button
                  size="sm"
                  className="bg-[#f73a00] hover:bg-[#f73a00]/90 text-white px-5 py-4 sm:px-8 sm:py-6 text-xs sm:text-base font-semibold rounded-xl shadow-2xl hover:shadow-[#f73a00]/20 hover:scale-105 transition-all duration-300 group"
                >
                  {slides[currentSlide].cta}
                  <ArrowRight className="ml-1 sm:ml-2 h-4 w-4 sm:h-5 sm:w-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Link href="/products">
                <Button
                  size="sm"
                  variant="outline"
                  className="bg-white/10 backdrop-blur-md border-2 border-white/30 text-white hover:bg-white/90 hover:text-slate-900 px-5 py-4 sm:px-8 sm:py-6 text-xs sm:text-base font-semibold rounded-xl transition-all duration-300"
                >
                  View Collection
                </Button>
              </Link>
            </div>
            <div className="hidden sm:flex items-center gap-4 sm:gap-6 mt-8 sm:mt-10">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center">
                  <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-[#f73a00]" />
                </div>
                <div>
                  <div className="text-white font-semibold text-xs sm:text-sm">
                    500+
                  </div>
                  <div className="text-white/60 text-xs">Premium Products</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center">
                  <Shield className="h-4 w-4 sm:h-5 sm:w-5 text-[#f73a00]" />
                </div>
                <div>
                  <div className="text-white font-semibold text-xs sm:text-sm">
                    24/7
                  </div>
                  <div className="text-white/60 text-xs">Customer Support</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Slide Indicators - already improved with large tap target */}
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-50 flex gap-2">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              className="p-2 -m-2"
              aria-label={`Go to slide ${index + 1}`}
            >
              <div
                className={`h-1.5 sm:h-2 rounded-full transition-all duration-300 ${
                  currentSlide === index
                    ? "w-4 sm:w-6 bg-[#f73a00]"
                    : "w-1.5 sm:w-2 bg-white/70 hover:bg-white"
                }`}
              />
            </button>
          ))}
        </div>
      </section>

      {/* Category navigation (unchanged) */}
      {rootCategories.length > 0 && (
        <div className="bg-white/90 backdrop-blur-sm border-b border-gray-200/80 shadow-sm py-2 px-4 overflow-x-auto sticky top-0 z-40">
          <div className="flex gap-3 sm:gap-4 justify-start sm:justify-center max-w-7xl mx-auto">
            {rootCategories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => scrollToSection(cat.id)}
                className="px-4 py-2 text-sm font-semibold text-gray-700 hover:text-[#f73a00] hover:bg-[#f73a00]/10 rounded-full transition-all duration-300 whitespace-nowrap"
              >
                {cat.title}
              </button>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
