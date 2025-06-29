docker run --rm `
    -v "${PWD}:/data" `
    stefda/osmium-tool `
    osmium cat -f pbf -o /data/map.pbf /data/map.osm




docker run --rm -v "$(pwd):/data" stefda/osmium-tool osmium cat -f pbf -o /data/map.pbf /data/map.osm



EXCRACT
docker run --rm -t -v D:/uygulama_test/data:/data osrm/osrm-backend `
  osrm-extract -p /opt/foot.lua /data/foot/map.pbf

partition 
docker run --rm -t -v D:/uygulama_test/data:/data osrm/osrm-backend `
  osrm-partition /data/bicycle/map.osrm
CUSTOMİZE
docker run --rm -t -v D:/uygulama_test/data:/data osrm/osrm-backend `
  osrm-customize /data/foot/map.osrm



sunucu kısmı : docker run -d -p 5000:5000 -v D:/uygulama_test/data/foot:/data osrm/osrm-backend osrm-routed --algorithm mld /data/map.osrm
docker run -d -p 5001:5000 -v D:/uygulama_test/data/car:/data osrm/osrm-backend osrm-routed --algorithm mld /data/map.osrm
docker run -d -p 5002:5000 -v D:/uygulama_test/data/bicycle:/data osrm/osrm-backend osrm-routed --algorithm mld /data/map.osrm







 1) Extract
docker run --rm -t \
  -v "~/uygulama_test/data:/data" \
  osrm/osrm-backend \
  osrm-extract -p /opt/foot.lua /data/foot/map.pbf

# 2) Partition
docker run --rm -t \
  -v "~/uygulama_test/data:/data" \
  osrm/osrm-backend \
  osrm-partition /data/foot/map.osrm

# 3) Customize
docker run --rm -t \
  -v "~/uygulama_test/data:/data" \
  osrm/osrm-backend \
  osrm-customize /data/bicycle/map.osrm







  cd ~/uygulama_test

docker run --rm -t \
  -v "$(pwd)/data:/data" \
  osrm/osrm-backend \
  osrm-extract -p /opt/foot.lua /data/foot/map.pbf

docker run --rm -t \
  -v "$(pwd)/data:/data" \
  osrm/osrm-backend \
  osrm-partition /data/foot/map.osrm

docker run --rm -t \
  -v "$(pwd)/data:/data" \
  osrm/osrm-backend \
  osrm-customize /data/bicycle/map.osrm

