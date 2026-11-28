// 2.2.1 Validation for survey submissions

const CLIENT_TYPES = ['Citizen', 'Business', 'Government (Employee or another agency)'];
const SEX = ['Male', 'Female'];

const CC2_NA = '5. N/A';
const CC3_NA = '4. N/A';

export class ValidationError extends Error {
  constructor(errors) {
    super(errors.join(' '));
    this.status = 400;
    this.errors = errors;
  }
}

const text = (v) => (typeof v === 'string' ? v.trim() : v === undefined || v === null ? '' : String(v).trim());

const isRealDate = (s) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const d = new Date(`${s}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === s;
};

// Returns a cleaned copy of the data, or throws ValidationError.
export const validateSurvey = (input = {}) => {
  const errors = [];
  const data = {
    clientType: text(input.clientType),
    date: text(input.date),
    sex: text(input.sex),
    age: text(input.age),
    region: text(input.region),
    service: text(input.service),
    cc1: text(input.cc1),
    cc2: text(input.cc2),
    cc3: text(input.cc3),
    suggestions: text(input.suggestions),
    ratings: {},
  };

  // Client information
  if (!data.clientType) errors.push('Client type is required.');
  else if (!CLIENT_TYPES.includes(data.clientType)) errors.push('Client type is not valid.');

  if (!data.service) errors.push('Service availed is required.');
  else if (data.service.length > 150) errors.push('Service availed is too long (max 150 characters).');

  // Personal details are optional, but must be valid when given
  if (data.date && !isRealDate(data.date)) errors.push('Date must be a valid date (YYYY-MM-DD).');
  if (data.sex && !SEX.includes(data.sex)) errors.push('Sex must be Male or Female.');
  if (data.age) {
    const n = Number(data.age);
    if (!Number.isInteger(n) || n < 0 || n > 120) errors.push('Age must be a whole number from 0 to 120.');
  }
  if (data.region.length > 100) errors.push('Region is too long (max 100 characters).');

  // Citizen's Charter
  if (!/^[1-4]\./.test(data.cc1)) {
    errors.push('CC1 is required.');
  } else if (data.cc1.startsWith('4.')) {
    // Rule: CC2 and CC3 are "N/A" when CC1 option 4 is selected
    data.cc2 = CC2_NA;
    data.cc3 = CC3_NA;
  } else {
    if (!/^[1-5]\./.test(data.cc2)) errors.push('CC2 is required.');
    if (!/^[1-4]\./.test(data.cc3)) errors.push('CC3 is required.');
  }

  // Service quality ratings SQD0 - SQD8 (0 = Strongly Disagree ... 5 = N/A)
  const r = input.ratings && typeof input.ratings === 'object' ? input.ratings : {};
  for (let i = 0; i <= 8; i++) {
    const v = r[`SQD${i}`];
    if (v === undefined || v === null || v === '') {
      errors.push(`SQD${i} is required.`);
    } else if (!Number.isInteger(Number(v)) || Number(v) < 0 || Number(v) > 5) {
      errors.push(`SQD${i} must be one of the rating choices.`);
    } else {
      data.ratings[`SQD${i}`] = Number(v);
    }
  }

  if (data.suggestions.length > 1000) errors.push('Suggestions are too long (max 1000 characters).');

  if (errors.length) throw new ValidationError(errors);
  return data;
};
