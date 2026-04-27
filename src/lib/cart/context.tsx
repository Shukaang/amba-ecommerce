"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { useAuth } from "@/lib/auth/context";
import { useRouter, usePathname } from "next/navigation";
import { toast } from "sonner";

interface CartItem {
  id: string;
  productId: string;
  variantId: string | null;
  quantity: number;
  price: number;
  product: {
    title: string;
    images: string[];
    slug: string;
  };
  variant?: {
    color: string | null;
    size: string | null;
    unit: string | null;
  } | null;
  selectedOptions?: {
    color?: string;
    size?: string;
  } | null;
}

interface CartContextType {
  items: CartItem[];
  total: number;
  itemCount: number;
  loading: boolean;
  addToCart: (item: {
    productId: string;
    variantId: string | null;
    quantity: number;
    price: number;
    selectedOptions?: { color?: string; size?: string } | null;
  }) => Promise<void>;
  updateQuantity: (itemId: string, quantity: number) => Promise<void>;
  removeItem: (itemId: string) => Promise<void>;
  clearCart: () => Promise<void>;
  refreshCart: () => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);

  const total = items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  const fetchCart = useCallback(async () => {
    if (!user) {
      setItems([]);
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const res = await fetch("/api/cart");
      if (res.ok) {
        const data = await res.json();
        setItems(data.items || []);
      } else {
        console.error("Failed to fetch cart");
      }
    } catch (error) {
      console.error("Failed to fetch cart:", error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  // ✅ Match by variantId or selectedOptions to prevent duplicate merging
  const findItemIndex = (
    productId: string,
    variantId: string | null,
    selectedOptions?: { color?: string; size?: string } | null,
  ) => {
    return items.findIndex((item) => {
      if (item.productId !== productId) return false;
      if (variantId !== null) {
        return item.variantId === variantId;
      }
      if (item.variantId !== null) return false;
      if (selectedOptions?.color) {
        return item.selectedOptions?.color === selectedOptions.color;
      }
      if (selectedOptions?.size) {
        return item.selectedOptions?.size === selectedOptions.size;
      }
      return !item.selectedOptions?.color && !item.selectedOptions?.size;
    });
  };

  const requireAuth = (): boolean => {
    if (!user) {
      toast.error("Please login to manage your cart");
      const returnUrl = encodeURIComponent(pathname);
      router.push(`/login?redirectTo=${returnUrl}`);
      return false;
    }
    return true;
  };

  const addToCart = async (newItem: {
    productId: string;
    variantId: string | null;
    quantity: number;
    price: number;
    selectedOptions?: { color?: string; size?: string } | null;
  }) => {
    if (!requireAuth()) return;

    const existingIndex = findItemIndex(
      newItem.productId,
      newItem.variantId,
      newItem.selectedOptions,
    );

    let previousItems: CartItem[] = [];

    setItems((current) => {
      previousItems = [...current];
      if (existingIndex >= 0) {
        const updated = [...current];
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: updated[existingIndex].quantity + newItem.quantity,
        };
        return updated;
      } else {
        const optimisticItem: CartItem = {
          id: `temp-${Date.now()}`,
          productId: newItem.productId,
          variantId: newItem.variantId,
          quantity: newItem.quantity,
          price: newItem.price,
          product: {
            title: "Loading...",
            images: [],
            slug: "",
          },
          variant: null,
          selectedOptions: newItem.selectedOptions,
        };
        return [...current, optimisticItem];
      }
    });

    try {
      const res = await fetch("/api/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newItem),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to add to cart");
      }

      setItems((current) => {
        if (existingIndex >= 0) {
          return current.map((item) =>
            item.id === data.item.id ? data.item : item,
          );
        } else {
          return current
            .filter((item) => !item.id.startsWith("temp-"))
            .concat(data.item);
        }
      });

      toast.success("Item added to cart!");
    } catch (error: any) {
      setItems(previousItems);
      toast.error(error.message);
      throw error;
    }
  };

  const updateQuantity = async (itemId: string, newQuantity: number) => {
    if (!requireAuth()) return;

    if (newQuantity < 1) {
      await removeItem(itemId);
      return;
    }

    let previousItems: CartItem[] = [];
    setItems((current) => {
      previousItems = [...current];
      return current.map((item) =>
        item.id === itemId ? { ...item, quantity: newQuantity } : item,
      );
    });

    try {
      const res = await fetch(`/api/cart/${itemId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quantity: newQuantity }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to update quantity");
      }

      // ✅ Merge server response with existing item to preserve all fields
      setItems((current) =>
        current.map((item) => {
          if (item.id !== itemId) return item;
          const serverItem = data.item;
          if (serverItem) {
            return {
              ...item,
              quantity: serverItem.quantity ?? newQuantity,
              price: serverItem.price ?? item.price,
              variant:
                serverItem.variant !== undefined
                  ? serverItem.variant
                  : item.variant,
              selectedOptions:
                serverItem.selectedOptions !== undefined
                  ? serverItem.selectedOptions
                  : item.selectedOptions,
              product: serverItem.product ?? item.product,
            };
          }
          return { ...item, quantity: newQuantity };
        }),
      );
    } catch (error: any) {
      setItems(previousItems);
      toast.error(error.message);
      throw error;
    }
  };

  const removeItem = async (itemId: string) => {
    if (!requireAuth()) return;

    let previousItems: CartItem[] = [];
    setItems((current) => {
      previousItems = [...current];
      return current.filter((item) => item.id !== itemId);
    });

    try {
      const res = await fetch(`/api/cart/${itemId}`, {
        method: "DELETE",
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to remove item");
      }

      toast.success("Item removed from cart");
    } catch (error: any) {
      setItems(previousItems);
      toast.error(error.message);
      throw error;
    }
  };

  const clearCart = async () => {
    if (!requireAuth()) return;

    const previousItems = [...items];
    setItems([]);

    try {
      await Promise.all(
        previousItems.map((item) =>
          fetch(`/api/cart/${item.id}`, { method: "DELETE" }),
        ),
      );
      toast.success("Cart cleared");
    } catch (error: any) {
      setItems(previousItems);
      toast.error("Failed to clear cart");
      throw error;
    }
  };

  return (
    <CartContext.Provider
      value={{
        items,
        total,
        itemCount,
        loading,
        addToCart,
        updateQuantity,
        removeItem,
        clearCart,
        refreshCart: fetchCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
