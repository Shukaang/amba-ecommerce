"use client";

import { merriweather, tagesschrift } from "@/fonts/fonts";
import { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { usePathname, useSearchParams, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/context";
import { useCart } from "@/lib/cart/context";
import { useCategories, Category } from "@/lib/categories/context";
import {
  Search,
  ShoppingBag,
  User,
  Menu,
  X,
  LogOut,
  Package,
  Home,
  ChevronDown,
  ChevronRight,
  LogIn,
  UserPlus,
  Heart,
  Store,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { createClient } from "@/lib/supabase/supabaseClient";
import { useDebounce } from "@/hooks/useDebounce";

interface SearchProduct {
  id: string;
  title: string;
  price: number;
  images: string[];
  slug: string;
}

interface UserHeaderProps {
  initialUser?: any;
}

export default function UserHeader({ initialUser }: UserHeaderProps) {
  const { user, loading: authLoading, logout } = useAuth();
  const { itemCount, loading: cartLoading } = useCart();
  const { categories, loading: categoriesLoading } = useCategories();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [searchSuggestions, setSearchSuggestions] = useState<SearchProduct[]>(
    [],
  );
  const [showSuggestions, setShowSuggestions] = useState(false);
  const desktopSearchRef = useRef<HTMLDivElement>(null);
  const mobileSearchRef = useRef<HTMLDivElement>(null);
  const debouncedSearch = useDebounce(searchQuery, 300);

  const [catDropdownOpen, setCatDropdownOpen] = useState(false);
  const [activeMainCategory, setActiveMainCategory] = useState<any>(null);
  const dropdownTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const supabase = createClient();

  // Scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Fetch search suggestions
  useEffect(() => {
    const fetchSuggestions = async () => {
      if (!debouncedSearch.trim()) {
        setSearchSuggestions([]);
        setShowSuggestions(false);
        return;
      }
      try {
        const { data } = await supabase
          .from("products")
          .select("id, title, price, images, slug")
          .ilike("title", `%${debouncedSearch}%`)
          .limit(12);
        setSearchSuggestions(data || []);
        setShowSuggestions(true);
      } catch (error) {
        console.error("Error fetching suggestions:", error);
      }
    };
    fetchSuggestions();
  }, [debouncedSearch, supabase]);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        desktopSearchRef.current &&
        !desktopSearchRef.current.contains(event.target as Node) &&
        mobileSearchRef.current &&
        !mobileSearchRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/products?search=${encodeURIComponent(searchQuery)}`);
      setSearchQuery("");
      setShowSuggestions(false);
      setMobileMenuOpen(false);
    }
  };

  const handleSuggestionClick = (productSlug: string) => {
    router.push(`/products/${productSlug}`);
    setSearchQuery("");
    setShowSuggestions(false);
    setMobileMenuOpen(false);
  };

  const handleLogout = async () => {
    await logout();
    router.push("/");
  };

  const getUserInitials = () => {
    if (!user?.name) return "U";
    return user.name
      .split(" ")
      .map((n: string) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case "SUPERADMIN":
        return "bg-purple-100 text-purple-800";
      case "ADMIN":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-emerald-100 text-emerald-800";
    }
  };

  // Category dropdown handlers
  const handleCatDropdownMouseEnter = () => {
    if (dropdownTimeout.current) clearTimeout(dropdownTimeout.current);
    setCatDropdownOpen(true);
  };
  const handleCatDropdownMouseLeave = () => {
    dropdownTimeout.current = setTimeout(() => {
      setCatDropdownOpen(false);
      setActiveMainCategory(null);
    }, 150);
  };
  const handleMainCategoryHover = (category: any) => {
    setActiveMainCategory(category);
  };
  const handleCategoryClick = (categoryId: string) => {
    router.push(`/products?category=${categoryId}`);
    setCatDropdownOpen(false);
    setActiveMainCategory(null);
  };

  // Hide header on auth pages or admin
  if (
    [
      "/login",
      "/register",
      "/forgot-password",
      "/verify-otp",
      "/reset-password",
      "/change-password",
    ].includes(pathname)
  )
    return null;
  if (pathname.startsWith("/admin")) return null;

  // Loading skeleton
  if (authLoading) {
    return (
      <header className="sticky top-0 z-[100] w-full bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-6 w-32 bg-gray-200 rounded animate-pulse"></div>
            </div>
            <div className="hidden lg:flex flex-1 max-w-2xl mx-4">
              <div className="flex w-full h-10 bg-gray-100 rounded-full animate-pulse"></div>
            </div>
            <div className="flex items-center gap-4">
              <div className="h-6 w-6 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-10 w-10 bg-gray-200 rounded-full animate-pulse"></div>
              <div className="h-10 w-10 bg-gray-200 rounded lg:hidden animate-pulse"></div>
            </div>
          </div>
        </div>
      </header>
    );
  }

  const currentUser = user;

  return (
    <>
      <header
        className={`sticky top-0 z-[100] w-full transition-all duration-300 bg-white ${
          scrolled
            ? "border-b border-gray-200 shadow-sm"
            : "border-b border-gray-100"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* ===== Desktop layout (unchanged) ===== */}
          <div className="hidden lg:flex justify-between items-center h-20">
            <Link
              href="/"
              className={`flex items-center gap-1 shrink-0 ${tagesschrift.className}`}
            >
              <Store className="text-[#f73a00] h-6 w-6" />
              <span className="text-[#f73a00] text-xl font-semibold hidden lg:inline">
                Amba<span className="text-[#f73a00]">Store</span>
              </span>
            </Link>

            {/* Search Bar */}
            <div
              className="flex-1 max-w-2xl mx-4 relative"
              ref={desktopSearchRef}
            >
              <div className="flex w-full items-center bg-white border border-gray-200 rounded-full shadow-sm">
                <div
                  className="relative"
                  onMouseEnter={handleCatDropdownMouseEnter}
                  onMouseLeave={handleCatDropdownMouseLeave}
                >
                  <button
                    className="flex items-center gap-1 h-10 px-4 text-sm font-medium text-[#00014a] hover:text-[#f73a00] border-r border-gray-200 whitespace-nowrap rounded-l-full"
                    onClick={() => setCatDropdownOpen(!catDropdownOpen)}
                  >
                    All Categories
                    <ChevronDown
                      className={`h-4 w-4 transition-transform ${catDropdownOpen ? "rotate-180" : ""}`}
                    />
                  </button>

                  {catDropdownOpen && (
                    <div className="absolute top-full left-0 mt-2 bg-white rounded-xl shadow-xl border border-gray-200 p-4 flex gap-4 z-[9999] w-auto">
                      {/* Left column – main categories */}
                      <div className="w-[220px] border-r border-gray-200 pr-4">
                        <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                          All Categories
                        </h4>
                        {categoriesLoading ? (
                          <div className="space-y-2">
                            {[1, 2, 3, 4].map((i) => (
                              <div
                                key={i}
                                className="h-5 bg-gray-200 rounded animate-pulse"
                              />
                            ))}
                          </div>
                        ) : (
                          <ul className="space-y-1">
                            {categories.map((cat) => (
                              <li
                                key={cat.id}
                                onMouseEnter={() =>
                                  handleMainCategoryHover(cat)
                                }
                                className={`cursor-pointer px-2 py-1.5 rounded-md text-sm transition-colors flex items-center justify-between ${
                                  activeMainCategory?.id === cat.id
                                    ? "bg-[#f73a00]/10 text-[#f73a00] font-medium"
                                    : "text-gray-700 hover:bg-gray-100"
                                }`}
                              >
                                <span
                                  onClick={() => handleCategoryClick(cat.id)}
                                  className="flex-1"
                                >
                                  {cat.title}
                                </span>
                                {cat.children && cat.children.length > 0 && (
                                  <ChevronRight className="h-4 w-4 text-gray-400" />
                                )}
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>

                      {/* Right column – subcategories */}
                      {activeMainCategory &&
                        activeMainCategory.children &&
                        activeMainCategory.children.length > 0 && (
                          <div className="w-[220px]">
                            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                              {activeMainCategory.title}
                            </h4>
                            <ul className="space-y-1">
                              {activeMainCategory.children.map(
                                (sub: Category) => (
                                  <li key={sub.id}>
                                    <span
                                      onClick={() =>
                                        handleCategoryClick(sub.id)
                                      }
                                      className="block px-2 py-1.5 rounded-md text-sm text-gray-700 hover:bg-gray-100 hover:text-[#f73a00] transition-colors cursor-pointer"
                                    >
                                      {sub.title}
                                    </span>
                                  </li>
                                ),
                              )}
                            </ul>
                          </div>
                        )}
                    </div>
                  )}
                </div>

                <form onSubmit={handleSearch} className="flex-1 flex">
                  <Input
                    type="text"
                    placeholder="Search for products..."
                    className="flex-1 border-0 rounded-none focus-visible:ring-0 focus-visible:ring-offset-0 px-4 h-10 bg-transparent text-gray-900 placeholder:text-gray-400"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onFocus={() => {
                      if (
                        searchSuggestions.length > 0 ||
                        debouncedSearch.trim() !== ""
                      )
                        setShowSuggestions(true);
                    }}
                  />
                  <button
                    type="submit"
                    className="px-4 text-[#f73a00] hover:text-[#f73a00]/80 font-medium rounded-r-full"
                  >
                    <Search className="h-5 w-5" />
                  </button>
                </form>
              </div>

              {/* Desktop Search Suggestions */}
              {showSuggestions && debouncedSearch.trim() !== "" && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-gray-200 py-2 z-[9999] max-h-96 overflow-y-auto">
                  {searchSuggestions.length > 0 ? (
                    searchSuggestions.map((product) => (
                      <div
                        key={product.id}
                        onClick={() => handleSuggestionClick(product.slug)}
                        className="flex items-center gap-3 px-4 py-2 hover:bg-gray-100 cursor-pointer transition-colors"
                      >
                        <div className="h-10 w-10 rounded bg-gray-100 overflow-hidden shrink-0">
                          {product.images?.[0] ? (
                            <img
                              src={product.images[0]}
                              alt={product.title}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="h-full w-full flex items-center justify-center text-gray-400">
                              📦
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-gray-900 truncate">
                            {product.title}
                          </div>
                          <div className="text-xs text-gray-500">
                            ETB {product.price.toLocaleString()}
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="py-6 text-center text-gray-500">
                      No products found for "{debouncedSearch}"
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Desktop Right side icons (unchanged) */}
            <div className="flex items-center gap-4 shrink-0">
              <Link href="/cart" className="relative p-2 group">
                <ShoppingBag className="h-6 w-6 text-[#f73a00] group-hover:text-[#f73a00]/90 transition-colors" />
                {itemCount > 0 && (
                  <Badge className="text-white absolute -top-1 -right-1 h-5 w-5 min-w-0 p-0 flex items-center justify-center rounded-full bg-[#00014a] hover:bg-[#00014a]/90">
                    {itemCount > 9 ? "9+" : itemCount}
                  </Badge>
                )}
              </Link>

              {currentUser ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      className="relative h-10 px-2 gap-2 hover:bg-gray-100"
                    >
                      <Avatar className="h-9 w-9">
                        <AvatarFallback className="bg-[#f73a00] text-white">
                          {getUserInitials()}
                        </AvatarFallback>
                      </Avatar>
                      {["ADMIN", "SUPERADMIN"].includes(currentUser.role) && (
                        <div className="absolute -top-0.5 -right-0.5 h-3 w-3 bg-green-600 rounded-full border-2 border-white"></div>
                      )}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    className="w-64 bg-white border-gray-200 shadow-xl z-[9999]"
                    align="end"
                  >
                    <DropdownMenuLabel>
                      <div className="flex flex-col space-y-2">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarFallback className="bg-[#f73a00] text-white">
                              {getUserInitials()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex flex-col">
                            <span className="font-semibold text-gray-900">
                              {currentUser.name}
                            </span>
                            <span className="text-sm text-gray-500 truncate">
                              {currentUser.email}
                            </span>
                          </div>
                        </div>
                        <span
                          className={`inline-block px-2 py-1 rounded-full text-xs font-medium text-center ${getRoleColor(currentUser.role)}`}
                        >
                          {currentUser.role === "CUSTOMER"
                            ? "CUSTOMER"
                            : currentUser.role}
                        </span>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator className="bg-gray-200" />

                    <DropdownMenuItem
                      asChild
                      className="cursor-pointer hover:bg-gray-100 focus:bg-gray-100"
                    >
                      <Link href="/profile" className="text-gray-700">
                        <User className="mr-2 h-4 w-4" />
                        Profile
                      </Link>
                    </DropdownMenuItem>

                    <DropdownMenuItem
                      asChild
                      className="cursor-pointer hover:bg-gray-100 focus:bg-gray-100"
                    >
                      <Link href="/orders" className="text-gray-700">
                        <Package className="mr-2 h-4 w-4" />
                        My Orders
                      </Link>
                    </DropdownMenuItem>

                    <DropdownMenuItem
                      asChild
                      className="cursor-pointer hover:bg-gray-100 focus:bg-gray-100"
                    >
                      <Link href="/favorites" className="text-gray-700">
                        <Heart className="mr-2 h-4 w-4" />
                        Favorites
                      </Link>
                    </DropdownMenuItem>

                    {["ADMIN", "SUPERADMIN"].includes(currentUser.role) && (
                      <>
                        <DropdownMenuSeparator className="bg-gray-200" />
                        <DropdownMenuItem
                          asChild
                          className="cursor-pointer hover:bg-gray-100 focus:bg-gray-100"
                        >
                          <Link
                            href="/admin"
                            className="text-[#f73a00] font-medium"
                          >
                            <Home className="mr-2 h-4 w-4" />
                            Admin Dashboard
                          </Link>
                        </DropdownMenuItem>
                      </>
                    )}

                    <DropdownMenuSeparator className="bg-gray-200" />

                    <DropdownMenuItem
                      onClick={handleLogout}
                      className="text-red-600 cursor-pointer hover:bg-red-50 focus:bg-red-50"
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      Log out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <div className="flex items-center gap-2">
                  <Link href="/login">
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-[#f73a00] text-[#f73a00] hover:bg-[#f73a00] hover:text-white transition-all"
                    >
                      Sign In
                    </Button>
                  </Link>
                  <Link href="/register">
                    <Button
                      size="sm"
                      className="bg-gradient-to-r from-[#f73a00] to-[#ff6b2c] text-white shadow-md hover:shadow-lg transition-all"
                    >
                      Sign Up
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* ===== Mobile layout ===== */}
          <div className="lg:hidden">
            {/* Top row: Logo + Cart + Hamburger */}
            <div className="flex justify-between items-center h-20">
              <Link
                href="/"
                className={`flex items-center gap-1 shrink-0 ${tagesschrift.className}`}
              >
                <Store className="text-[#f73a00] h-6 w-6" />
                <span className="text-[#f73a00] text-xl font-semibold">
                  Amba<span className="text-[#f73a00]">Store</span>
                </span>
              </Link>

              <div className="flex items-center gap-2">
                <Link href="/cart" className="relative p-2 group">
                  <ShoppingBag className="h-6 w-6 text-[#f73a00] group-hover:text-[#f73a00]/90 transition-colors" />
                  {itemCount > 0 && (
                    <Badge className="text-white absolute -top-1 -right-1 h-5 w-5 min-w-0 p-0 flex items-center justify-center rounded-full bg-[#00014a] hover:bg-[#00014a]/90">
                      {itemCount > 9 ? "9+" : itemCount}
                    </Badge>
                  )}
                </Link>

                <Button
                  variant="ghost"
                  size="icon"
                  className="shrink-0 text-[#00014a] hover:bg-gray-100"
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                >
                  {mobileMenuOpen ? (
                    <X className="h-6 w-6" />
                  ) : (
                    <Menu className="h-6 w-6" />
                  )}
                </Button>
              </div>
            </div>

            {/* Mobile search bar */}
            <div className="w-full border-t border-gray-200">
              <div className="py-3" ref={mobileSearchRef}>
                <form onSubmit={handleSearch} className="w-full">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      type="text"
                      placeholder="Search products..."
                      className="pl-9 pr-4 py-2 w-full rounded-full bg-white border-gray-200 text-gray-900 placeholder:text-gray-400 text-sm"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onFocus={() => {
                        if (
                          searchSuggestions.length > 0 ||
                          debouncedSearch.trim() !== ""
                        )
                          setShowSuggestions(true);
                      }}
                    />
                  </div>
                </form>

                {/* Mobile Search Suggestions */}
                {showSuggestions && debouncedSearch.trim() !== "" && (
                  <div className="absolute left-0 right-0 mt-2 mx-4 bg-white rounded-xl shadow-xl border border-gray-200 py-2 z-[9999] max-h-60 overflow-y-auto">
                    {searchSuggestions.length > 0 ? (
                      searchSuggestions.map((product) => (
                        <div
                          key={product.id}
                          onClick={() => handleSuggestionClick(product.slug)}
                          className="flex items-center gap-3 px-4 py-2 hover:bg-gray-100 cursor-pointer transition-colors"
                        >
                          <div className="h-10 w-10 rounded bg-gray-100 overflow-hidden shrink-0">
                            {product.images?.[0] ? (
                              <img
                                src={product.images[0]}
                                alt={product.title}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <div className="h-full w-full flex items-center justify-center text-gray-400">
                                📦
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-gray-900 truncate">
                              {product.title}
                            </div>
                            <div className="text-xs text-gray-500">
                              ETB {product.price.toLocaleString()}
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="py-4 text-center text-gray-500">
                        No products found
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ===== Mobile Menu Drawer (FIXED) ===== */}
        <div
          className={cn(
            "fixed inset-0 z-[9999] lg:hidden",
            mobileMenuOpen ? "pointer-events-auto" : "pointer-events-none",
          )}
        >
          {/* Overlay */}
          <div
            className={cn(
              "absolute inset-0 bg-black/50 transition-opacity duration-500",
              mobileMenuOpen ? "opacity-100" : "opacity-0",
            )}
            onClick={() => setMobileMenuOpen(false)}
          />

          {/* Drawer panel – add bottom padding to content */}
          <div
            className={cn(
              "absolute top-0 right-0 h-screen w-4/5 max-w-sm bg-white shadow-2xl transform transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] overflow-y-auto",
              mobileMenuOpen ? "translate-x-0" : "translate-x-full",
            )}
          >
            <div className="sticky top-0 flex justify-start p-4 bg-white border-b border-gray-200 z-10">
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                aria-label="Close menu"
              >
                <X className="h-5 w-5 text-gray-600" />
              </button>
            </div>

            {/* ✅ Added pb-8 (padding-bottom) to the content container so the last items are fully visible even when scrolled */}
            <div className="p-6 pt-2 pb-12">
              {/* Categories Section */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-[#00014a] mb-3">
                  Categories
                </h3>
                <div className="space-y-2">
                  {categoriesLoading ? (
                    <div className="space-y-2">
                      {[1, 2, 3, 4].map((i) => (
                        <div
                          key={i}
                          className="h-6 w-32 bg-gray-200 rounded animate-pulse"
                        />
                      ))}
                    </div>
                  ) : (
                    categories.map((cat) => (
                      <Link
                        key={cat.id}
                        href={`/products?category=${cat.id}`}
                        className="block py-2 text-gray-700 hover:text-[#f73a00] font-medium"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        {cat.title}
                      </Link>
                    ))
                  )}
                </div>
              </div>

              {/* Auth / User Section */}
              <div className="border-t border-gray-200 pt-4">
                <h3 className="text-lg font-semibold text-[#00014a] mb-3">
                  {currentUser ? "Account" : "Account Access"}
                </h3>

                {currentUser ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 pb-3 border-b border-gray-100">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className="bg-[#f73a00] text-white">
                          {getUserInitials()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-gray-900">
                          {currentUser.name}
                        </p>
                        <p className="text-sm text-gray-500">
                          {currentUser.email}
                        </p>
                      </div>
                    </div>

                    <Link
                      href="/profile"
                      className="flex items-center gap-3 py-2 text-gray-700 hover:text-[#f73a00]"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <User className="h-5 w-5" />
                      <span>Profile</span>
                    </Link>

                    <Link
                      href="/orders"
                      className="flex items-center gap-3 py-2 text-gray-700 hover:text-[#f73a00]"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <Package className="h-5 w-5" />
                      <span>My Orders</span>
                    </Link>

                    <Link
                      href="/favorites"
                      className="flex items-center gap-3 py-2 text-gray-700 hover:text-[#f73a00]"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <Heart className="h-5 w-5" />
                      <span>Favorites</span>
                    </Link>

                    {["ADMIN", "SUPERADMIN"].includes(currentUser.role) && (
                      <Link
                        href="/admin"
                        className="flex items-center gap-3 py-2 text-[#f73a00] font-medium"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <Home className="h-5 w-5" />
                        <span>Admin Dashboard</span>
                      </Link>
                    )}

                    <button
                      onClick={() => {
                        handleLogout();
                        setMobileMenuOpen(false);
                      }}
                      className="flex items-center gap-3 py-2 text-red-600 hover:text-red-700 w-full"
                    >
                      <LogOut className="h-5 w-5" />
                      <span>Log out</span>
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <Link
                      href="/login"
                      className="flex items-center gap-3 py-2 text-gray-700 hover:text-[#f73a00]"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <LogIn className="h-5 w-5" />
                      <span>Sign In</span>
                    </Link>

                    <Link
                      href="/register"
                      className="flex items-center gap-3 py-2 text-gray-700 hover:text-[#f73a00]"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <UserPlus className="h-5 w-5" />
                      <span>Sign Up</span>
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>
    </>
  );
}
