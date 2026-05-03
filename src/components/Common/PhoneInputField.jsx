import React from 'react';
import PhoneInput, { isValidPhoneNumber } from 'react-phone-number-input';
import 'react-phone-number-input/style.css';

const PhoneInputField = ({ value, onChange, label, required, placeholder, className, error }) => {
  const showError = error || (value && !isValidPhoneNumber(value));
  const isValid = value && isValidPhoneNumber(value);

  return (
    <div className={className}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      <PhoneInput
        defaultCountry="TN"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
      />
      {showError && (
        <p className="text-xs text-red-500 mt-1">✗ Invalid phone number</p>
      )}
      {isValid && !error && (
        <p className="text-xs text-green-600 mt-1">✓ Valid number</p>
      )}
    </div>
  );
};

export default PhoneInputField;