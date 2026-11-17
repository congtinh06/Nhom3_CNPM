import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { drinksList } from '../content/staticSections';
import { defaultProducts } from '../content/defaultProducts';
import { CartItem, Drink, Product, ProductCategory } from '../types';
import { usePremium } from './PremiumContext';
import { applySouvenirDiscount, isSouvenirDiscountEligible } from '../utils/pricing';
import { resolveOrderItemImage } from '../content/productAdapter';
import './cart-confirmation.css';

export interface CartItemMeta {
  name: string;
  price: number;
  slug?: string;
  category?: ProductCategory;
  imagePath?: string;
  poiSlug?: string | null;
}

interface CartContextValue {
  cart: Record<number, number>;
  totalCount: number;
  subtotalAmount: number;
  discountAmount: number;
  totalAmount: number;
  cartItems: CartItem[];
  addToCart: (item: number | Product, quantity?: number) => Promise<boolean>;
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
      poiSlug?: string | null;
    }[]
  ) => Promise<boolean>;
  isCartOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);

const STORAGE_KEY = 'cart';
const META_STORAGE_KEY = 'cart_meta';
const MAX_CART_QUANTITY_WITHOUT_CONFIRMATION = 5;

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
              category: (v.category === 'FOOD' || v.category === 'DRINK' || v.category === 'SOUVENIR') ? v.category : undefined,
              imagePath: typeof v.imagePath === 'string' ? v.imagePath : undefined,
              poiSlug: typeof v.poiSlug === 'string' ? v.poiSlug : undefined,
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
  const { isPremium, hasAnyPurchase } = usePremium();
  const isSouvenirDiscountEligibleUser = isPremium || hasAnyPurchase;
  const [cart, setCart] = useState<Record<number, number>>(loadSavedCart);
  const [itemMeta, setItemMeta] = useState<Record<number, CartItemMeta>>(loadSavedMeta);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isLargeItemConfirmationOpen, setIsLargeItemConfirmationOpen] = useState(false);
  const cartRef = useRef(cart);
  const confirmationResolverRef = useRef<((confirmed: boolean) => void) | null>(null);
  const confirmationDialogRef = useRef<HTMLDialogElement>(null);
  cartRef.current = cart;

  useEffect(() => {
    const dialog = confirmationDialogRef.current;
    if (!dialog) return;
    if (isLargeItemConfirmationOpen && !dialog.open) {
      dialog.showModal();
    } else if (!isLargeItemConfirmationOpen && dialog.open) {
      dialog.close();
    }
  }, [isLargeItemConfirmationOpen]);

  const requestLargeItemConfirmation = useCallback(
    () =>
      new Promise<boolean>((resolve) => {
        confirmationResolverRef.current = resolve;
        setIsLargeItemConfirmationOpen(true);
      }),
    []
  );

  const resolveLargeItemConfirmation = useCallback((confirmed: boolean) => {
    setIsLargeItemConfirmationOpen(false);
    const resolve = confirmationResolverRef.current;
    confirmationResolverRef.current = null;
    resolve?.(confirmed);
  }, []);

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

  const cartItems = useMemo(() => {
    return Object.entries(cart)
      .map(([keyStr, qty]): CartItem | null => {
        const key = Number(keyStr);
        const meta = itemMeta[key];
        if (meta) {
          const resolvedImg = resolveOrderItemImage({
            productId: key,
            productName: meta.name,
            imagePath: meta.imagePath,
          });
          return {
            id: key,
            name: meta.name,
            price: meta.price,
            quantity: qty,
            slug: meta.slug,
            category: meta.category,
            imagePath: resolvedImg || meta.imagePath,
            poiSlug: meta.poiSlug,
          };
        }
        const drink = drinksMap.get(key);
        if (drink) {
          const resolvedImg = resolveOrderItemImage({
            productId: key,
            productName: drink.name,
          });
          return {
            id: key,
            name: drink.name,
            price: drink.price,
            quantity: qty,
            imagePath: resolvedImg,
          };
        }
        const defaultProd = defaultProducts.find((p) => p.id === key);
        if (defaultProd) {
          const resolvedImg = resolveOrderItemImage({
            productId: defaultProd.id,
            productName: defaultProd.name,
            imagePath: defaultProd.imagePath,
          });
          return {
            id: key,
            name: defaultProd.name,
            price: defaultProd.price,
            quantity: qty,
            slug: defaultProd.slug,
            category: defaultProd.category,
            imagePath: resolvedImg || defaultProd.imagePath,
            poiSlug: defaultProd.poiSlug,
          };
        }
        return null;
      })
      .filter((item): item is CartItem => item !== null);
  }, [cart, itemMeta, drinksMap]);

  // totalCount bám theo các dòng hiển thị được trong giỏ để không đếm nhầm khóa mồ côi.
  const totalCount = useMemo(() => {
    return cartItems.reduce((sum, item) => sum + item.quantity, 0);
  }, [cartItems]);

  // Dọn các khóa giỏ hàng không còn phân giải được (sản phẩm đã bị xóa) cùng metadata của chúng.
  useEffect(() => {
    const orphanKeys = Object.keys(cart)
      .map((key) => Number(key))
      .filter((key) => {
        if (itemMeta[key]) return false;
        if (drinksMap.has(key)) return false;
        return !defaultProducts.some((p) => p.id === key);
      });

    if (orphanKeys.length === 0) return;

    setCart((prev) => {
      const next = { ...prev };
      orphanKeys.forEach((key) => delete next[key]);
      return next;
    });
    setItemMeta((prev) => {
      let changed = false;
      const next = { ...prev };
      orphanKeys.forEach((key) => {
        if (key in next) {
          delete next[key];
          changed = true;
        }
      });
      return changed ? next : prev;
    });
  }, [cart, itemMeta, drinksMap]);

  const subtotalAmount = useMemo(() => {
    return cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  }, [cartItems]);

  const discountAmount = useMemo(() => {
    if (!isSouvenirDiscountEligibleUser) return 0;
    return cartItems.reduce((sum, item) => {
      if (!isSouvenirDiscountEligible(isSouvenirDiscountEligibleUser, item.category)) return sum;
      const discounted = applySouvenirDiscount(item.price, isSouvenirDiscountEligibleUser, item.category);
      return sum + (item.price - discounted) * item.quantity;
    }, 0);
  }, [cartItems, isSouvenirDiscountEligibleUser]);

  const totalAmount = subtotalAmount - discountAmount;

  const addToCart = useCallback(async (item: number | Product, quantity: number = 1): Promise<boolean> => {
    const addQty = Math.max(1, Math.floor(quantity));
    if (
      addQty > MAX_CART_QUANTITY_WITHOUT_CONFIRMATION &&
      !(await requestLargeItemConfirmation())
    ) {
      return false;
    }

    const itemId = typeof item === 'number' ? item : item.id;
    cartRef.current = {
      ...cartRef.current,
      [itemId]: (cartRef.current[itemId] ?? 0) + addQty,
    };
    if (typeof item === 'number') {
      const drinkId = item;
      setCart((prev) => ({
        ...prev,
        [drinkId]: (prev[drinkId] ?? 0) + addQty,
      }));
    } else {
      const product = item;
      const resolvedImg = resolveOrderItemImage({
        productId: product.id,
        productName: product.name,
        imagePath: product.imagePath,
      });
      setItemMeta((prev) => ({
        ...prev,
        [product.id]: {
          name: product.name,
          price: Number(product.price),
          slug: product.slug,
          category: product.category,
          imagePath: resolvedImg || product.imagePath,
          poiSlug: product.poiSlug ?? undefined,
        },
      }));
      setCart((prev) => ({
        ...prev,
        [product.id]: (prev[product.id] ?? 0) + addQty,
      }));
    }
    return true;
  }, [requestLargeItemConfirmation]);

  const updateQuantity = useCallback((id: number, quantity: number) => {
    const targetQty = Math.floor(quantity);
    const next = { ...cartRef.current };
    if (targetQty <= 0) {
      delete next[id];
    } else {
      next[id] = targetQty;
    }
    cartRef.current = next;
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
    const next = { ...cartRef.current };
    if (!next[id] || next[id] <= 1) {
      delete next[id];
    } else {
      next[id] -= 1;
    }
    cartRef.current = next;
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
    const nextCart = { ...cartRef.current };
    delete nextCart[id];
    cartRef.current = nextCart;
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
    cartRef.current = {};
    setCart({});
    setItemMeta({});
  }, []);

  const reorderItems = useCallback(
    async (
      items: {
        key: number;
        quantity: number;
        name?: string;
        price?: number;
        slug?: string;
        category?: ProductCategory;
        imagePath?: string;
        poiSlug?: string | null;
      }[]
    ): Promise<boolean> => {
      const addedByItem = new Map<number, number>();
      items.forEach((item) => {
        addedByItem.set(
          item.key,
          (addedByItem.get(item.key) ?? 0) + Math.max(0, Math.floor(item.quantity))
        );
      });
      const exceedsItemLimit = [...addedByItem].some(
        ([, quantity]) => quantity > MAX_CART_QUANTITY_WITHOUT_CONFIRMATION
      );
      if (exceedsItemLimit && !(await requestLargeItemConfirmation())) {
        return false;
      }

      const nextCart = { ...cartRef.current };
      items.forEach((item) => {
        nextCart[item.key] = (nextCart[item.key] ?? 0) + item.quantity;
      });
      cartRef.current = nextCart;
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
            const resolvedImg = resolveOrderItemImage({
              productId: it.key,
              productName: it.name,
              imagePath: it.imagePath,
            });
            next[it.key] = {
              name: it.name,
              price: it.price,
              slug: it.slug,
              category: it.category,
              imagePath: resolvedImg || it.imagePath,
              poiSlug: it.poiSlug,
            };
          }
        });
        return next;
      });
      return true;
    },
    [requestLargeItemConfirmation]
  );

  const openCart = useCallback(() => setIsCartOpen(true), []);
  const closeCart = useCallback(() => setIsCartOpen(false), []);

  return (
    <CartContext.Provider
      value={{
        cart,
        totalCount,
        subtotalAmount,
        discountAmount,
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
      <dialog
        ref={confirmationDialogRef}
        className="cart-confirmation-dialog"
        role="alertdialog"
        aria-labelledby="cart-confirmation-title"
        aria-describedby="cart-confirmation-message"
        onCancel={(event) => {
          event.preventDefault();
          resolveLargeItemConfirmation(false);
        }}
      >
        <h2 id="cart-confirmation-title">Số lượng sản phẩm nhiều</h2>
        <p id="cart-confirmation-message">
          Món này đã vượt quá 5 sản phẩm. Bạn có chắc là muốn đặt thêm không?
        </p>
        <div className="cart-confirmation-actions">
          <button type="button" className="cart-confirmation-cancel" autoFocus onClick={() => resolveLargeItemConfirmation(false)}>
            Hủy
          </button>
          <button type="button" className="cart-confirmation-accept" onClick={() => resolveLargeItemConfirmation(true)}>
            Vẫn thêm
          </button>
        </div>
      </dialog>
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

// Variant that degrades to a no-op when rendered outside CartProvider so that
// components which only *optionally* add to cart can still render standalone
// (e.g. in unit tests) without crashing.
export const useCartOptional = (): Pick<CartContextValue, 'addToCart'> => {
  const ctx = useContext(CartContext);
  return { addToCart: ctx ? ctx.addToCart : async () => true };
};
