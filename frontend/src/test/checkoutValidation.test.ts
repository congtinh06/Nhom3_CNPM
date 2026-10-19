import { describe, it, expect } from 'vitest';
import {
  CheckoutValues,
  cleanPhone,
  firstInvalidField,
  getPlaceOrderReason,
  isFieldEmpty,
  validateAll,
  validateField,
} from '../components/checkout/checkoutValidation';

const validValues: CheckoutValues = {
  receiverName: 'Nguyễn Văn An',
  phone: '0901234567',
  email: '',
  provinceCode: '79',
  districtCode: '760',
  wardCode: '26734',
  streetAddress: '12 Nguyễn Huệ',
};

const values = (patch: Partial<CheckoutValues>): CheckoutValues => ({
  ...validValues,
  ...patch,
});

describe('checkoutValidation field rules', () => {
  it('validates the receiver name', () => {
    expect(validateField('receiverName', values({ receiverName: '' }))).toBe('NAME_REQUIRED');
    expect(validateField('receiverName', values({ receiverName: '   ' }))).toBe('NAME_REQUIRED');
    expect(validateField('receiverName', values({ receiverName: 'A' }))).toBe('NAME_SHORT');
    expect(validateField('receiverName', values({ receiverName: 'An' }))).toBeNull();
  });

  it('validates the phone number as 10 digits starting with 0', () => {
    expect(validateField('phone', values({ phone: '' }))).toBe('PHONE_REQUIRED');
    expect(validateField('phone', values({ phone: '090123456' }))).toBe('PHONE_INVALID');
    expect(validateField('phone', values({ phone: '1901234567' }))).toBe('PHONE_INVALID');
    expect(validateField('phone', values({ phone: '0901234567' }))).toBeNull();
    expect(validateField('phone', values({ phone: '090 123 4567' }))).toBeNull();
    expect(cleanPhone('090 123 4567')).toBe('0901234567');
  });

  it('treats email as optional but checks its format when filled', () => {
    expect(validateField('email', values({ email: '' }))).toBeNull();
    expect(validateField('email', values({ email: 'not-an-email' }))).toBe('EMAIL_INVALID');
    expect(validateField('email', values({ email: 'ten@gmail.com' }))).toBeNull();
  });

  it('requires province, district and ward selections', () => {
    expect(validateField('province', values({ provinceCode: '' }))).toBe('PROVINCE_REQUIRED');
    expect(validateField('district', values({ districtCode: '' }))).toBe('DISTRICT_REQUIRED');
    expect(validateField('ward', values({ wardCode: '' }))).toBe('WARD_REQUIRED');
    expect(validateField('province', validValues)).toBeNull();
  });

  it('validates the street address length, letters and repetition', () => {
    expect(validateField('streetAddress', values({ streetAddress: '' }))).toBe('STREET_REQUIRED');
    expect(validateField('streetAddress', values({ streetAddress: 'abcd' }))).toBe('STREET_INVALID');
    expect(validateField('streetAddress', values({ streetAddress: '12345' }))).toBe('STREET_INVALID');
    expect(validateField('streetAddress', values({ streetAddress: 'aaaaa' }))).toBe('STREET_INVALID');
    expect(validateField('streetAddress', values({ streetAddress: '12 Nguyễn Huệ' }))).toBeNull();
  });

  it('detects empty required fields', () => {
    expect(isFieldEmpty('receiverName', validValues)).toBe(false);
    expect(isFieldEmpty('receiverName', values({ receiverName: '  ' }))).toBe(true);
    expect(isFieldEmpty('district', values({ districtCode: '' }))).toBe(true);
    expect(isFieldEmpty('email', values({ email: '' }))).toBe(true);
  });

  it('validates the alternate recipient only when delivering to someone else', () => {
    expect(validateField('otherReceiverName', validValues)).toBeNull();
    expect(
      validateField('otherReceiverName', values({ deliverToOther: true }))
    ).toBe('OTHER_NAME_REQUIRED');
    expect(
      validateField('otherReceiverName', values({ deliverToOther: true, otherReceiverName: 'B' }))
    ).toBe('OTHER_NAME_REQUIRED');
    expect(
      validateField('otherReceiverName', values({ deliverToOther: true, otherReceiverName: 'An' }))
    ).toBeNull();

    expect(
      validateField('otherReceiverPhone', values({ deliverToOther: true }))
    ).toBe('OTHER_PHONE_REQUIRED');
    expect(
      validateField('otherReceiverPhone', values({ deliverToOther: true, otherReceiverPhone: '123' }))
    ).toBe('OTHER_PHONE_INVALID');
    expect(
      validateField('otherReceiverPhone', values({ deliverToOther: true, otherReceiverPhone: '0901234567' }))
    ).toBeNull();
  });
});

