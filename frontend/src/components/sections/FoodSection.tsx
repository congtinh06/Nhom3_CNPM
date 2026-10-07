import { Link } from 'react-router-dom';
import { PhotoFrame } from '../common/PhotoFrame';
import { foodContent } from '../../content/staticSections';

export const FoodSection: React.FC = () => {
  return (
    <section className="s food" id="am-thuc">
      <div className="t">
        {foodContent.photosTop.map((photo, index) => (
          <PhotoFrame key={index} hue={photo.hue} caption={photo.caption} />
        ))}
      </div>
      <div className="m">
        <h2>{foodContent.title}</h2>
        <p>{foodContent.paragraph}</p>
        <div style={{ marginTop: 20 }}>
          <Link to="/am-thuc" className="tb" style={{ textDecoration: 'none' }}>
            Khám phá thực đơn ẩm thực
          </Link>
        </div>
      </div>
      <div className="b">
        {foodContent.photosBottom.map((photo, index) => (
          <PhotoFrame key={index} hue={photo.hue} caption={photo.caption} />
        ))}
      </div>
    </section>
  );
};
