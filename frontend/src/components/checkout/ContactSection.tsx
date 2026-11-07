import React, { useState, useEffect } from 'react';
import {
  getAllProvinces,
  getDistrictsByProvince,
  getWardsByDistrict,
  AddressItem,
} from '../../services/addressService';
import { useNavbarLanguage } from '../../content/languages';
import {
  CheckoutErrorCode,
  CheckoutErrors,
  CheckoutField,
} from './checkoutValidation';

export interface ContactFormData {
  receiverName: string;
  phone: string;
  email: string;
  provinceCode: string;
  provinceName: string;
  districtCode: string;
  districtName: string;
  wardCode: string;
  wardName: string;
  streetAddress: string;
  altAddress: string;
  note: string;
  deliveryTime: string;
  deliverToOther: boolean;
  otherReceiverName: string;
  otherReceiverPhone: string;
}

export interface ContactSectionProps {
  formData: ContactFormData;
  errors: CheckoutErrors;
  touched: Partial<Record<CheckoutField, boolean>>;
  submitted: boolean;
  onChange: (field: keyof ContactFormData, value: string | boolean) => void;
  onBlur: (field: CheckoutField) => void;
  disabled?: boolean;
}

function useErrorText() {
  const { t } = useNavbarLanguage();
  const c = t.shop.checkoutPage;
  return (code?: CheckoutErrorCode): string => {
    switch (code) {
      case 'NAME_REQUIRED':
        return c.errNameRequired;
      case 'NAME_SHORT':
        return c.errNameShort;
      case 'PHONE_REQUIRED':
        return c.errPhoneRequired;
      case 'PHONE_INVALID':
        return c.errPhoneInvalid;
      case 'EMAIL_INVALID':
        return c.errEmailInvalid;
      case 'PROVINCE_REQUIRED':
        return c.errProvinceRequired;
      case 'DISTRICT_REQUIRED':
        return c.errDistrictRequired;
      case 'WARD_REQUIRED':
        return c.errWardRequired;
      case 'STREET_REQUIRED':
        return c.errStreetRequired;
      case 'STREET_INVALID':
        return c.errStreetInvalid;
      default:
        return '';
    }
  };
}

