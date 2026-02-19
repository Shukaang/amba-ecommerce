"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles, TrendingUp, Shield } from "lucide-react";

export default function HeroSection() {
  const [currentSlide, setCurrentSlide] = useState(0);

  const slides = [
    {
      title: "New Season Collection",
      subtitle: "2026 Premiere",
      description:
        "Elevate your wardrobe with our latest curated arrivals. Minimalist designs meeting maximum craftsmanship.",
      image:
        "https://images.unsplash.com/photo-1483985988355-763728e1935b?q=80&w=2070&auto=format&fit=crop",
      cta: "Shop Collection",
      link: "/products?new=true",
    },
    {
      title: "Timeless Elegance",
      subtitle: "Limited Edition",
      description:
        "Discover pieces that transcend seasons. Crafted for the modern connoisseur.",
      image: "/hero-image.jpg",
      cta: "View Lookbook",
      link: "/lookbook",
    },
    {
      title: "Ambastore Premium",
      subtitle: "Premium Editions",
      description:
        "Discover pieces that transcend seasons. Crafted for the modern connoisseur.",
      image:
        "https://images.unsplash.com/photo-1445205170230-053b83016050?q=80&w=2071&auto=format&fit=crop",
      cta: "View Lookbook",
      link: "/lookbook",
    },
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 8000);
    return () => clearInterval(interval);
  }, []);

  return (
    <section className="relative h-[70vh] min-h-[600px] w-full overflow-hidden bg-[#2d1b4d]">
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

      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/30 via-black/10 to-transparent z-20" />

      {/* Content */}
      <div className="relative z-30 h-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col justify-center">
        <div className="max-w-3xl">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#00014a]/80 backdrop-blur-md rounded-full border border-white/70 text-white text-sm font-medium mb-8">
            <Sparkles className="h-4 w-4 text-[#f73a00]" />
            {slides[currentSlide].subtitle}
          </div>

          {/* Title */}
          <h1 className="text-5xl md:text-7xl font-extrabold text-white mb-6 leading-tight">
            {slides[currentSlide].title.split(" ").map((word, i, arr) =>
              i === arr.length - 1 ? (
                <span key={i} className="relative">
                  {word}
                  <span className="absolute -bottom-2 left-0 w-full h-1 bg-[#f73a00] rounded-full"></span>
                </span>
              ) : (
                <span key={i} className="text-[#00014a]">
                  {word}{" "}
                </span>
              ),
            )}
          </h1>

          {/* Description */}
          <p className="text-lg md:text-xl text-white/80 mb-10 max-w-2xl leading-relaxed">
            {slides[currentSlide].description}
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-wrap gap-4">
            <Link href={slides[currentSlide].link}>
              <Button
                size="lg"
                className="bg-[#f73a00] hover:bg-[#f73a00]/90 text-white px-8 py-6 text-base font-semibold rounded-xl shadow-2xl hover:shadow-[#f73a00]/20 hover:scale-105 transition-all duration-300 group"
              >
                {slides[currentSlide].cta}
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            <Link href="/products">
              <Button
                size="lg"
                variant="outline"
                className="bg-white/10 backdrop-blur-md border-2 border-white/30 text-white hover:bg-white/90 hover:text-slate-900 px-8 py-6 text-base font-semibold rounded-xl transition-all duration-300"
              >
                View Collection
              </Button>
            </Link>
          </div>

          {/* Stats */}
          <div className="hidden sm:flex items-center gap-8 mt-16">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-[#f73a00]" />
              </div>
              <div>
                <div className="text-white font-semibold">500+</div>
                <div className="text-white/60 text-sm">Premium Products</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center">
                <Shield className="h-5 w-5 text-[#f73a00]" />
              </div>
              <div>
                <div className="text-white font-semibold">24/7</div>
                <div className="text-white/60 text-sm">Customer Support</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Slide Indicators */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-30 flex gap-3">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentSlide(index)}
            className={`h-2 rounded-full transition-all duration-300 ${
              currentSlide === index
                ? "w-6 bg-[#f73a00]"
                : "w-2 bg-white/90 hover:bg-white"
            }`}
          />
        ))}
      </div>
    </section>
  );
}
