import { formatPrice } from '../../utils/formatters';

export interface FreeShippingBarProps {
  subtotal: number;
  threshold: number;
}

export function FreeShippingBar({ subtotal, threshold }: FreeShippingBarProps) {
  const isFree = subtotal >= threshold;
  const remaining = Math.max(0, threshold - subtotal);
  const percentage = Math.min(100, Math.max(0, (subtotal / threshold) * 100));

  if (isFree) {
    return (
      <div className="mt-2 text-xs text-done font-medium">
        Ban da duoc mien phi giao hang
      </div>
    );
  }

  return (
    <div className="mt-2 w-full">
      <div
        className="h-1 bg-border rounded-full w-full overflow-hidden"
        role="progressbar"
        aria-valuenow={Math.round(percentage)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Tien trinh mien phi giao hang"
      >
        <div
          className="h-1 bg-accent rounded-full transition-all duration-300"
          style={{ width: `${percentage}%` }}
        />
      </div>
      <p className="text-xs text-textSecondary mt-2">
        Mua them {formatPrice(remaining)} de duoc mien phi giao hang
      </p>
    </div>
  );
}
