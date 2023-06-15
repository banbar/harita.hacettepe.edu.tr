  import MapComponent from "./Map1";
  import React, { useEffect, useState, useMemo} from 'react';
  import  Dijkstra  from './Dijkstra';
  import './index.css';
  import './Map.css';
  import SidebarLeft from './SidebarLeft';
  import axios from 'axios';
  import SidebarRight from "./SidebarRight";
  import HorizontalBar from "./HorizontalBar";
  import haversineDistance from 'haversine-distance';
  
  
  // State variables and their initializations for managing nodes, lines, buildings, routes, user location, and other UI-related data
  // Düğümleri, çizgileri, binaları, rotaları, kullanıcı konumunu ve diğer UI ile ilgili verileri yönetmek için durum değişkenleri ve başlangıç değerleri
  const App = () => {
    const [nodes, setNodes] = useState([]);
    const [lines, setLines] = useState([]);
    const [binalar, setBuildings] = useState([]);
    const [startNode, setStartNode] = useState(null);
    const [endNode, setEndNode] = useState(null);
    const [route, setRoute] = useState([]);
    const [routeGeometry,setRouteGeometry]= useState([]);
    const [travelType, setTravelType] = useState("yaya");
    const [isOpen, setIsOpen] = useState(true);
    const [userLat, setUserLat] = useState(null);
    const [userLng, setUserLng] = useState(null);
    const [isStartNodeCurrentLocation, setIsStartNodeCurrentLocation] = useState(false);
    const [carparks, setCarparks] = useState([]);
    const [bina, setBina] = useState([]);
    const [selectedBina, setSelectedBina] = useState(null);


    // Retrieves node data from a specific API through Axios, organizes it appropriately and saves it in the state variable
    // Axios aracılığıyla belirli bir API'den düğüm verilerini alır ve alınan verileri uygun bir şekilde düzenleyip durum değişkenine kaydeder
    const axiosInstance = axios.create({baseURL:process.env.REACT_APP_API_URL,});
    const getNodes = async () => {
      try {
        const response = await axiosInstance.get("beytepenodesrev5");
        const json = response.data;
        const nodes = json.map((row) => ({
          id: row.node_id,
          latitude: row.latitude,
          longitude: row.longitude,
          road_type: row.yol_turu,
          road_direction: row.yol_yonu,
        }));
        setNodes(nodes);
        console.log(nodes);
      } catch (error) {
        console.error(error);
      }
    };
    
    const getLines = async () => {
      try {
        const response = await axiosInstance.get("beytepe_roads_rev2");
        const json = response.data;
        const lines = json.map((row) => ({
          start: row.start_id,
          end: row.end_id,
          distance: row.yol_uzunlk,
          geometry: row.geom,
          road_type: row.yol_turu,
          road_direction: row.yol_yonu,
        }));
    
        setLines(lines);
      } catch (error) {
        console.error(error);
      }
    };

    
    const getBuildings = async () => {
      try {
        const response = await axiosInstance.get("binalar");
        const json = response.data;
        const binalar = json
          .map((row) => ({
            id: row.bina_id,
            name: row.bina_adı,
          }))
          .sort((a, b) => a.name.localeCompare(b.name, "tr"));
        setBuildings(binalar);
      } catch (error) {
        console.error(error);
      }
    };
    
    const getParks= async () => {
      try {
        const response = await axiosInstance.get("otopark");
        const json = response.data;
        const carparks = json.map((row) => ({
        id:row.node_id  
        }));
    
        setCarparks(carparks);
      } catch (error) {
        console.error(error);
      }
    };

    const getBina= async () => {
      try {
        const response = await axiosInstance.get("bina");
        const json = response.data;
        const bina = json.map((row) => ({
        id:row.id,
        latitude: row.latitude,
        longitude: row.longitude,
        web_site:row.web_site,
        bina_name:row.bina_name
        }));
        console.log(bina)
        setBina(bina);
      } catch (error) {
        console.error(error);
      }
    };
    useEffect(() => {
      getNodes();
      getLines();
      getBuildings();
      getParks();
      getBina();
    }, []);
    const handleStartNodeChange = (selectedOption) => {
      console.log("Selected option: ", selectedOption);
      if (selectedOption.value === "Konumum") {
        setIsStartNodeCurrentLocation(true);
        document.getElementById("from").textContent = selectedOption.value;
      } else {
        setIsStartNodeCurrentLocation(false);
        setStartNode(selectedOption.value);
        const selectedBuilding = binalar.find((bina) => bina.id === parseInt(selectedOption.value));
        document.getElementById("from").textContent = selectedBuilding.name;
      }
    };
  
    const handleEndNodeChange = (selectedOption) => {
      setEndNode(selectedOption.value);
      const selectedBuilding = binalar.find((bina) => bina.id === parseInt(selectedOption.value));
      document.getElementById("to").textContent = selectedBuilding.name;
    };

    const handleTravelTypeChange = (event) => {
      setTravelType(event.target.value);
    };

    
  
    const handleCalculateRoute = () => {
      if (startNode && endNode) {
        const routeNodes = Dijkstra(startNode, endNode, nodes, lines, travelType);
        setRoute(routeNodes);
        console.log("Route Nodes: ", routeNodes);
    
        const routeGeometry = getRouteGeometry(routeNodes, lines);
        setRouteGeometry(routeGeometry);
        console.log("Route Geometry: ", routeGeometry);
      }
    };
    
    
    const getRouteGeometry = (routeNodes, lines) => {
      const routeGeometry = routeNodes.reduce((acc, nodeId, index) => {
        if (index < routeNodes.length - 1) {
          const line = lines.find(
            (line) =>
              (parseInt(line.start) === nodeId &&
                parseInt(line.end) === routeNodes[index + 1]) ||
              (parseInt(line.end) === nodeId &&
                parseInt(line.start) === routeNodes[index + 1])
          );
          if (line) {
            const coordinates = JSON.parse(line.geometry).coordinates;
        
            if (index === 0 && parseInt(line.start) === nodeId) {
            } else if (parseInt(line.start) === nodeId) {
              acc.push(...coordinates.slice(1));
            } else {
              acc.push(...coordinates.slice(0, -1).reverse());
            }
          }
        }
        return acc;
      }, []);
        
      return routeGeometry;
    };
    const buildingOptions = useMemo(() => [
      {
        value: "Konumum",
        label: "Konumum",
      },
      ...binalar.map((bina) => ({
        value: bina.id,
        label: bina.name,
      })),
    ], [binalar]);

    const toggleSidebar = () => {
      setIsOpen(!isOpen);
    };

    useEffect(() => {
      let watcher = null;
      
      if (isStartNodeCurrentLocation && navigator.geolocation) {
        watcher = navigator.geolocation.watchPosition(
          (position) => {
            setUserLat(position.coords.latitude);
            setUserLng(position.coords.longitude);
            console.log("User position: ", position.coords.latitude, position.coords.longitude);

            const nearestNode = getNearestNode(position.coords.latitude, position.coords.longitude);
            setStartNode(nearestNode.id);
            handleCalculateRoute();
          },
          (error) => {
            console.error("Geolocation error: ", error);
          }
        );
      }
      
      return () => {
        if (watcher) {
          navigator.geolocation.clearWatch(watcher);
        }
      };
    }, [isStartNodeCurrentLocation]);
  
    const getNearestNode = () => {
      let minDistance = Infinity;
      let nearestNode = null;
  
      nodes.forEach((node) => {
        const distance = getDistance(userLat, userLng, node.latitude, node.longitude);
        if (distance < minDistance) {
          minDistance = distance;
          nearestNode = node;
        }
      });
  
      return nearestNode;
    };
  
    useEffect(() => {
      if (isStartNodeCurrentLocation && userLat && userLng && nodes.length > 0) {
        const nearestNode = getNearestNode();
        setStartNode(nearestNode.id);
      }
    }, [isStartNodeCurrentLocation, userLat, userLng, nodes]);
    
    const getDistance = (lat1, lng1, lat2, lng2) => {
      return haversineDistance({lat: lat1, lng: lng1}, {lat: lat2, lng: lng2});
    };

    const handleBinaClick = (building) => {
      setSelectedBina(building);
      console.log(building)
    };
  
  
    return (
      <div>
        <MapComponent
        nodes={nodes}
        lines={lines}
        route={route}
        startNode={startNode}
        endNode={endNode}
        routeGeometry={routeGeometry}
        userLat= {userLat}
        userLng= {userLng}
        selectedBuilding={selectedBina}
    
        
      />
      <SidebarLeft
      isOpen={isOpen} 
      buildingOptions={buildingOptions}
      handleStartNodeChange={handleStartNodeChange}
      handleEndNodeChange={handleEndNodeChange}
      handleCalculateRoute={handleCalculateRoute}
      handleTravelTypeChange={handleTravelTypeChange}
      travelType={travelType}
      bina={bina}
      handleBinaClick={handleBinaClick}
    
      
      

      />
     <SidebarRight isOpen={isOpen} onClick={toggleSidebar} />
     <HorizontalBar isOpen={isOpen}
      travelType={travelType} />

    <button onClick={() => {
        navigator.geolocation.getCurrentPosition((position) => {
          setUserLat(position.coords.latitude);
          setUserLng(position.coords.longitude);
          console.log("Button - User position: ", position.coords.latitude, position.coords.longitude);
        });
      }}
    >
      Use My Location
    </button> 

    </div>

    
  );
};

      
  export default App;
