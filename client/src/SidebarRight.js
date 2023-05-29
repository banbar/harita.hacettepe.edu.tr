import React from 'react';
import './sidebarright.css';

const SidebarRight = ({ isOpen,onClick }) => {
    return (
      <div className="sidebarRight" onClick={onClick} style={{ left: isOpen ? '303px' : '0' }}>
        <img id="logo" src="assets/logos/hamb.png" alt="" />
      </div>
    );
  };

export default SidebarRight;