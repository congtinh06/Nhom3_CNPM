import React from 'react';
import { Link } from 'react-router-dom';
import { defaultProducts } from '../../content/defaultProducts';
import { useHomeI18n } from '../../content/homeI18n';

const HOME_DISH_SLUGS = [
  'com-tam-suon-bi-cha',
  'banh-mi-thit-nguoi-pate',
  'hu-tieu-nam-vang',
  'banh-xeo-nam-bo',
];

export const FoodSection: React.FC = () => {
  const { t } = useHomeI18n();

  const dishes = HOME_DISH_SLUGS.map((slug) =>
    defaultProducts.find((product) => product.slug === slug)
  ).filter((product): product is (typeof defaultProducts)[number] => Boolean(product));

  return (
    <section className="s food-home" id="am-thuc">
      <h2>{t.foodTitle}</h2>
      <p className="food-desc">{t.foodParagraph}</p>
      <div className="food-grid">
        {dishes.map((dish) => (
          <Link key={dish.id} to={`/am-thuc/${dish.slug}`} className="food-card">
            <div className="food-card-media">
              <img src={dish.imagePath} alt={dish.name} loading="lazy" />
            </div>
            <div className="food-card-body">
              <h3 className="food-card-title">{dish.name}</h3>
              <span className="food-card-price">{dish.price.toLocaleString('vi-VN')}đ</span>
            </div>
          </Link>
        ))}
      </div>
      <div className="food-actions">
        <Link to="/am-thuc" className="tb">
          {t.foodCta}
        </Link>
      </div>
    </section>
  );
};
