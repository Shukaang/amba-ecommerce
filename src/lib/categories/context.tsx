"use client";

import React, { createContext, useContext } from "react";

export interface Category {
  id: string;
  title: string;
  parent_id: string | null;
  children?: Category[];
}

interface CategoryContextType {
  categories: Category[];
  loading: boolean;
}

const CategoryContext = createContext<CategoryContextType | undefined>(
  undefined,
);

export function CategoryProvider({
  children,
  categories,
  loading = false,
}: {
  children: React.ReactNode;
  categories: Category[];
  loading?: boolean;
}) {
  return (
    <CategoryContext.Provider value={{ categories, loading }}>
      {children}
    </CategoryContext.Provider>
  );
}

export function useCategories() {
  const context = useContext(CategoryContext);
  if (!context) {
    throw new Error("useCategories must be used within CategoryProvider");
  }
  return context;
}
