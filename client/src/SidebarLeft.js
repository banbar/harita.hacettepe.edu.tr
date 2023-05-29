import React from 'react';
import './sidebar.css';
import SearchBox from './SearchBox'; 
import { useState } from 'react';
import './sidebarright.css'
import './horizontalbar.css'


const SidebarLeft = ({ isOpen,buildingOptions, handleStartNodeChange, handleEndNodeChange, handleCalculateRoute, handleTravelTypeChange, travelType}) => {

  const [activeSection, setActiveSection] = useState('');
  
  

  const toggleSection = (section) => {
    if (activeSection === section) {
      setActiveSection('');
    } else {
      setActiveSection(section);
    }
  };


 
    
  return (
        <div id="sidebarLeft" style={{ width: isOpen ? '288px' : '0px', opacity: isOpen ? 1 : 0 }}>
          <div id="titleElements">
            <h1 id="title">Harita Hacettepe</h1>
            <span id="title-slant" className="uw-slant-large"></span>
          </div>
       
          <div id="nav-header-container">
            <h5 id="navHeader" className="header">ROTA PLANLAYICI</h5>
            <img
              id="nav-info"
              className="info-icon"
              alt="information"
              src="assets/logos/route-icon-trendy-flat-style-260nw-418178818.webp"
            ></img>
          </div>
          <span className="uw-slant"></span>
          
          <div className="inputs contentSection">
            <div className="inputDiv">
              <SearchBox
                name="startNode"
                id="startNode"
                options={buildingOptions}
                placeholder="Başlangıç Noktası"
                onChange={handleStartNodeChange}
              />
            </div>
            <div className="inputDiv">
              <SearchBox
                name="endNode"
                id="endNode"
                options={buildingOptions}
                placeholder="Varış Noktası"
                onChange={handleEndNodeChange}
              />
            </div>
            <div className="inputDiv">
               <div className="transport-options">
                  <label htmlFor="yaya">
                    <input type="radio" id="yaya" name="transport" value="yaya" checked={travelType === "yaya"} onChange={handleTravelTypeChange} />
                    <img src="assets/logos/yaya-logo.png" alt="Yaya" />
                  </label>
                  &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                  <label htmlFor="engelli">
                    <input type="radio" id="engelli" name="transport" value="engelli" checked={travelType === "engelli"} onChange={handleTravelTypeChange} />
                    <img src="assets/logos/engelli-logo.png" alt="Engelli" />
                  </label>
                  &nbsp;&nbsp;&nbsp;&nbsp;
                  <label htmlFor="bisiklet">
                    <input type="radio" id="bisiklet" name="transport" value="bisiklet" checked={travelType === "bisiklet"} onChange={handleTravelTypeChange} />
                    <img src="assets/logos/bisiklet-logo.png" alt="Bisiklet" />
                  </label>
                </div>
            </div>
            <button className="navBtn" onClick={handleCalculateRoute}>
              Rota Oluştur
            </button>
          </div>

         
          </div>
         
   
  );
};

export default SidebarLeft;