"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { useAuth } from "@/lib/auth/context";
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
  };
  variant?: {
    color: string | null;
    size: string | null;
    unit: string | null;
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
  }) => Promise<void>;
  updateQuantity: (itemId: string, quantity: number) => Promise<void>;
  removeItem: (itemId: string) => Promise<void>;
  clearCart: () => Promise<void>;
  refreshCart: () => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Calculate totals
  const total = items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  // Fetch cart from server (initial load and after user changes)
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

  // Helper to find existing item index
  const findItemIndex = (productId: string, variantId: string | null) => {
    return items.findIndex(
      (item) => item.productId === productId && item.variantId === variantId,
    );
  };

  // Optimistic add to cart
  const addToCart = async (newItem: {
    productId: string;
    variantId: string | null;
    quantity: number;
    price: number;
  }) => {
    if (!user) {
      toast.error("Please login to add items to cart");
      throw new Error("Not authenticated");
    }

    // Optimistic update
    const existingIndex = findItemIndex(newItem.productId, newItem.variantId);
    let previousItems: CartItem[] = [];

    setItems((current) => {
      previousItems = [...current];
      if (existingIndex >= 0) {
        // Update existing item quantity
        const updated = [...current];
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: updated[existingIndex].quantity + newItem.quantity,
        };
        return updated;
      } else {
        // Create temporary optimistic item (without ID)
        // We'll replace it with real data from server
        const optimisticItem: CartItem = {
          id: `temp-${Date.now()}`,
          productId: newItem.productId,
          variantId: newItem.variantId,
          quantity: newItem.quantity,
          price: newItem.price,
          product: {
            title: "Loading...", // Will be replaced by server response
            images: [],
          },
          variant: null,
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

      // Replace optimistic item with real data from server
      setItems((current) => {
        if (existingIndex >= 0) {
          // Update existing item with server data
          return current.map((item) =>
            item.id === data.item.id ? data.item : item,
          );
        } else {
          // Remove optimistic item and add real one
          return current
            .filter((item) => !item.id.startsWith("temp-"))
            .concat(data.item);
        }
      });
    } catch (error: any) {
      // Revert on error
      setItems(previousItems);
      toast.error(error.message);
      throw error;
    }
  };

  // Optimistic update quantity
  const updateQuantity = async (itemId: string, newQuantity: number) => {
    if (newQuantity < 1) {
      // Remove if quantity zero
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

      // Update with server response (in case price changed, etc.)
      if (data.item) {
        setItems((current) =>
          current.map((item) => (item.id === itemId ? data.item : item)),
        );
      }
    } catch (error: any) {
      setItems(previousItems);
      toast.error(error.message);
      throw error;
    }
  };

  // Optimistic remove
  const removeItem = async (itemId: string) => {
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
    } catch (error: any) {
      setItems(previousItems);
      toast.error(error.message);
      throw error;
    }
  };

  // Clear cart (bulk delete)
  const clearCart = async () => {
    const previousItems = [...items];
    setItems([]);

    try {
      // Delete all items one by one (could be optimized with bulk endpoint)
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
