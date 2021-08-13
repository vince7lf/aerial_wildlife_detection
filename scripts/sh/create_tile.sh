#!/bin/bash

# how-to run the script
# ./create_tile.sh > /dev/null 2>&1

# -x to exit immediately when an error occured
# -e to display more information
# set -e
set echo off

imgFilename='test_266_tile.jpg'
targetDir='/tmp/test/gdal'
extension="${imgFilename##*.}"
filename="${imgFilename%.*}"

shpFilename="${filename}.shp"
geojsonFilename="${filename}.geojson"

# clean
_clean()
{
  rm -rf ${targetDir}/*.tif
  rm -rf ${targetDir}/*.wld
  rm -rf ${targetDir}/*.dbf
  rm -rf ${targetDir}/*.shp
  rm -rf ${targetDir}/*.shx
}

# clean all
_cleanAll()
{
  _clean
  rm -rf ${targetDir}/*.geojson

  # removes only generated .jpg files, and not the source
  ls -1 -d "$PWD/" /tmp/test/gdal/* | grep -P ".*_\d{2}_\d{2}\.jpg" | grep -P ".*_\d{2}_\d{2}\.jpg" | xargs -d"\n" rm -rf
}

_cleanAll

# create tile as shapefile
gdal_retile.py -levels 1 -tileIndex ${shpFilename} -tileIndexField Location -ps 224 224 -targetDir ${targetDir} ${targetDir}/${imgFilename}

# create .geojson and generate .tiff tiles
ogr2ogr -f GeoJSON -s_srs crs:84 -t_srs crs:84 ${targetDir}/${geojsonFilename} ${targetDir}/${shpFilename}

# loop through the .tiff files and convert to .jpg
for f in ${targetDir}/*.tif; do
  jpg="${f%.*}.jpg"
  gdal_translate -of JPEG -scale -co worldfile=yes ${f} ${jpg}
done

# change .tif to .jpg into the .geojson
sed -i 's/\.tif/\.jpg/g' ${targetDir}/${geojsonFilename}

# remove unecessary file
_clean
