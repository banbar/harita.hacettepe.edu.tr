import React from 'react';
import './horizontalbar.css';

const HorizontalBar = ({travelType, isOpen }) => {

    const horizontalBarStyle = {
        left: isOpen ? 'calc(288px + 72px + 20px)' : 'calc(72px + 6px)',
        width: isOpen ? 'calc(100% - 398px)' : 'calc(100% - 90px)',
      };
      
    return (
    
<div id="horizontalBarId"      className="horizontalBar"
      style={horizontalBarStyle}
    >
      <img id="startMarker" className="marker" alt="Start Point Icon" src="assets/markerIcons/location-pin.png" />
      <p id="from" className="tofrom">Başlangıç Noktası</p>
    <div className="horizontalSpacer"></div>
      <img id="endMarker" className="marker" alt="End Point Icon" src="assets/markerIcons/route_2.png" />
      <p id="to" className="tofrom">Varış Noktası</p>
    <div className="bar">  </div>
      <div id="distance"> Seyahat Tipi: {travelType}  </div>

    <div id="locationIconDiv" title="Hacettepe Üniversitesi">
      <a href ="https://www.hacettepe.edu.tr/" aria-label="Hacettepe Üniversitesi" target="_blank" rel="noreferrer">
        <img id="locationIcon" src="assets/miscIcons/hu_logo.svg" alt="//:0"></img>
      </a>
    </div>
    <div className="githubIconDiv" title="Proje GitHub Sayfası">
      <a href ="https://github.com/banbar/harita.hacettepe.edu.tr" aria-label="Proje GitHub Sayfası" target="_blank" rel="noreferrer">
        <img alt="GitHub Icon" src="assets/miscIcons/GithubIcon.png" id="githubIcon" ></img>
      </a>
      
    </div>
</div>


    );
};

export default HorizontalBar;