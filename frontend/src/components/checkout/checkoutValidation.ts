export type CheckoutField =
  | 'receiverName'
  | 'phone'
  | 'email'
  | 'province'
  | 'district'
  | 'ward'
  | 'streetAddress'
  | 'otherReceiverName'
  | 'otherReceiverPhone';

export type CheckoutErrorCode =
  | 'NAME_REQUIRED'
  | 'NAME_SHORT'
  | 'PHONE_REQUIRED'
  | 'PHONE_INVALID'
  | 'EMAIL_INVALID'
  | 'PROVINCE_REQUIRED'
  | 'DISTRICT_REQUIRED'
  | 'WARD_REQUIRED'
  | 'STREET_REQUIRED'
  | 'STREET_INVALID'
  | 'OTHER_NAME_REQUIRED'
  | 'OTHER_PHONE_REQUIRED'
  | 'OTHER_PHONE_INVALID';

export type CheckoutErrors = Partial<Record<CheckoutField, CheckoutErrorCode>>;

export interface CheckoutValues {
  receiverName: string;
  phone: string;
  email: string;
  provinceCode: string;
  districtCode: string;
  wardCode: string;
  streetAddress: string;
  deliverToOther?: boolean;
  otherReceiverName?: string;
  otherReceiverPhone?: string;
}

export const REQUIRED_FIELDS: CheckoutField[] = [
  'receiverName',
  'phone',
  'province',
  'district',
  'ward',
  'streetAddress',
];

const VALIDATED_FIELDS: CheckoutField[] = [
  ...REQUIRED_FIELDS,
  'email',
  'otherReceiverName',
  'otherReceiverPhone',
];

const REQUIRED_CODES: CheckoutErrorCode[] = [
  'NAME_REQUIRED',
  'PHONE_REQUIRED',
  'PROVINCE_REQUIRED',
  'DISTRICT_REQUIRED',
  'WARD_REQUIRED',
  'STREET_REQUIRED',
  'OTHER_NAME_REQUIRED',
  'OTHER_PHONE_REQUIRED',
];

const PHONE_RE = /^0\d{9}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function cleanPhone(value: string): string {
  return value.replace(/\s+/g, '');
}

function isRepeatedSingleChar(value: string): boolean {
  return /^(.)\1+$/.test(value);
}

function hasLetter(value: string): boolean {
  return /\p{L}/u.test(value);
}

export function isFieldEmpty(field: CheckoutField, values: CheckoutValues): boolean {
  switch (field) {
    case 'receiverName':
      return values.receiverName.trim() === '';
    case 'phone':
      return values.phone.trim() === '';
    case 'email':
      return values.email.trim() === '';
    case 'province':
      return values.provinceCode === '';
    case 'district':
      return values.districtCode === '';
    case 'ward':
      return values.wardCode === '';
    case 'streetAddress':
      return values.streetAddress.trim() === '';
    case 'otherReceiverName':
      return Boolean(values.deliverToOther) && (values.otherReceiverName || '').trim() === '';
    case 'otherReceiverPhone':
      return Boolean(values.deliverToOther) && (values.otherReceiverPhone || '').trim() === '';
    default:
      return false;
  }
}

export function validateField(
  field: CheckoutField,
  values: CheckoutValues
): CheckoutErrorCode | null {
  switch (field) {
    case 'receiverName': {
      const name = values.receiverName.trim();
      if (name === '') return 'NAME_REQUIRED';
      if (name.length < 2) return 'NAME_SHORT';
      return null;
    }
    case 'phone': {
      if (values.phone.trim() === '') return 'PHONE_REQUIRED';
      if (!PHONE_RE.test(cleanPhone(values.phone))) return 'PHONE_INVALID';
      return null;
    }
    case 'email': {
      const email = values.email.trim();
      if (email === '') return null;
      if (!EMAIL_RE.test(email)) return 'EMAIL_INVALID';
      return null;
    }
    case 'province':
      return values.provinceCode === '' ? 'PROVINCE_REQUIRED' : null;
    case 'district':
      return values.districtCode === '' ? 'DISTRICT_REQUIRED' : null;
    case 'ward':
      return values.wardCode === '' ? 'WARD_REQUIRED' : null;
    case 'streetAddress': {
      const street = values.streetAddress.trim();
      if (street === '') return 'STREET_REQUIRED';
      if (street.length < 5) return 'STREET_INVALID';
      if (!hasLetter(street)) return 'STREET_INVALID';
      if (isRepeatedSingleChar(street)) return 'STREET_INVALID';
      return null;
    }
    case 'otherReceiverName': {
      if (!values.deliverToOther) return null;
      const name = (values.otherReceiverName || '').trim();
      if (name.length < 2) return 'OTHER_NAME_REQUIRED';
      return null;
    }
    case 'otherReceiverPhone': {
      if (!values.deliverToOther) return null;
      const raw = (values.otherReceiverPhone || '').trim();
      if (raw === '') return 'OTHER_PHONE_REQUIRED';
      if (!PHONE_RE.test(cleanPhone(raw))) return 'OTHER_PHONE_INVALID';
      return null;
    }
    default:
      return null;
  }
}

export function validateAll(values: CheckoutValues): CheckoutErrors {
  const errors: CheckoutErrors = {};
  for (const field of VALIDATED_FIELDS) {
    const code = validateField(field, values);
    if (code) errors[field] = code;
  }
  return errors;
}

export type PlaceOrderReason =
  | 'submitting'
  | 'emptyCart'
  | 'required'
  | 'invalid'
  | 'terms'
  | null;

export interface PlaceOrderInput {
  submitting: boolean;
  cartCount: number;
  values: CheckoutValues;
  agreedTerms: boolean;
}

export function getPlaceOrderReason({
  submitting,
  cartCount,
  values,
  agreedTerms,
}: PlaceOrderInput): PlaceOrderReason {
  if (submitting) return 'submitting';
  if (cartCount === 0) return 'emptyCart';

  const errors = validateAll(values);
  const codes = Object.values(errors);
  if (codes.some((code) => REQUIRED_CODES.includes(code as CheckoutErrorCode))) {
    return 'required';
  }
  if (codes.length > 0) return 'invalid';

  if (!agreedTerms) return 'terms';
  return null;
}

export function firstInvalidField(values: CheckoutValues): CheckoutField | null {
  for (const field of VALIDATED_FIELDS) {
    const code = validateField(field, values);
    if (code && REQUIRED_CODES.includes(code)) return field;
  }
  for (const field of VALIDATED_FIELDS) {
    if (validateField(field, values)) return field;
  }
  return null;
}
