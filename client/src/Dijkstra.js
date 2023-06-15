import dijkstra from "dijkstrajs";
// Graf yapısı oluşturuldu
// Graph structure created
const Dijkstra = (startNode, endNode, nodes, lines, travelType) => {
  const graph = {};

  nodes.forEach((node) => {
    graph[node.id] = {};
  });

  lines.forEach((line) => {
    const allowedRoadTypes = getAllowedRoadTypes(travelType);
    

    if (allowedRoadTypes.includes(line.road_type)) {
      const start = line.start.toString();
      const end = line.end.toString();
      const distance = line.distance;
      graph[start][end] = distance;
      graph[end][start] = distance;
    }
  });

  const path = dijkstra.find_path(graph, startNode.toString(), endNode.toString());
  return path.map((node) => parseInt(node));
};

// Seyahat türüne göre izin verilen yol türlerini döndürme işlemi
// Operation to return allowed road types based on travel type
const getAllowedRoadTypes = (travelType) => {
  switch (travelType) {
    case "engelli":
      return ["yaya", "araba", "engelli_rampası"];
    case "bisiklet":
      return ["yaya", "araba", "engelli_rampası"];
    default:
      return ["yaya", "araba", "merdiven", "engelli_rampası"];
  }
};

export default Dijkstra;
