#!/bin/bash

# requires the tool 'exiftool' to read the EXIF metadata and the the GPS related fields gpslongitude & gpslatitude
# also requires gdal libraries

# how-to run the script
# ./jpeg-w-gps_to_geotiff.sh <source directory> <jpeg filename> <destination directory> > /dev/null 2>&1

# this script is a part of a proof of concept, and assume things work as expected.
# It should not be the way to do, and not used in production and by operations.
# no logging and no error management.

# -x to exit immediately when an error occured
# -e to display more information
set -ex
#set echo off

imgFilename=$1
srcDir=$2
extension="${imgFilename##*.}"
filename="${imgFilename%.*}"
#destDir="${srcDir}/${filename}" #not used; remove after testing if really not needed
geoTiffFilename="${filename}.tiff"
jgwFilename="${filename}.jgw"
wldFilename="${filename}.wld"

[[ "${extension,,}" =~ "jpeg"|"jpg" ]] || exit

# requires the exiftool to read the EXIF metadata
# read the JPEG EXIF metadata gpslongitude and gpslatitude
lonx=(`exiftool -s -s -s -c '%.13f' -gpslongitude ${srcDir}/${imgFilename}`)
laty=(`exiftool -s -s -s -c '%.13f' -gpslatitude ${srcDir}/${imgFilename}`)

# the format of the file document at <https://en.wikipedia.org/wiki/World_file>
# value of 0.00000001 has been deducted using QGIS and a JPEG. The photo represent a square of 1m x 1m of a field.
# the GPS coordinates latx/lonx represent the upper-left corner. lonx is negative
# tested with QGIS
echo -e "0.00000001\n0\n0\n-0.00000001\n-${lonx}\n${laty}" > ${srcDir}/${jgwFilename}
echo -e "0.00000001\n0\n0\n-0.00000001\n-${lonx}\n${laty}" > ${srcDir}/${wldFilename}

# convert to geoTiff; compress like JPEG default 75%; to keep same size as original JPEG
gdal_translate -of GTiff -a_srs EPSG:4326 -co COMPRESS=JPEG ${srcDir}/${imgFilename} ${srcDir}/${geoTiffFilename}