describe('checkoutValidation aggregate results', () => {
  it('collects every invalid field', () => {
    const errors = validateAll({
      receiverName: '',
      phone: 'abc',
      email: 'bad',
      provinceCode: '',
      districtCode: '',
      wardCode: '',
      streetAddress: 'x',
    });
    expect(errors).toEqual({
      receiverName: 'NAME_REQUIRED',
      phone: 'PHONE_INVALID',
      email: 'EMAIL_INVALID',
      province: 'PROVINCE_REQUIRED',
      district: 'DISTRICT_REQUIRED',
      ward: 'WARD_REQUIRED',
      streetAddress: 'STREET_INVALID',
    });
  });

  it('returns no errors for valid values', () => {
    expect(validateAll(validValues)).toEqual({});
  });

  it('finds the first invalid field in order', () => {
    expect(firstInvalidField(values({ receiverName: '' }))).toBe('receiverName');
    expect(firstInvalidField(values({ email: 'bad' }))).toBe('email');
    expect(firstInvalidField(validValues)).toBeNull();
  });

  it('treats a missing alternate recipient as a required field', () => {
    expect(firstInvalidField(values({ deliverToOther: true }))).toBe(
      'otherReceiverName'
    );
    expect(
      getPlaceOrderReason({
        submitting: false,
        cartCount: 2,
        values: values({ deliverToOther: true }),
        agreedTerms: true,
      })
    ).toBe('required');
  });
});

describe('checkoutValidation place order reason priority', () => {
  it('reports submitting first', () => {
    expect(
      getPlaceOrderReason({
        submitting: true,
        cartCount: 0,
        values: values({ receiverName: '' }),
        agreedTerms: false,
      })
    ).toBe('submitting');
  });

  it('reports empty cart before field problems', () => {
    expect(
      getPlaceOrderReason({
        submitting: false,
        cartCount: 0,
        values: values({ receiverName: '' }),
        agreedTerms: false,
      })
    ).toBe('emptyCart');
  });

  it('reports missing required fields before filled-invalid ones', () => {
    expect(
      getPlaceOrderReason({
        submitting: false,
        cartCount: 2,
        values: values({ receiverName: '', email: 'bad' }),
        agreedTerms: true,
      })
    ).toBe('required');
  });

  it('reports filled-invalid fields before the terms checkbox', () => {
    expect(
      getPlaceOrderReason({
        submitting: false,
        cartCount: 2,
        values: values({ email: 'bad' }),
        agreedTerms: false,
      })
    ).toBe('invalid');
  });

  it('reports the terms checkbox before allowing the order', () => {
    expect(
      getPlaceOrderReason({
        submitting: false,
        cartCount: 2,
        values: validValues,
        agreedTerms: false,
      })
    ).toBe('terms');
  });

  it('returns null when the order can be placed', () => {
    expect(
      getPlaceOrderReason({
        submitting: false,
        cartCount: 2,
        values: validValues,
        agreedTerms: true,
      })
    ).toBeNull();
  });
});
