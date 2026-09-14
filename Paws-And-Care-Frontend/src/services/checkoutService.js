/**
 * Checkout field validation services
 */

export const validateContact = (fields) => {
  const errors = {};
  
  if (!fields.firstName || !fields.firstName.trim()) {
    errors.firstName = 'First name is required';
  }
  
  if (!fields.lastName || !fields.lastName.trim()) {
    errors.lastName = 'Last name is required';
  }
  
  if (!fields.email || !fields.email.trim()) {
    errors.email = 'Email address is required';
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fields.email)) {
    errors.email = 'Enter a valid email address';
  }
  
  if (!fields.mobile || !fields.mobile.trim()) {
    errors.mobile = 'Mobile number is required';
  } else if (!/^\d{10}$/.test(fields.mobile.replace(/\D/g, ''))) {
    errors.mobile = 'Enter a valid 10-digit mobile number';
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

export const validateAddress = (fields) => {
  const errors = {};
  
  if (!fields.streetAddress || !fields.streetAddress.trim()) {
    errors.streetAddress = 'Street address is required';
  }
  
  if (!fields.city || !fields.city.trim()) {
    errors.city = 'City is required';
  }
  
  if (!fields.state || !fields.state.trim()) {
    errors.state = 'State is required';
  }
  
  if (!fields.postalCode || !fields.postalCode.trim()) {
    errors.postalCode = 'Postal code is required';
  } else if (!/^\d{5,6}$/.test(fields.postalCode.trim())) {
    errors.postalCode = 'Enter a valid 5 or 6 digit postal code';
  }
  
  if (!fields.country || !fields.country.trim()) {
    errors.country = 'Country is required';
  }

  if (!fields.phone || !fields.phone.trim()) {
    errors.phone = 'Phone number is required';
  } else if (!/^\+?[0-9\s\-()]{7,20}$/.test(fields.phone.trim())) {
    errors.phone = 'Enter a valid phone number';
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};
