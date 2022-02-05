#!/bin/bash

# how-to run the script
# ./create_tile.sh > /dev/null 2>&1

# this script is a part of a proof of concept, and assume things work as expected.
# It should not be the way to do, and not used in production and by operations.
# no logging and no error management.

# -x to exit immediately when an error occured
# -e to display more information
# set -x
# set echo off

# imgFilename='test_266_tile.jpg'
# srcDir='/tmp/test/gdal'
imgFilename=$1
srcDir=$2
parentDir=$3
extension="${imgFilename##*.}"
filename="${imgFilename%.*}"
destDir="${srcDir}/${filename}"
shpFilename="${filename}.shp"
geojsonFilename="${filename}.geojson"

# clean
_clean()
{
  rm -rf ${destDir}/*.tif
  rm -rf ${destDir}/*.wld
  rm -rf ${destDir}/*.dbf
  rm -rf ${destDir}/*.shp
  rm -rf ${destDir}/*.shx
  rm -rf ${destDir}/1 # folder created no idea by which process... not used, remove it.
}

# clean all
_cleanAll()
{
  rm -rf ${destDir}
}

# clean all before processing
_cleanAll

# prepare
mkdir -p ${destDir}
cp -rap ${srcDir}/${imgFilename} ${destDir}

# create tile as shapefile
# output and error piped to /dev/null
gdal_retile.py -levels 1 -tileIndex ${shpFilename} -tileIndexField Location -ps 128 128 -targetDir ${destDir} ${srcDir}/${imgFilename} > /dev/null 2>&1

# create .geojson and generate .tiff tiles
# output and error piped to /dev/null
ogr2ogr -f GeoJSON -s_srs crs:84 -t_srs crs:84 ${destDir}/${geojsonFilename} ${destDir}/${shpFilename} > /dev/null 2>&1

# loop through the .tiff files and convert to .jpg
tiles=()
for f in ${destDir}/*.tif; do
  jpg="${f%.*}.jpg"
  # output and error piped to /dev/null
  gdal_translate -of JPEG -scale -co worldfile=yes ${f} ${jpg} > /dev/null 2>&1
  tiles+=(${parentDir}/${filename}/$(basename -- "${jpg}"))
done

# change .tif to .jpg into the .geojson
sed -i 's/\.tif/\.jpg/g' ${destDir}/${geojsonFilename}

# remove unecessary files
_clean

if [ ${#tiles[@]} -eq 0 ]; then exit 0; fi

# output the list of new images with path
for tile in "${tiles[@]}"
do
     echo $tile
done

# assume always good, no errors
exit 1
