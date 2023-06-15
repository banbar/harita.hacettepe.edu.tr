import React from 'react';
import './sidebarright.css';

const SidebarRight = ({ isOpen, onClick }) => {
  const logoSrc = isOpen ? process.env.PUBLIC_URL + '/assets/logos/left.png' : process.env.PUBLIC_URL + '/assets/logos/right.png';

  return (
    // Sağ kenar çubuğunu temsil eden div elementi
    // Div element representing the right sidebar
    <div className="sidebarRight" onClick={onClick} style={{ left: isOpen ? '303px' : '0' }}>
      <img id="logo" src={logoSrc} alt="" />
    </div>
  );
};

export default SidebarRight;
