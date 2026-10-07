import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { drinksList } from '../content/staticSections';
import { CartItem, Drink, Product, ProductCategory } from '../types';

export interface CartItemMeta {
  name: string;
  price: number;
  slug?: string;
  category?: ProductCategory;
  imagePath?: string;
}

interface CartContextValue {
  cart: Record<number, number>;
  totalCount: number;
  totalAmount: number;
  cartItems: CartItem[];
  addToCart: (item: number | Product, quantity?: number) => void;
  updateQuantity: (id: number, quantity: number) => void;
  removeFromCart: (id: number) => void;
  decreaseQuantity: (id: number) => void;
  clearCart: () => void;
  reorderItems: (
    items: {
      key: number;
      quantity: number;
      name?: string;
      price?: number;
      slug?: string;
      category?: ProductCategory;
      imagePath?: string;
    }[]
  ) => void;
  isCartOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);

const STORAGE_KEY = 'cart';
const META_STORAGE_KEY = 'cart_meta';

const loadSavedCart = (): Record<number, number> => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY) || localStorage.getItem('sv:cart');
    if (!raw) return {};
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)) {
      const validCart: Record<number, number> = {};
      for (const [key, val] of Object.entries(parsed)) {
        const numKey = Number(key);
        const numVal = Number(val);
        if (!Number.isNaN(numKey) && !Number.isNaN(numVal) && numVal > 0) {
          validCart[numKey] = Math.floor(numVal);
        }
      }
      return validCart;
    }
    return {};
  } catch {
    return {};
  }
};

const loadSavedMeta = (): Record<number, CartItemMeta> => {
  try {
    const raw = localStorage.getItem(META_STORAGE_KEY);
    if (!raw) return {};
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)) {
      const validMeta: Record<number, CartItemMeta> = {};
      for (const [key, val] of Object.entries(parsed)) {
        const numKey = Number(key);
        if (!Number.isNaN(numKey) && val && typeof val === 'object') {
          const v = val as Record<string, unknown>;
          if (typeof v.name === 'string' && typeof v.price === 'number') {
            validMeta[numKey] = {
              name: v.name,
              price: v.price,
              slug: typeof v.slug === 'string' ? v.slug : undefined,
              category: (v.category === 'FOOD' || v.category === 'DRINK') ? v.category : undefined,
              imagePath: typeof v.imagePath === 'string' ? v.imagePath : undefined,
            };
          }
        }
      }
      return validMeta;
    }
    return {};
  } catch {
    return {};
  }
};

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cart, setCart] = useState<Record<number, number>>(loadSavedCart);
  const [itemMeta, setItemMeta] = useState<Record<number, CartItemMeta>>(loadSavedMeta);
  const [isCartOpen, setIsCartOpen] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
    } catch {
      // Ignore quota errors
    }
  }, [cart]);

  useEffect(() => {
    try {
      localStorage.setItem(META_STORAGE_KEY, JSON.stringify(itemMeta));
    } catch {
      // Ignore quota errors
    }
  }, [itemMeta]);

  const drinksMap = useMemo(() => {
    const map = new Map<number, Drink>();
    drinksList.forEach((d) => map.set(d.id, d));
    return map;
  }, []);

  const totalCount = useMemo(() => {
    return Object.values(cart).reduce((sum, qty) => sum + qty, 0);
  }, [cart]);

  const cartItems = useMemo(() => {
    return Object.entries(cart)
      .map(([keyStr, qty]) => {
        const key = Number(keyStr);
        const meta = itemMeta[key];
        if (meta) {
          return {
            id: key,
            name: meta.name,
            price: meta.price,
            quantity: qty,
            slug: meta.slug,
            category: meta.category,
            imagePath: meta.imagePath,
          };
        }
        const drink = drinksMap.get(key);
        if (drink) {
          return {
            id: key,
            name: drink.name,
            price: drink.price,
            quantity: qty,
          };
        }
        return null;
      })
      .filter((item): item is CartItem => item !== null);
  }, [cart, itemMeta, drinksMap]);

  const totalAmount = useMemo(() => {
    return cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  }, [cartItems]);

  const addToCart = useCallback((item: number | Product, quantity: number = 1) => {
    const addQty = Math.max(1, Math.floor(quantity));
    if (typeof item === 'number') {
      const drinkId = item;
      setCart((prev) => ({
        ...prev,
        [drinkId]: (prev[drinkId] ?? 0) + addQty,
      }));
    } else {
      const product = item;
      setItemMeta((prev) => ({
        ...prev,
        [product.id]: {
          name: product.name,
          price: Number(product.price),
          slug: product.slug,
          category: product.category,
          imagePath: product.imagePath,
        },
      }));
      setCart((prev) => ({
        ...prev,
        [product.id]: (prev[product.id] ?? 0) + addQty,
      }));
    }
  }, []);

  const updateQuantity = useCallback((id: number, quantity: number) => {
    const targetQty = Math.floor(quantity);
    setCart((prev) => {
      if (targetQty <= 0) {
        const next = { ...prev };
        delete next[id];
        return next;
      }
      return {
        ...prev,
        [id]: targetQty,
      };
    });
  }, []);

  const decreaseQuantity = useCallback((id: number) => {
    setCart((prev) => {
      const current = prev[id];
      if (!current || current <= 1) {
        const next = { ...prev };
        delete next[id];
        return next;
      }
      return {
        ...prev,
        [id]: current - 1,
      };
    });
  }, []);

  const removeFromCart = useCallback((id: number) => {
    setCart((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
    setItemMeta((prev) => {
      if (!(id in prev)) return prev;
      const next = { ...prev };
      delete next[id];
      return next;
    });
  }, []);

  const clearCart = useCallback(() => {
    setCart({});
    setItemMeta({});
  }, []);

  const reorderItems = useCallback(
    (
      items: {
        key: number;
        quantity: number;
        name?: string;
        price?: number;
        slug?: string;
        category?: ProductCategory;
        imagePath?: string;
      }[]
    ) => {
      setCart((prev) => {
        const next = { ...prev };
        items.forEach((it) => {
          next[it.key] = (next[it.key] ?? 0) + it.quantity;
        });
        return next;
      });
      setItemMeta((prev) => {
        const next = { ...prev };
        items.forEach((it) => {
          if (it.name && typeof it.price === 'number') {
            next[it.key] = {
              name: it.name,
              price: it.price,
              slug: it.slug,
              category: it.category,
              imagePath: it.imagePath,
            };
          }
        });
        return next;
      });
    },
    []
  );

  const openCart = useCallback(() => setIsCartOpen(true), []);
  const closeCart = useCallback(() => setIsCartOpen(false), []);

  return (
    <CartContext.Provider
      value={{
        cart,
        totalCount,
        totalAmount,
        cartItems,
        addToCart,
        updateQuantity,
        removeFromCart,
        decreaseQuantity,
        clearCart,
        reorderItems,
        isCartOpen,
        openCart,
        closeCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = (): CartContextValue => {
  const ctx = useContext(CartContext);
  if (!ctx) {
    throw new Error('useCart must be used within CartProvider');
  }
  return ctx;
};