export function ContactSection({
  formData,
  errors,
  touched,
  submitted,
  onChange,
  onBlur,
  disabled = false,
}: ContactSectionProps) {
  const { t } = useNavbarLanguage();
  const c = t.shop.checkoutPage;
  const errorText = useErrorText();

  const [provinces, setProvinces] = useState<AddressItem[]>([]);
  const [districts, setDistricts] = useState<AddressItem[]>([]);
  const [wards, setWards] = useState<AddressItem[]>([]);

  const [loadingProvinces, setLoadingProvinces] = useState(false);
  const [loadingDistricts, setLoadingDistricts] = useState(false);
  const [loadingWards, setLoadingWards] = useState(false);

  const isVisible = (field: CheckoutField): boolean =>
    (submitted || Boolean(touched[field])) && Boolean(errors[field]);

  const fieldError = (field: CheckoutField): string =>
    isVisible(field) ? errorText(errors[field]) : '';

  useEffect(() => {
    let isMounted = true;
    setLoadingProvinces(true);

    getAllProvinces()
      .then((data) => {
        if (!isMounted) return;
        setProvinces(data);

        if (!formData.provinceCode) {
          const hcm = data.find((p) => p.code === '79');
          if (hcm) {
            onChange('provinceCode', '79');
            onChange('provinceName', hcm.name);
          }
        }
      })
      .catch((err) => {
        console.error('Error fetching provinces:', err);
      })
      .finally(() => {
        if (isMounted) setLoadingProvinces(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!formData.provinceCode) {
      setDistricts([]);
      return;
    }

    let isMounted = true;
    setLoadingDistricts(true);

    getDistrictsByProvince(formData.provinceCode)
      .then((data) => {
        if (!isMounted) return;
        setDistricts(data);
      })
      .catch((err) => {
        console.error('Error fetching districts:', err);
      })
      .finally(() => {
        if (isMounted) setLoadingDistricts(false);
      });

    return () => {
      isMounted = false;
    };
  }, [formData.provinceCode]);

  useEffect(() => {
    if (!formData.districtCode) {
      setWards([]);
      return;
    }

    let isMounted = true;
    setLoadingWards(true);

    getWardsByDistrict(formData.districtCode)
      .then((data) => {
        if (!isMounted) return;
        setWards(data);
      })
      .catch((err) => {
        console.error('Error fetching wards:', err);
      })
      .finally(() => {
        if (isMounted) setLoadingWards(false);
      });

    return () => {
      isMounted = false;
    };
  }, [formData.districtCode]);

  const handleProvinceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const code = e.target.value;
    const selected = provinces.find((p) => p.code === code);
    onChange('provinceCode', code);
    onChange('provinceName', selected ? selected.name : '');
    onChange('districtCode', '');
    onChange('districtName', '');
    onChange('wardCode', '');
    onChange('wardName', '');
  };

  const handleDistrictChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const code = e.target.value;
    const selected = districts.find((d) => d.code === code);
    onChange('districtCode', code);
    onChange('districtName', selected ? selected.name : (code ? code : ''));
    onChange('wardCode', '');
    onChange('wardName', '');
  };

  const handleWardChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const code = e.target.value;
    const selected = wards.find((w) => w.code === code);
    onChange('wardCode', code);
    onChange('wardName', selected ? selected.name : (code ? code : ''));
  };

  return (
    <>
      <section className="co-card">
        <div className="co-card-head">
          <span className="co-card-index" aria-hidden="true">
            1
          </span>
          <h2 className="co-card-title">{c.contactSection}</h2>
        </div>

        <div className="co-form-grid">
          <div className="co-field">
            <label htmlFor="receiverName" className="co-label">
              {c.nameLabel} <span className="co-req">*</span>
            </label>
            <input
              id="receiverName"
              type="text"
              value={formData.receiverName}
              onChange={(e) => onChange('receiverName', e.target.value)}
              onBlur={() => onBlur('receiverName')}
              disabled={disabled}
              placeholder="Nguyễn Văn An"
              className={`co-input ${isVisible('receiverName') ? 'has-error' : ''}`}
              aria-invalid={isVisible('receiverName')}
              aria-describedby="receiverName-error"
            />
            <p id="receiverName-error" className="co-error" role="alert">
              {fieldError('receiverName')}
            </p>
          </div>

          <div className="co-field-row">
            <div className="co-field">
              <label htmlFor="phone" className="co-label">
                {c.phoneLabel} <span className="co-req">*</span>
              </label>
              <input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => onChange('phone', e.target.value)}
                onBlur={() => onBlur('phone')}
                disabled={disabled}
                placeholder="0901234567"
                className={`co-input ${isVisible('phone') ? 'has-error' : ''}`}
                aria-invalid={isVisible('phone')}
                aria-describedby="phone-error"
              />
              <p id="phone-error" className="co-error" role="alert">
                {fieldError('phone')}
              </p>
            </div>

            <div className="co-field">
              <label htmlFor="email" className="co-label">
                {c.emailLabel}
              </label>
              <input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => onChange('email', e.target.value)}
                onBlur={() => onBlur('email')}
                disabled={disabled}
                placeholder="nguyenvanan@gmail.com"
                className={`co-input ${isVisible('email') ? 'has-error' : ''}`}
                aria-invalid={isVisible('email')}
                aria-describedby="email-error"
              />
              <p id="email-error" className="co-error" role="alert">
                {fieldError('email')}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="co-card">
        <div className="co-card-head">
          <span className="co-card-index" aria-hidden="true">
            2
          </span>
          <h2 className="co-card-title">{c.addressSection}</h2>
        </div>

        <div className="co-form-grid">
          <div className="co-field-row">
            <div className="co-field">
              <label htmlFor="province" className="co-label">
                {c.provinceLabel} <span className="co-req">*</span>
              </label>
              <select
                id="province"
                value={formData.provinceCode}
                onChange={handleProvinceChange}
                onBlur={() => onBlur('province')}
                disabled={disabled || loadingProvinces}
                className={`co-select ${isVisible('province') ? 'has-error' : ''}`}
                aria-invalid={isVisible('province')}
                aria-describedby="province-error"
              >
                <option value="">
                  {loadingProvinces ? c.loadingProvinces : c.selectProvince}
                </option>
                {provinces.map((prov) => (
                  <option key={prov.code} value={prov.code}>
                    {prov.name}
                  </option>
                ))}
              </select>
              <p id="province-error" className="co-error" role="alert">
                {fieldError('province')}
              </p>
            </div>

            <div className="co-field">
              <label htmlFor="district" className="co-label">
                {c.districtLabel} <span className="co-req">*</span>
              </label>
              <select
                id="district"
                value={formData.districtCode}
                onChange={handleDistrictChange}
                onBlur={() => onBlur('district')}
                disabled={disabled || !formData.provinceCode || loadingDistricts}
                className={`co-select ${isVisible('district') ? 'has-error' : ''}`}
                aria-invalid={isVisible('district')}
                aria-describedby="district-error"
              >
                <option value="">
                  {loadingDistricts ? c.loadingDistricts : c.selectDistrict}
                </option>
                {districts.map((dist) => (
                  <option key={dist.code} value={dist.code}>
                    {dist.name}
                  </option>
                ))}
              </select>
              <p id="district-error" className="co-error" role="alert">
                {fieldError('district')}
              </p>
            </div>
          </div>

          <div className="co-field-row">
            <div className="co-field">
              <label htmlFor="ward" className="co-label">
                {c.wardLabel} <span className="co-req">*</span>
              </label>
              <select
                id="ward"
                value={formData.wardCode}
                onChange={handleWardChange}
                onBlur={() => onBlur('ward')}
                disabled={disabled || !formData.districtCode || loadingWards}
                className={`co-select ${isVisible('ward') ? 'has-error' : ''}`}
                aria-invalid={isVisible('ward')}
                aria-describedby="ward-error"
              >
                <option value="">
                  {loadingWards
                    ? c.loadingWards
                    : !formData.districtCode
                    ? c.chooseDistrictFirst
                    : c.selectWard}
                </option>
                {wards.map((w) => (
                  <option key={w.code} value={w.code}>
                    {w.name}
                  </option>
                ))}
              </select>
              <p id="ward-error" className="co-error" role="alert">
                {fieldError('ward')}
              </p>
            </div>

            <div className="co-field">
              <label htmlFor="streetAddress" className="co-label">
                {c.streetLabel} <span className="co-req">*</span>
              </label>
              <input
                id="streetAddress"
                type="text"
                value={formData.streetAddress}
                onChange={(e) => onChange('streetAddress', e.target.value)}
                onBlur={() => onBlur('streetAddress')}
                disabled={disabled}
                placeholder="12 Nguyễn Huệ"
                className={`co-input ${isVisible('streetAddress') ? 'has-error' : ''}`}
                aria-invalid={isVisible('streetAddress')}
                aria-describedby="streetAddress-error"
              />
              <p id="streetAddress-error" className="co-error" role="alert">
                {fieldError('streetAddress')}
              </p>
            </div>
          </div>

          <div className="co-field">
            <label htmlFor="altAddress" className="co-label">
              {c.altAddressLabel}
            </label>
            <input
              id="altAddress"
              type="text"
              value={formData.altAddress}
              onChange={(e) => onChange('altAddress', e.target.value)}
              disabled={disabled}
              placeholder={c.altAddressPlaceholder}
              className="co-input"
            />
          </div>
        </div>
      </section>
    </>
  );
}

export default ContactSection;
