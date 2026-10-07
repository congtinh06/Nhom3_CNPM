import React from 'react';
import { Link } from 'react-router-dom';
import { PhotoFrame } from '../common/PhotoFrame';
import { drinksList } from '../../content/staticSections';
import { useCart } from '../../context/CartContext';
import { useToast } from '../../context/ToastContext';
import { formatPrice } from '../cart/CartDialog';
import { Drink } from '../../types';

export const DrinksSection: React.FC = () => {
  const { addToCart } = useCart();
  const { showToast } = useToast();

  const handleAdd = (drink: Drink) => {
    addToCart(drink.id);
    showToast(`Đã thêm ${drink.name} vào giỏ`);
    (window as unknown as { __pop?: () => void }).__pop?.();
  };

  return (
    <section className="s dk" id="thuc-uong">
      <h2>Thức uống Sài Gòn</h2>
      <div className="g" id="dr">
        {drinksList.map((drink) => (
          <div key={drink.id}>
            <PhotoFrame hue={drink.hue} caption={`Ảnh: ${drink.name}`} />
            <h3>{drink.name}</h3>
            <p>{drink.description}</p>
            <div className="pr">
              <b>{formatPrice(drink.price)}</b>
              <button
                type="button"
                className="tb"
                onClick={() => handleAdd(drink)}
              >
                + Thêm vào giỏ
              </button>
            </div>
          </div>
        ))}
      </div>
      <div style={{ textAlign: 'center', marginTop: 32 }}>
        <Link to="/thuc-uong" className="tb" style={{ textDecoration: 'none', padding: '10px 24px', fontSize: 15 }}>
          Xem toàn bộ thực đơn thức uống
        </Link>
      </div>
    </section>
  );
};
