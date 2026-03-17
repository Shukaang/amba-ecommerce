"use client";

import { useRef } from "react";
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { useAuth } from "@/lib/auth/context";
import { toast } from "sonner";

interface Product {
  id: string;
  slug: string;
  title: string;
  description: string;
  price: number;
  average_rating: number;
  images: string[];
  product_variants?: Array<{
    id: string;
    color?: string;
    size?: string;
    unit?: string;
    price: number;
  }>;
}

interface FavoritesContextType {
  items: Product[];
  loading: boolean;
  isFavorite: (productId: string) => boolean;
  toggleFavorite: (productId: string, product?: Product) => Promise<void>;
  refreshFavorites: () => Promise<void>;
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(
  undefined,
);

export function FavoritesProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [items, setItems] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const prevUserRef = useRef(user);

  const fetchFavorites = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/favorites");

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to fetch favorites");
      }
      const data = await res.json();
      setItems(data.items || []);
      setItems(data.items || []);
    } catch (error: any) {
      console.error("Failed to fetch favorites:", error);
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  }, []); // No dependencies – it's stable

  // Initial fetch
  useEffect(() => {
    fetchFavorites();
  }, [fetchFavorites]);

  // Refetch when auth state changes (login/logout)
  useEffect(() => {
    fetchFavorites();
  }, [user, fetchFavorites]);

  useEffect(() => {
    const mergeFavorites = async () => {
      if (!user) return;
      try {
        const res = await fetch("/api/favorites/merge", { method: "POST" });
        if (res.ok) {
          const data = await res.json();
          if (data.merged) {
            console.log(`Merged ${data.count} favorites`);
            await fetchFavorites(); // Refresh the list after merge
          }
        }
      } catch (error) {
        console.error("Failed to merge favorites:", error);
      }
    };

    // Only run when transitioning from null → user (login)
    if (prevUserRef.current === null && user !== null) {
      mergeFavorites();
    }
    prevUserRef.current = user;
  }, [user, fetchFavorites]); // fetchFavorites is stable due to useCallback

  useEffect(() => {
    fetchFavorites();
  }, [fetchFavorites]);

  const isFavorite = (productId: string) =>
    items.some((p) => p.id === productId);

  const toggleFavorite = async (productId: string, product?: Product) => {
    const wasFavorite = isFavorite(productId);

    // Optimistic update
    if (wasFavorite) {
      setItems((prev) => prev.filter((p) => p.id !== productId));
    } else if (product) {
      setItems((prev) => [product, ...prev]);
    }

    try {
      const res = await fetch("/api/favorites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update favorites");

      if (data.added) {
        if (!product) await fetchFavorites(); // fallback
        toast.success("Added to favorites");
      } else {
        toast.success("Removed from favorites");
      }
    } catch (error: any) {
      // Revert optimistic update
      if (wasFavorite) {
        await fetchFavorites(); // restore full list
      } else if (product) {
        setItems((prev) => prev.filter((p) => p.id !== productId));
      }
      toast.error(error.message);
    }
  };

  return (
    <FavoritesContext.Provider
      value={{
        items,
        loading,
        isFavorite,
        toggleFavorite,
        refreshFavorites: fetchFavorites,
      }}
    >
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites() {
  const context = useContext(FavoritesContext);
  if (context === undefined) {
    throw new Error("useFavorites must be used within a FavoritesProvider");
  }
  return context;
}
