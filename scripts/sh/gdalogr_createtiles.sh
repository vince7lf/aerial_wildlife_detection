#!/bin/bash

# how-to run the script
# ./create_tile.sh > /dev/null 2>&1

# this script is a part of a proof of concept, and assume things work as expected.
# It should not be the way to do, and not used in production and by operations.
# no logging and no error management.

# -x to exit immediately when an error occured
# -e to display more information
DEBUG=$4
set -ex
devnull=/dev/null
[ "$DEBUG" = true ] && set -ex
# trick to cut the errors/warnings in the output of the command : redirect to /dev/null and then copy the error output 2 to standard output 1; syntax is: command > /dev/null 2>&1
[ "$DEBUG" = true ] && devnull=1 # when debug is true, need to specify an output file descriptor to replace /dev/null; in that case we replace /dev/null by standard output 1
# In that case the syntax is: command > 1 2>&1. The 2>&1 is important in case the command output errors/warnings we do not want to display
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
  rm -rf ${srcDir}/*.wld
  rm -rf ${srcDir}/*.jgw

  rm -rf ${destDir}/*.tif
  rm -rf ${destDir}/*.wld
  rm -rf ${destDir}/*.prj
  rm -rf ${destDir}/*.dbf
  rm -rf ${destDir}/*.shp
  rm -rf ${destDir}/*.shx
  rm -rf ${destDir}/1
}

# clean all
_cleanAll()
{
  rm -rf ${destDir}
}

# clean all before processing
_cleanAll

# prepare
mkdir -p "${destDir}"
cp -rap ${srcDir}/${imgFilename} ${destDir}

# create tile as shapefile
# output and error piped to /dev/null
gdal_retile.py SRC_METHOD=NO_GEOTRANSFORM -levels 1 -tileIndex ${shpFilename} -tileIndexField Location -ps 128 128 -targetDir ${destDir} ${srcDir}/${imgFilename}

# create .geojson and generate .tiff tiles
# output and error piped to /dev/null
ogr2ogr -f GeoJSON -s_srs crs:84 -t_srs crs:84 ${destDir}/${geojsonFilename} ${destDir}/${shpFilename} > ${devnull} 2>&1

# loop through the .tiff files and convert to .jpg
tiles=()
for f in ${destDir}/*.tif; do
  jpg="${f%.*}.jpg"
  # output and error piped to /dev/null
  gdal_translate -of JPEG -co worldfile=yes ${f} ${jpg} > ${devnull} 2>&1
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

_testJPEGExifGPS()
{
  [[ ! -z $(exiftool -s -s -s -c '%.13f' -gpslongitude ${srcDir}/${imgFilename}) ]] || { echo ""; return; };
  [[ ! -z $(exiftool -s -s -s -c '%.13f' -gpslatitude ${srcDir}/${imgFilename}) ]] || { echo ""; return; };
  echo 1
}

[[ "${extension,,}" =~ "jpeg"|"jpg" && ! -z $(_testJPEGExifGPS) ]] || exit 1
#[[ "${extension,,}" =~ "tif"|"tiff" ]] && _convertTIFFToJPEG

# trigger the script to create the geolocalized geojson and tiles/images and used by mapserver.
# in the futur that script should be the only one and openlayer in the annotation interface should suppoer geolocalized geojson
nohup gdalogr_createtiles_geotiff.sh "$1" "$2" "$3" &

# assume always good, no errors
exit 1
