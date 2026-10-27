import { ReactNode, useMemo, useState } from 'react';
import { Trash2, Plus, Minus, ChevronDown, ChevronUp, Utensils } from 'lucide-react';
import { formatPrice } from '../../utils/formatters';
import { useNavbarLanguage } from '../../content/languages';
import { getSpotName } from '../../content/souvenirSpots';
import { usePremium } from '../../context/PremiumContext';
import { applySouvenirDiscount } from '../../utils/pricing';
import { ProductCategory } from '../../types';

export interface OrderSummaryItem {
  id: number;
  name: string;
  quantity: number;
  price: number;
  category?: ProductCategory;
  imageUrl?: string;
  poiSlug?: string | null;
}

export interface OrderSummaryProps {
  items: OrderSummaryItem[];
  subtotal: number;
  discountAmount?: number;
  shippingFee: number;
  total: number;
  totalCount: number;
  onUpdateQuantity: (id: number, quantity: number) => void;
  onRemoveItem: (id: number) => void;
  children?: ReactNode;
}

const OTHER_GROUP = '__other__';

export function OrderSummary({
  items,
  subtotal,
  discountAmount = 0,
  shippingFee,
  total,
  totalCount,
  onUpdateQuantity,
  onRemoveItem,
  children,
}: OrderSummaryProps) {
  const { lang, t } = useNavbarLanguage();
  const { isPremium, hasAnyPurchase } = usePremium();
  const isDiscountEligible = isPremium || hasAnyPurchase;
  const c = t.shop.checkoutPage;
  const [isOpen, setIsOpen] = useState(false);
  const isFreeShipping = shippingFee === 0;
  const originalSubtotal = subtotal + discountAmount;

  const groups = useMemo(() => {
    const map = new Map<string, OrderSummaryItem[]>();
    for (const item of items) {
      const key = item.poiSlug ? item.poiSlug : OTHER_GROUP;
      const bucket = map.get(key);
      if (bucket) {
        bucket.push(item);
      } else {
        map.set(key, [item]);
      }
    }
    return Array.from(map.entries());
  }, [items]);

  const groupTitle = (key: string): string =>
    key === OTHER_GROUP
      ? c.groupOther
      : c.groupFromSpot.replace('{spot}', getSpotName(key, lang));

  return (
    <aside className="co-card co-summary">
      <div className="co-summary-head">
        <h2 className="co-card-title">{c.summarySection}</h2>
        <button
          type="button"
          className="co-summary-toggle"
          aria-expanded={isOpen}
          aria-controls="co-summary-body"
          aria-label={isOpen ? c.collapseSummary : c.expandSummary}
          onClick={() => setIsOpen((prev) => !prev)}
        >
          <span className="co-summary-meta">
            <span>{c.itemCountValue.replace('{n}', String(totalCount))}</span>
            <span className="co-summary-meta-total">{formatPrice(total)}</span>
          </span>
          {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
      </div>

      <div
        id="co-summary-body"
        className={`co-summary-body ${isOpen ? 'is-open' : ''}`}
      >
        <div className="co-summary-groups">
          {groups.map(([key, groupItems]) => (
            <div key={key} className="co-summary-group">
              <h3 className="co-summary-group-title">{groupTitle(key)}</h3>
              {groupItems.map((item) => (
                <div key={item.id} className="co-item">
                  <div className="co-item-main">
                    {item.imageUrl ? (
                      <img
                        src={item.imageUrl}
                        alt={item.name}
                        className="co-item-thumb"
                        loading="lazy"
                      />
                    ) : (
                      <span className="co-item-thumb co-item-thumb-empty" aria-hidden="true">
                        <Utensils size={18} />
                      </span>
                    )}
                    <div className="co-item-info">
                      <span className="co-item-name">{item.name}</span>
                      <span className="co-item-price">
                        {formatPrice(
                          applySouvenirDiscount(item.price, isDiscountEligible, item.category) *
                            item.quantity
                        )}
                      </span>
                    </div>
                  </div>

                  <div className="co-item-controls">
                    <button
                      type="button"
                      onClick={() => {
                        if (item.quantity > 1) {
                          onUpdateQuantity(item.id, item.quantity - 1);
                        } else {
                          onRemoveItem(item.id);
                        }
                      }}
                      className="co-qty-btn"
                      aria-label={c.decreaseQty.replace('{name}', item.name)}
                    >
                      <Minus size={12} strokeWidth={2.5} />
                    </button>
                    <span className="co-qty-val">{item.quantity}</span>
                    <button
                      type="button"
                      onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                      className="co-qty-btn"
                      aria-label={c.increaseQty.replace('{name}', item.name)}
                    >
                      <Plus size={12} strokeWidth={2.5} />
                    </button>
                    <button
                      type="button"
                      onClick={() => onRemoveItem(item.id)}
                      className="co-trash-btn"
                      aria-label={c.removeItem.replace('{name}', item.name)}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>

        <div className="co-cost-list">
          <div className="co-cost-line">
            <span>{c.itemCountLabel}</span>
            <span>{c.itemCountValue.replace('{n}', String(totalCount))}</span>
          </div>
          <div className="co-cost-line">
            <span>{c.subtotalLabel}</span>
            <span>{formatPrice(originalSubtotal)}</span>
          </div>
          {discountAmount > 0 && (
            <div className="co-cost-line co-discount-line">
              <span>Premium -10%</span>
              <span>-{formatPrice(discountAmount)}</span>
            </div>
          )}
          <div className="co-cost-line">
            <span>{c.shippingFeeLabel}</span>
            {isFreeShipping ? (
              <span className="co-free-ship">{c.freeShip}</span>
            ) : (
              <span>{formatPrice(shippingFee)}</span>
            )}
          </div>
        </div>

        <div className="co-total-line">
          <span className="co-total-label">{c.grandTotalLabel}</span>
          <span className="co-total-val">{formatPrice(total)}</span>
        </div>

        {children}
      </div>
    </aside>
  );
}

export default OrderSummary;
