import React, { useState, useEffect } from 'react';
import { User, Tag, ChevronDown, ChevronUp } from 'lucide-react';
import {
  getAllProvinces,
  getDistrictsByProvince,
  getWardsByDistrict,
  AddressItem,
} from '../../services/addressService';

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
  note: string;
  voucherCode?: string;
}

export interface ContactErrors {
  receiverName?: string;
  phone?: string;
  email?: string;
  province?: string;
  district?: string;
  ward?: string;
  streetAddress?: string;
}

export interface ContactSectionProps {
  formData: ContactFormData;
  errors: ContactErrors;
  onChange: (field: keyof ContactFormData, value: string) => void;
  disabled?: boolean;
}

export function ContactSection({
  formData,
  errors,
  onChange,
  disabled = false,
}: ContactSectionProps) {
  const [provinces, setProvinces] = useState<AddressItem[]>([]);
  const [districts, setDistricts] = useState<AddressItem[]>([]);
  const [wards, setWards] = useState<AddressItem[]>([]);

  const [loadingProvinces, setLoadingProvinces] = useState(false);
  const [loadingDistricts, setLoadingDistricts] = useState(false);
  const [loadingWards, setLoadingWards] = useState(false);

  const [isVoucherOpen, setIsVoucherOpen] = useState(false);
  const [voucherInput, setVoucherInput] = useState(formData.voucherCode || '');
  const [voucherApplied, setVoucherApplied] = useState(false);

  // 1. Fetch all provinces on mount
  useEffect(() => {
    let isMounted = true;
    setLoadingProvinces(true);

    getAllProvinces()
      .then((data) => {
        if (!isMounted) return;
        setProvinces(data);

        // Preselect HCMC (code 79) if not set
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

  // 2. Fetch districts whenever provinceCode changes
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

  // 3. Fetch wards whenever districtCode changes
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

  // Handle Province change: Reset District and Ward
  const handleProvinceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const code = e.target.value;
    const selected = provinces.find((p) => p.code === code);
    onChange('provinceCode', code);
    onChange('provinceName', selected ? selected.name : '');

    // Reset subordinate levels
    onChange('districtCode', '');
    onChange('districtName', '');
    onChange('wardCode', '');
    onChange('wardName', '');
  };

  // Handle District change: Reset Ward
  const handleDistrictChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const code = e.target.value;
    const selected = districts.find((d) => d.code === code);
    onChange('districtCode', code);
    onChange('districtName', selected ? selected.name : '');

    // Reset ward
    onChange('wardCode', '');
    onChange('wardName', '');
  };

  // Handle Ward change
  const handleWardChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const code = e.target.value;
    const selected = wards.find((w) => w.code === code);
    onChange('wardCode', code);
    onChange('wardName', selected ? selected.name : '');
  };

  const handleApplyVoucher = (e: React.FormEvent) => {
    e.preventDefault();
    if (voucherInput.trim()) {
      onChange('voucherCode', voucherInput.trim().toUpperCase());
      setVoucherApplied(true);
    }
  };

  return (
    <section className="checkout-card">
      {/* Header */}
      <div className="checkout-card-header">
        <div className="checkout-card-icon" aria-hidden="true">
          <User size={18} strokeWidth={2} />
        </div>
        <h2 className="checkout-card-title">Thông tin nhận hàng</h2>
      </div>

      {/* Form Fields */}
      <div className="checkout-form-grid">
        {/* Row 1: Họ và tên */}
        <div className="checkout-field-wrap">
          <label htmlFor="receiverName" className="checkout-label">
            Họ và tên <span className="checkout-req">*</span>
          </label>
          <input
            id="receiverName"
            type="text"
            value={formData.receiverName}
            onChange={(e) => onChange('receiverName', e.target.value)}
            disabled={disabled}
            placeholder="Ví dụ: Nguyễn Văn An"
            className={`checkout-input ${errors.receiverName ? 'has-error' : ''}`}
            aria-invalid={Boolean(errors.receiverName)}
          />
          {errors.receiverName && (
            <p className="checkout-error-msg">{errors.receiverName}</p>
          )}
        </div>

        {/* Row 2: Số điện thoại + Email */}
        <div className="checkout-form-row">
          <div className="checkout-field-wrap">
            <label htmlFor="phone" className="checkout-label">
              Số điện thoại <span className="checkout-req">*</span>
            </label>
            <input
              id="phone"
              type="tel"
              value={formData.phone}
              onChange={(e) => onChange('phone', e.target.value)}
              disabled={disabled}
              placeholder="090 123 4567"
              className={`checkout-input ${errors.phone ? 'has-error' : ''}`}
              aria-invalid={Boolean(errors.phone)}
            />
            {errors.phone && (
              <p className="checkout-error-msg">{errors.phone}</p>
            )}
          </div>

          <div className="checkout-field-wrap">
            <label htmlFor="email" className="checkout-label">
              Email (để nhận xác nhận đơn hàng)
            </label>
            <input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => onChange('email', e.target.value)}
              disabled={disabled}
              placeholder="nguyenvanan@gmail.com"
              className={`checkout-input ${errors.email ? 'has-error' : ''}`}
              aria-invalid={Boolean(errors.email)}
            />
            {errors.email && (
              <p className="checkout-error-msg">{errors.email}</p>
            )}
          </div>
        </div>

        {/* Row 3: Tỉnh / Thành phố + Quận / Huyện */}
        <div className="checkout-form-row">
          <div className="checkout-field-wrap">
            <label htmlFor="province" className="checkout-label">
              Tỉnh / Thành phố <span className="checkout-req">*</span>
            </label>
            <select
              id="province"
              value={formData.provinceCode}
              onChange={handleProvinceChange}
              disabled={disabled || loadingProvinces}
              className={`checkout-select ${errors.province ? 'has-error' : ''}`}
            >
              <option value="">
                {loadingProvinces ? 'Đang tải tỉnh thành...' : 'Chọn Tỉnh / Thành phố...'}
              </option>
              {provinces.map((prov) => (
                <option key={prov.code} value={prov.code}>
                  {prov.name}
                </option>
              ))}
            </select>
            {errors.province && (
              <p className="checkout-error-msg">{errors.province}</p>
            )}
          </div>

          <div className="checkout-field-wrap">
            <label htmlFor="district" className="checkout-label">
              Quận / Huyện <span className="checkout-req">*</span>
            </label>
            <select
              id="district"
              value={formData.districtCode}
              onChange={handleDistrictChange}
              disabled={disabled || !formData.provinceCode || loadingDistricts}
              className={`checkout-select ${errors.district ? 'has-error' : ''}`}
            >
              <option value="">
                {loadingDistricts
                  ? 'Đang tải quận huyện...'
                  : 'Chọn Quận/Huyện...'}
              </option>
              {districts.map((dist) => (
                <option key={dist.code} value={dist.code}>
                  {dist.name}
                </option>
              ))}
            </select>
            {errors.district && (
              <p className="checkout-error-msg">{errors.district}</p>
            )}
          </div>
        </div>

        {/* Row 4: Phường / Xã + Số nhà, tên đường */}
        <div className="checkout-form-row">
          <div className="checkout-field-wrap">
            <label htmlFor="ward" className="checkout-label">
              Phường / Xã <span className="checkout-req">*</span>
            </label>
            <select
              id="ward"
              value={formData.wardCode}
              onChange={handleWardChange}
              disabled={disabled || !formData.districtCode || loadingWards}
              className={`checkout-select ${errors.ward ? 'has-error' : ''}`}
            >
              <option value="">
                {loadingWards
                  ? 'Đang tải phường xã...'
                  : !formData.districtCode
                  ? 'Vui lòng chọn Quận/Huyện trước'
                  : 'Chọn Phường/Xã...'}
              </option>
              {wards.map((w) => (
                <option key={w.code} value={w.code}>
                  {w.name}
                </option>
              ))}
            </select>
            {errors.ward && (
              <p className="checkout-error-msg">{errors.ward}</p>
            )}
          </div>

          <div className="checkout-field-wrap">
            <label htmlFor="streetAddress" className="checkout-label">
              Số nhà, tên đường <span className="checkout-req">*</span>
            </label>
            <input
              id="streetAddress"
              type="text"
              value={formData.streetAddress}
              onChange={(e) => onChange('streetAddress', e.target.value)}
              disabled={disabled}
              placeholder="Ví dụ: 123 Nguyễn Huệ, Tòa nhà A"
              className={`checkout-input ${errors.streetAddress ? 'has-error' : ''}`}
              aria-invalid={Boolean(errors.streetAddress)}
            />
            {errors.streetAddress && (
              <p className="checkout-error-msg">{errors.streetAddress}</p>
            )}
          </div>
        </div>

        {/* Row 5: Ghi chú đơn hàng */}
        <div className="checkout-field-wrap">
          <label htmlFor="note" className="checkout-label">
            Ghi chú đơn hàng (tùy chọn)
          </label>
          <textarea
            id="note"
            rows={2}
            value={formData.note}
            onChange={(e) => onChange('note', e.target.value)}
            disabled={disabled}
            placeholder="Ví dụ: ít đường, giao giờ hành chính..."
            className="checkout-textarea"
          />
        </div>

        {/* Row 6: Mã giảm giá / Voucher ưu đãi (link chữ cam không khung) */}
        <div style={{ paddingTop: '4px' }}>
          <button
            type="button"
            onClick={() => setIsVoucherOpen(!isVoucherOpen)}
            className="checkout-voucher-toggle"
          >
            <Tag size={15} />
            <span>Mã giảm giá / Voucher</span>
            {isVoucherOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>

          {isVoucherOpen && (
            <form onSubmit={handleApplyVoucher} className="checkout-voucher-box">
              <input
                type="text"
                value={voucherInput}
                onChange={(e) => {
                  setVoucherInput(e.target.value);
                  setVoucherApplied(false);
                }}
                placeholder="Nhập mã ưu đãi (Ví dụ: SAIGON20)"
                className="checkout-input"
                style={{ textTransform: 'uppercase' }}
              />
              <button
                type="submit"
                className="checkout-voucher-btn"
              >
                Áp dụng
              </button>
            </form>
          )}

          {voucherApplied && formData.voucherCode && (
            <p style={{ fontSize: '12px', color: '#16A34A', margin: '6px 0 0', fontWeight: 600 }}>
              Đã áp dụng mã: {formData.voucherCode}
            </p>
          )}
        </div>
      </div>
    </section>
  );
}

export default ContactSection;
