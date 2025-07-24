# Data Preparation (.osm -> .pbf)
docker run --rm `
    -v "${PWD}:/data" `
    stefda/osmium-tool `
    osmium cat -f pbf -o /data/map.pbf /data/map.osm 

# Docker Operations
Create three folders for different transportation modes: i) car, ii) foot, and iii) bicycle.

## Car Folder
Change to the folder: *~\car* 

### 1) Extract
docker run --rm -v "${PWD}:/data" `
  osrm/osrm-backend osrm-extract -p /opt/car.lua /data/map.osm.pbf

### 2) Partition
docker run --rm -v "${PWD}:/data" `
  osrm/osrm-backend osrm-partition /data/map.osrm

### 3) Customize
docker run --rm -v "${PWD}:/data" `
  osrm/osrm-backend osrm-customize /data/map.osrm

## Foot Folder
Change to the folder: *~\foot* 

### 1) Extract
docker run --rm -v "${PWD}:/data" `
  osrm/osrm-backend osrm-extract -p /opt/foot.lua /data/map.osm.pbf

### 2) Partition
docker run --rm -v "${PWD}:/data" `
  osrm/osrm-backend osrm-partition /data/map.osrm

### 3) Customize
docker run --rm -v "${PWD}:/data" `
  osrm/osrm-backend osrm-customize /data/map.osrm

## Bicycle Folder
Change to the folder: *~\bicycle* 

### 1) Extract
docker run --rm -v "${PWD}:/data" `
  osrm/osrm-backend osrm-extract -p /opt/bicycle.lua /data/map.osm.pbf

### 2) Partition
docker run --rm -v "${PWD}:/data" `
  osrm/osrm-backend osrm-partition /data/map.osrm

### 3) Customize
docker run --rm -v "${PWD}:/data" `
  osrm/osrm-backend osrm-customize /data/map.osrm

## Server Side Operations

### car → host 5000
Change to the folder: *~\car* 

docker run -d -p 5000:5000 -v "${PWD}:/data" `
  osrm/osrm-backend osrm-routed --algorithm mld /data/map.osrm

### foot → host 5001
Change to the folder: *~\foot* 

docker run -d -p 5001:5000 -v "${PWD}:/data" `
  osrm/osrm-backend osrm-routed --algorithm mld /data/map.osrm

### bicycle → host 50023
Change to the folder: *~\bicycle* 

docker run -d -p 5002:5000 -v "${PWD}:/data" `
  osrm/osrm-backend osrm-routed --algorithm mld /data/map.osrm