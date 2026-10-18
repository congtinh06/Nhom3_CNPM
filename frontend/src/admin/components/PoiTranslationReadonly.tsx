import React from 'react';
import { AdminPoiTranslation, POI_LANGUAGES } from '../types/poi';
import { StatusBadge } from './StatusBadge';

export interface PoiTranslationReadonlyProps {
  translations?: Record<string, AdminPoiTranslation>;
}

const READONLY_LANGUAGES = POI_LANGUAGES.filter((lang) => lang.code !== 'vi');

export const PoiTranslationReadonly: React.FC<PoiTranslationReadonlyProps> = ({ translations }) => {
  return (
    <div className="adm-card adm-form-section">
      <h2 className="adm-card-title">Bản dịch ngôn ngữ khác</h2>
      <p className="adm-form-hint">
        Nội dung các ngôn ngữ khác được hệ thống dịch tự động từ nội dung tiếng Việt và chỉ hiển thị
        để tham khảo.
      </p>

      <div className="adm-translation-list">
        {READONLY_LANGUAGES.map((lang) => {
          const translation = translations?.[lang.code];
          return (
            <div key={lang.code} className="adm-translation-item">
              <div className="adm-translation-head">
                <span className="adm-translation-name">{lang.label}</span>
                {translation ? (
                  <StatusBadge status={translation.audioStatus} />
                ) : (
                  <span className="adm-date-text">Chưa có bản dịch</span>
                )}
              </div>

              {translation ? (
                <div className="adm-translation-fields">
                  <div className="adm-translation-field">
                    <span className="adm-translation-label">Tiêu đề</span>
                    <p className="adm-translation-text">{translation.title || '-'}</p>
                  </div>
                  <div className="adm-translation-field">
                    <span className="adm-translation-label">Tóm tắt</span>
                    <p className="adm-translation-text">{translation.summary || '-'}</p>
                  </div>
                  <div className="adm-translation-field">
                    <span className="adm-translation-label">Mô tả</span>
                    <p className="adm-translation-text">{translation.description || '-'}</p>
                  </div>
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
};
