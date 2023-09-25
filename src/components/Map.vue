<template lang="pug">
#map.info-light3--bg(style="position:absolute;width:100%; height:100%")
</template>

<script>
import mapboxgl from "mapbox-gl/dist/mapbox-gl-dev.js";
import "mapbox-gl/dist/mapbox-gl.css";
import U from "map-gl-utils/noflow/index";
import * as turf from "@turf/turf";
import { stations } from "../stations";
window.turf = turf;
window.uuu = U;
// import { EventBus } from "../EventBus";
export default {
  props: ["guesses", "target"],
  async mounted() {
    // replace this Mapbox access token with your own
    mapboxgl.accessToken =
      "pk.eyJ1Ijoic3RldmFnZSIsImEiOiJjbG1vZGE4cXgwbjY4MmptcHN1d2M4YWYyIn0.AFsAhFFbMnuo9e3NgICpFw";
    const map = new mapboxgl.Map({
      container: "map",
      center: [144.96, -37.81],
      zoom: 12,
      style: "mapbox://styles/mapbox/light-v9",
    });
    U.init(map, mapboxgl);
    const geoGuesses = [...this.guesses, this.target].map((g) =>
      stations.find((s) => s.properties.name === g),
    );
    map.fitBounds(turf.bbox(turf.featureCollection(geoGuesses)), {
      padding: 80,
    });

    window.map = map;
    window.mapping = this;
    map.U.onLoad(() => {
      map.U.hide(/place-city/);
      map.U.addGeoJSON("trains", "trainline.geojson");

      loadTrainLines().then((lineData) => map.U.setData("trains", lineData));
      // const lineFilter = [
      //   "!",
      //   ["in", ["get", "name"], ["literal", "Sunshine - Gordon"]],
      // ];
      let lineFilter = [
        "in",
        ["get", "name"],
        [
          "literal",
          "Laverton - Werribee,Newmarket - Broadmeadows,Clifton Hill - Mernda, Clifton Hill - Hurstbridge,Footscray - Sunshine,South Kensington - Footscray,North Melbourne - Upfield,Southern Cross - North Melbourne,Start Altona Loop - Laverton,Newport - Start Altona Loop,Newport - Williamstown,Footscray - Newport,Kensington - Newmarket,Newmarket - Flemington Racecourse,Flinders Street - Clifton Hill,Southern Cross - Flinders Street,South Yarra - Caulfield,Broadmeadows - Mangalore,Clifton Hill - Hurstbridge,Burnley - East Camberwell,East Camberwell - Alamein,East Camberwell - Ringwood,Ringwood - Lilydale,Ringwood - Belgrave,Caulfield - Dandenong,Dandenong - Cranbourne,Dandenong - Pakenham,Caulfield - Frankston,South Yarra - Sandringham,Burnley - Glen Waverley,Richmond - Burnley,Richmond - South Yarra,Frankston - Stony Point,Albion - Sydenham,Sunshine - Albion,North Melbourne - South Kensington,Flinders Street - Richmond,Sydenham - Castlemaine,Southern Cross - Southern Cross,Burnley Loop,Northern Loop".split(
            ",",
          ),
        ],
      ];
      // lineFilter = true;
      map.U.addLine("trains-line", "trains", {
        lineColor: "hsl(180,50%,70%)",
        lineWidth: 5,
        filter: lineFilter,
      });
      map.U.addLine("trains-line-inner", "trains", {
        lineColor: "hsl(180,50%,85%)",
        lineWidth: 3,
        filter: lineFilter,
      });
      map.U.addSymbol("trains-label", "trains", {
        symbolPlacement: "line",
        symbolSpacing: 20,
        textField: ["get", "name"],
        textColor: "hsla(180,50%,50%, 50%)",
        textSize: 28,
        textSize: 8,
        textAllowOverlap: true,
        textOffset: [0, 1],
        visibility: "none",
      });
      map.U.addGeoJSON("stations", turf.featureCollection(stations));
      map.U.addCircle("stations-circle", "stations", {
        circleColor: [
          "case",
          ["==", ["get", "name"], this.target],
          "hsl(120,50%,70%)",
          [
            "case",
            ["in", ["get", "name"], ["literal", this.guesses]],
            "hsl(0,70%,70%)",
            "hsla(180,50%,80%,0.7)",
          ],
        ],
        circleRadius: [
          "case",
          ["==", ["get", "name"], this.target],
          6,
          ["case", ["in", ["get", "name"], ["literal", this.guesses]], 6, 2],
        ],
        circleStrokeWidth: 2,
        circleStrokeColor: [
          "case",
          ["==", ["get", "name"], this.target],
          "hsl(120,100%,30%)",
          [
            "case",
            ["in", ["get", "name"], ["literal", this.guesses]],
            "hsl(0,100%,30%)",
            "hsla(180,50%,60%,0.5)",
          ],
        ],
      });
      map.U.addSymbol("stations-label", "stations", {
        textSize: 16,
        textOffset: [0.5, 0],
        textField: ["get", "nameUp"],
        textHaloColor: "hsla(0,0%,100%,0.5)",
        textHaloWidth: 1,
        textAnchor: "left",
        textAllowOverlap: true,
        filter: [
          "in",
          ["get", "name"],
          ["literal", [...this.guesses, this.target]],
        ],
      });
      map.U.addSymbol("stations-label-small", "stations", {
        textSize: U.interpolateZoom({ 12: 12, 16: 20 }),
        textField: ["get", "nameUp"],
        textColor: "hsl(180,40%,50%)",
        textHaloColor: "hsla(0,0%,100%,0.5)",
        textHaloWidth: 1,
        textAnchor: "left",
        textOffset: [0.5, 0],

        filter: [
          "!",
          ["in", ["get", "name"], ["literal", [...this.guesses, this.target]]],
        ],
        minzoom: 11,
      });
    });
  },
};

async function loadTrainLines() {
  function cutAtStation(segmentName, stationName, segmentPart = 0) {
    const segment = lineData.features.find(
      (l) => l.properties.name === segmentName,
    );
    const segmentLS =
      segment.geometry.type === "LineString"
        ? segment
        : turf.lineString(segment.geometry.coordinates[0]);
    const station = stations.find((s) => s.properties.nameUp === stationName);
    const nearStation = turf.nearestPointOnLine(segment, station);
    const splitParts = turf.lineSplit(segmentLS, nearStation);
    // });

    segment.geometry.coordinates = [
      splitParts.features[0].geometry.coordinates,
    ];
    segment.geometry.type = "MultiLineString";
  }

  const url = "trainline.geojson";
  const lineData = await fetch(url).then((res) => res.json());
  lineData.features = lineData.features.filter(
    (l) => l.properties.SEGMENT !== "Start Altona Loop - Laverton",
  );
  cutAtStation("Broadmeadows - Mangalore", "Craigieburn");
  cutAtStation("Sydenham - Castlemaine", "Sunbury");
  cutAtStation("Dandenong - Pakenham", "Pakenham");
  cutAtStation("East Camberwell - Alamein", "Alamein");
  cutAtStation("North Melbourne - Upfield", "Upfield");
  // cutAtStation("Clifton Hill - Mernda", "Mernda");

  // 1;

  return lineData;
}
</script>

<style scoped></style>
