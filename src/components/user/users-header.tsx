"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname, useSearchParams, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/context";
import { useCart } from "@/lib/cart/context";
import {
  Search,
  ShoppingBag,
  User,
  Menu,
  X,
  LogOut,
  Settings,
  Package,
  Home,
  ChevronDown,
  ChevronRight,
  Loader2,
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

interface Category {
  id: string;
  title: string;
  parent_id: string | null;
  children?: Category[];
}

interface SearchProduct {
  id: string;
  title: string;
  price: number;
  images: string[];
}

export default function UserHeader() {
  const { user, loading: authLoading, logout } = useAuth();
  const { itemCount, loading: cartLoading } = useCart();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [searchSuggestions, setSearchSuggestions] = useState<SearchProduct[]>(
    [],
  );
  const [showSuggestions, setShowSuggestions] = useState(false);
  const desktopSearchRef = useRef<HTMLDivElement>(null);
  const mobileSearchRef = useRef<HTMLDivElement>(null);
  const debouncedSearch = useDebounce(searchQuery, 300);

  // Category dropdown state
  const [catDropdownOpen, setCatDropdownOpen] = useState(false);
  const [activeMainCategory, setActiveMainCategory] = useState<Category | null>(
    null,
  );
  const dropdownTimeout = useRef<NodeJS.Timeout>();

  const supabase = createClient();

  // Fetch all categories and build tree
  useEffect(() => {
    const fetchCategories = async () => {
      setLoadingCategories(true);
      const { data, error } = await supabase
        .from("categories")
        .select("id, title, parent_id")
        .order("title");
      if (!error && data) {
        const categoryMap = new Map<string, Category>();
        const roots: Category[] = [];
        data.forEach((cat) => {
          categoryMap.set(cat.id, { ...cat, children: [] });
        });
        data.forEach((cat) => {
          const category = categoryMap.get(cat.id)!;
          if (cat.parent_id) {
            const parent = categoryMap.get(cat.parent_id);
            if (parent) {
              if (!parent.children) parent.children = [];
              parent.children.push(category);
            } else {
              roots.push(category);
            }
          } else {
            roots.push(category);
          }
        });
        setCategories(roots);
      }
      setLoadingCategories(false);
    };
    fetchCategories();
  }, []);

  // Scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Fetch search suggestions when debounced search changes
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
          .select("id, title, price, images")
          .ilike("title", `%${debouncedSearch}%`)
          .limit(5);
        setSearchSuggestions(data || []);
        setShowSuggestions(true);
      } catch (error) {
        console.error("Error fetching suggestions:", error);
      }
    };
    fetchSuggestions();
  }, [debouncedSearch]);

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

  const handleSuggestionClick = (productId: string) => {
    router.push(`/products/${productId}`);
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
      .map((n) => n[0])
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

  // Dropdown handlers
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
  const handleMainCategoryHover = (category: Category) => {
    setActiveMainCategory(category);
  };
  const handleCategoryClick = (categoryId: string) => {
    router.push(`/products?category=${categoryId}`);
    setCatDropdownOpen(false);
    setActiveMainCategory(null);
  };

  if (["/login", "/register"].includes(pathname)) return null;
  if (pathname.startsWith("/admin")) return null;

  // Show loading skeleton while auth is loading
  if (authLoading) {
    return (
      <header className="sticky top-0 z-50 w-full bg-white border-b border-gray-200">
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

  return (
    <>
      <header
        className={`sticky top-0 z-50 w-full transition-all duration-300 bg-white ${
          scrolled
            ? "border-b border-gray-200 shadow-sm"
            : "border-b border-gray-100"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            {/* Logo + Brand */}
            <Link href="/" className="flex items-center gap-1 shrink-0">
              <ShoppingBag className="text-[#00014a] h-6 w-6" />
              <span className="text-[#00014a] text-xl font-semibold">
                Amba<span className="text-[#f73a00]">Store</span>
              </span>
            </Link>

            {/* Desktop Search Bar with integrated Category Dropdown */}
            <div
              className="hidden lg:flex flex-1 max-w-2xl mx-4 relative"
              ref={desktopSearchRef}
            >
              <div className="flex w-full items-center bg-white border border-gray-200 rounded-full shadow-sm">
                {/* All Categories Trigger */}
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
                    <div className="absolute top-full left-0 mt-2 bg-white rounded-xl shadow-xl border border-gray-200 p-4 flex gap-4 z-[100] w-auto">
                      {/* Left column – main categories */}
                      <div className="w-[220px] border-r border-gray-200 pr-4">
                        <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                          All Categories
                        </h4>
                        {loadingCategories ? (
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
                      {activeMainCategory?.children &&
                        activeMainCategory.children.length > 0 && (
                          <div className="w-[220px]">
                            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                              {activeMainCategory.title}
                            </h4>
                            <ul className="space-y-1">
                              {activeMainCategory.children.map((sub) => (
                                <li key={sub.id}>
                                  <span
                                    onClick={() => handleCategoryClick(sub.id)}
                                    className="block px-2 py-1.5 rounded-md text-sm text-gray-700 hover:bg-gray-100 hover:text-[#f73a00] transition-colors cursor-pointer"
                                  >
                                    {sub.title}
                                  </span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                    </div>
                  )}
                </div>

                {/* Search Input */}
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
                <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-gray-200 py-2 z-[100] max-h-96 overflow-y-auto">
                  {searchSuggestions.length > 0 ? (
                    searchSuggestions.map((product) => (
                      <div
                        key={product.id}
                        onClick={() => handleSuggestionClick(product.id)}
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

            {/* Right side icons */}
            <div className="flex items-center gap-4 shrink-0">
              <Link href="/cart" className="relative p-2 group">
                <ShoppingBag className="h-6 w-6 text-[#f73a00] group-hover:text-[#f73a00]/90 transition-colors" />
                {itemCount > 0 && (
                  <Badge className="text-white absolute -top-1 -right-1 h-5 w-5 min-w-0 p-0 flex items-center justify-center rounded-full bg-[#00014a] hover:bg-[#00014a]/90">
                    {itemCount > 9 ? "9+" : itemCount}
                  </Badge>
                )}
              </Link>

              {user ? (
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
                      {["ADMIN", "SUPERADMIN"].includes(user.role) && (
                        <div className="absolute -top-0.5 -right-0.5 h-3 w-3 bg-green-600 rounded-full border-2 border-white"></div>
                      )}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    className="w-64 bg-white border-gray-200 shadow-xl"
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
                              {user.name}
                            </span>
                            <span className="text-sm text-gray-500 truncate">
                              {user.email}
                            </span>
                          </div>
                        </div>
                        <span
                          className={`inline-block px-2 py-1 rounded-full text-xs font-medium text-center ${getRoleColor(user.role)}`}
                        >
                          {user.role === "CUSTOMER" ? "CUSTOMER" : user.role}
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
                      <Link href="/settings" className="text-gray-700">
                        <Settings className="mr-2 h-4 w-4" />
                        Settings
                      </Link>
                    </DropdownMenuItem>

                    {["ADMIN", "SUPERADMIN"].includes(user.role) && (
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
                      variant="ghost"
                      size="sm"
                      className="text-[#00014a] hover:text-[#f73a00] hover:bg-gray-100"
                    >
                      Sign In
                    </Button>
                  </Link>
                  <Link href="/register">
                    <Button
                      size="sm"
                      className="bg-[#f73a00] hover:bg-[#f73a00]/90 text-white"
                    >
                      Sign Up
                    </Button>
                  </Link>
                </div>
              )}

              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden text-[#00014a] hover:bg-gray-100"
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
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-gray-200 bg-white">
            <div className="max-w-7xl mx-auto px-4 py-4">
              <div className="space-y-3">
                {/* Mobile All Categories */}
                <div className="border-b border-gray-200 pb-2">
                  <div className="flex items-center justify-between w-full py-2 text-[#00014a] font-semibold">
                    All Categories
                  </div>
                  <div className="pl-2 space-y-2 mt-2">
                    {loadingCategories ? (
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
                        <div key={cat.id} className="space-y-1">
                          <Link
                            href={`/products?category=${cat.id}`}
                            className="block py-1 text-sm font-medium text-gray-900 hover:text-[#f73a00]"
                            onClick={() => setMobileMenuOpen(false)}
                          >
                            {cat.title}
                          </Link>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Mobile Search with Suggestions */}
                <div className="pt-4 relative" ref={mobileSearchRef}>
                  <form onSubmit={handleSearch}>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        type="text"
                        placeholder="Search collections..."
                        className="pl-10 pr-4 py-2 w-full rounded-full bg-white border-gray-200 text-gray-900 placeholder:text-gray-400"
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
                    <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-gray-200 py-2 z-[100] max-h-60 overflow-y-auto">
                      {searchSuggestions.length > 0 ? (
                        searchSuggestions.map((product) => (
                          <div
                            key={product.id}
                            onClick={() => handleSuggestionClick(product.id)}
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
                          No products found for "{debouncedSearch}"
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </header>
    </>
  );
}
