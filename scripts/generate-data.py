#!/bin/python3

import urllib
import zipfile
import tempfile
import json
import os.path
from pathlib import Path
import geopandas as gpd
import shapely
from shapely import MultiLineString
import gtfs_kit as gk

# Transport VIC GTFS schedule
url = "https://opendata.transport.vic.gov.au/dataset/3f4e292e-7f8a-4ffe-831f-1953be0fe448/resource/fb152201-859f-4882-9206-b768060b50ad/download/gtfs.zip"

print("Retrieving gtfs data")
gtfs_zip_path = Path("/tmp/gtfs.zip")
if not gtfs_zip_path.exists():
    print(f"Downloading GTFS data to {gtfs_zip_path}")
    urllib.request.urlretrieve(url, gtfs_zip_path)


gtfs_extract_dir = Path("/tmp/gtfs-metro-extract")
if not gtfs_extract_dir.exists():
    with tempfile.TemporaryDirectory() as temp_dir:
        temp_dir = Path(temp_dir)
        with zipfile.ZipFile(gtfs_zip_path) as zip_file:
            zip_file.extractall(temp_dir)

        with zipfile.ZipFile(temp_dir / "2/google_transit.zip") as zip_file:
            zip_file.extractall(gtfs_extract_dir)


print("Reading gtfs feed")
feed = gk.read_feed(gtfs_extract_dir, dist_units="m")

# Get route IDs for non-replacement bus routes
route_ids = [route for route in feed.routes["route_id"] if route[-3:] != "-R:"]

ASSETS_DIR = Path(
    os.path.join(os.path.dirname(os.path.abspath(__file__)), "../src/assets")
)

# Limit the geo-data to be only one direction, halving the data
print("Generating geojson")
geojson_dict = feed.routes_to_geojson(route_ids)
features = []
for feature in geojson_dict["features"]:
    route_id = feature["properties"]["route_id"]
    if route_id == "aus:vic:vic-02-CCL:":
        # There is a rogue "City Circle" train line that is just the city loop
        continue
    route_id = feature["properties"]["route_id"]
    print(f"Simplifying tracks for {route_id}")
    # Deduplicate the tracks
    gdf = gpd.GeoDataFrame.from_features([feature])
    gdf = gdf.dissolve()
    merged = shapely.line_merge(
        MultiLineString(gdf.__geo_interface__["features"][0]["geometry"]["coordinates"])
    )
    feature["geometry"] = merged.__geo_interface__
    features.append(feature)

geojson_dict["features"] = features

print("Writing JSON")
with open(ASSETS_DIR / "metro_routes.json", "w") as file:
    json.dump(geojson_dict, file, indent=4)
