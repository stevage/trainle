import graphology from 'graphology'
import { bidirectional } from 'graphology-shortest-path'
import stationsFC from './assets/stations.json'
import { distance } from '@turf/turf'
const stations = stationsFC.features
for (const station of stations) {
  station.properties.name = station.properties.STOP_NAME.replace(/ Railway Station.*$/, '').toLowerCase()
  station.properties.lines = station.properties.ROUTEUSSP.toLowerCase().split(',')
}
export const stationNames = stations.map(station => station.properties.name)
window.s = stations
function getLines() {
  const lines = new Set<string>()
  for (const station of stations) {
    for (const line of station.properties.lines) {
      lines.add(line.toLowerCase())
    }
  }
  return [...lines]
}

// function distance(a, b) {
//   // console.log(a?.properties.name, b?.properties?.name)
//   if (!b) { console.log(
//     '**',a)
//     return 1
//   }
//   return Math.sqrt(Math.pow(a.geometry.coordinates[0] - b.geometry.coordinates[0], 2) + Math.pow(a.geometry.coordinates[1] - b.geometry.coordinates[1], 2))
// }

export function stationDistance(a,b) {
  return distance(stations.find(station => station.properties.name === a), stations.find(station => station.properties.name === b))
}
window.sd = stationDistance

// find the station whose name begins with the line, then return the rest of the stations in order
// of distance from the one before
// function stationsForLine(line: string) {
//   let start = stations.find(station => station.properties.name === line)
//   const lineStations = stations.filter(station => station.properties.ROUTEUSSP.split(',').includes(line))
//   lineStations.sort((a, b) => distance(a, start) - distance(b, start))
//   console.log(lineStations.map(station => station.properties.name).join(', '))
//   return lineStations.map(station => station.properties.name)



// }

// find the station whose name begins with the line, then return the rest of the stations in order
// of distance from the one before
function stationsForLine(line: string) {
  // console.log('stationsforline',line)
  const lineStations = stations.filter(station => station.properties.lines.includes(line))
  let current = lineStations.find(station => station.properties.name === line)
  if (!current) {
    console.log('No such station as ', line)
    return []
  }
  let remainingStations = lineStations.filter(station => station.properties.name !== line)
  const result = [current]
  // console.log(current.properties.name)
  while (remainingStations.length) {
    remainingStations.sort((a, b) => distance(a, current) - distance(b, current))
    current = remainingStations[0];
    result.push(current)
    // console.log(current.properties.name)
    remainingStations = remainingStations.filter(station => station !== current)
  }
  return result.map(station => station.properties.name)

}



let graph
function initGraph() {
  graph = new graphology.Graph()

  function addEdge(a,b) {
    // console.log(a,b)
    graph.addEdge(a,b)
    graph.addEdge(b,a)
  }

  window.gr=graph
  const lines = getLines();
  for (const station of stations) {
    // console.log(station.properties.name)
    graph.addNode(station.properties.name)
  }
  const cityLoop = ['Flinders Street', 'Southern Cross', 'Flagstaff','Melbourne Central','Parliament'].map(s=>s.toLowerCase())
  cityLoop.forEach((station,i) => addEdge(station, cityLoop[(i+1) % (cityLoop.length)]))

  window.n = stations.map(station => station.properties.name)
  console.log(lines)
  for (const line of lines) {
    const lineStations = stationsForLine(line)

    for (let i = 0; i < lineStations.length - 1; i++) {
        try {
          if (cityLoop.includes(lineStations[i]) && cityLoop.includes(lineStations[i + 1])) {
            continue
          }
        addEdge(lineStations[i], lineStations[i + 1])
        // console.log(lineStations[i], lineStations[i + 1], line)
        } catch (e) {
        }
      }

  }

}

export function getShortestPath(from: string, to: string) {
  console.log('hi')
  if (!graph) {
    initGraph()
  }

  const path  = bidirectional(graph, from, to)
  return path
}