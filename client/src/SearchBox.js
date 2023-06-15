import React from 'react';
import Select from 'react-select';
import './index.css';

// The SearchBox component gets the options, placeholder and onChange props.
// SearchBox bileşeni, options, placeholder ve onChange prop'larını alır.
const SearchBox = ({ options, placeholder, onChange }) => {
  return (
    // react-select bileşenini kullanarak bir seçim kutusu oluşturulur.
    // create a selection box using the react-select component.
    <Select
      options={options}  // Seçenekler prop olarak iletilir. // Options are passed as props.
      placeholder={placeholder} // Placeholder prop olarak iletilir. // Passed as Placeholder prop.
      onChange={onChange} // Değişikliklerde tetiklenecek onChange fonksiyonu prop olarak iletilir. // Pass the onChange function as a prop to be triggered on changes.
      // Stil özelleştirmeleri yapmak için styles prop'u kullanılır.
      // Use the styles prop to make style customizations.
      styles={{ option: (provided) => ({ ...provided, whiteSpace: 'normal' })
    }}      
    />
  );
};

export default SearchBox;
