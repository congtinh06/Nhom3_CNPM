import { PageHero } from '../components/common/PageHero';
import { HERO_CONFIG } from '../config/heroImages';
import { useNavbarLanguage } from '../content/languages';
import { tContact } from '../content/contactI18n';

export function ContactPage() {
  const { lang } = useNavbarLanguage();

  return (
    <div className="contact-page-root">
      {/* 1. Full-bleed Photo Hero Banner */}
      <PageHero
        eyebrow={tContact(lang, 'eyebrow')}
        title={tContact(lang, 'title')}
        subtitle={tContact(lang, 'subtitle')}
        imageSrc={HERO_CONFIG.lienHe.src}
        imageSrcMobile={HERO_CONFIG.lienHe.srcMobile}
        imagePosition={HERO_CONFIG.lienHe.position}
        imageCredit={HERO_CONFIG.lienHe.credit}
      />

      {/* 2. Existing Contact Content Container */}
      <div className="max-w-7xl mx-auto px-6 py-12 font-body">
        <p className="text-textSecondary text-base leading-relaxed">
          Mọi thông tin phản hồi và liên hệ hợp tác, vui lòng gửi email về contact@saigonvoice.vn
          hoặc gọi hotline 1900 1234 để được hỗ trợ nhanh nhất.
        </p>
      </div>
    </div>
  );
}

export default ContactPage;
