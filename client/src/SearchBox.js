import React from 'react';
import Select from 'react-select';
import './index.css';
const SearchBox = ({ options, placeholder, onChange }) => {
  return (
    <Select
      options={options}
      placeholder={placeholder}
      onChange={onChange}
      styles={{ option: (provided) => ({ ...provided, whiteSpace: 'normal' })
    }}      
    />
  );
};

export default SearchBox;