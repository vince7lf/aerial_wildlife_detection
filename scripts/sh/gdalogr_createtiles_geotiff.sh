#!/bin/bash

# how-to run the script
# gdalogr_createtiles_geotiff.sh 2019-Boucherville-13225474-13410695_tile.jpg /mnt/c/Users/User/Downloads/AIDE+MELCC/presence_AIDE/test /mnt/c/Users/User/Downloads/AIDE+MELCC/presence_AIDE/test > /dev/null 2>&1

# this script is a part of a proof of concept, and assume things work as expected.
# It should not be the way to do, and not used in production and by operations.
# no logging and no error management.

# -x to exit immediately when an error occured
# -e to display more information
# set -ex
# set echo off

# imgFilename='test_266_tile.jpg'
# srcDir='/tmp/test/gdal'
imgFilename=$1
srcDir=$2
parentDir=$3
extension="${imgFilename##*.}"
filename="${imgFilename%.*}"
destDir="${srcDir}/${filename}"
shpFilename="${filename}.ms.shp"
geojsonFilename="${filename}.ms.geojson"

# clean
_clean()
{
  rm -rf ${destDir}/*.dbf
  rm -rf ${destDir}/*.prj
  rm -rf ${destDir}/*.shp
  rm -rf ${destDir}/*.shx
  rm -rf ${destDir}/1
}

# clean all
_cleanAll()
{
  rm -rf ${destDir}
}

_convertJPEGToTIFF()
{
  geoTiffFilename="${filename}.tiff"
  jgwFilename="${filename}.jgw"
  wldFilename="${filename}.wld"

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
  gdal_translate -of GTiff -a_srs EPSG:4326 -co COMPRESS=JPEG ${srcDir}/${imgFilename} ${srcDir}/${geoTiffFilename} > /dev/null 2>&1

  cp -rap ${srcDir}/${jgwFilename} ${destDir}
  cp -rap ${srcDir}/${wldFilename} ${destDir}
  cp -rap ${srcDir}/${geoTiffFilename} ${destDir}

}

_convertTIFFToJPEG()
{
  jpgFilename="${filename}.jpg"

  # convert to geoTiff; compress like JPEG default 75%; to keep same size as original JPEG
  gdal_translate -of JPEG -co worldfile=yes ${srcDir}/${imgFilename} ${srcDir}/${jpgFilename} > /dev/null 2>&1

  cp -rap ${srcDir}/${jpgFilename} ${destDir}
}

# clean all before processing
#_cleanAll

# prepare
mkdir -p ${destDir}
cp -rap ${srcDir}/${imgFilename} ${destDir}

[[ "${extension,,}" =~ "jpeg"|"jpg" ]] && _convertJPEGToTIFF
[[ "${extension,,}" =~ "tif"|"tiff" ]] && _convertTIFFToJPEG

# create tile as shapefile
# output and error piped to /dev/null
# -r bilinear: use bilinear interpolation when building the lower resolution levels. This is key to get good image quality without asking GeoServer to perform expensive interpolations in memory
# -levels 1: the number of levels in the pyramid
# -ps 128 128: each tile in the pyramid will be a 128x128 GeoTIFF
# -co “TILED=YES”: each GeoTIFF tile in the pyramid will be inner tiled
# -co “COMPRESS=JPEG”: each GeoTIFF tile in the pyramid will be JPEG compressed (trades small size for higher performance, try out it without this parameter too)
gdal_retile.py -co "TILED=YES" -co "COMPRESS=JPEG" -r bilinear -levels 1 -tileIndex ${shpFilename} -tileIndexField Location -ps 128 128 -targetDir ${destDir} ${srcDir}/${imgFilename} > /dev/null 2>&1

# create .geojson and generate .tiff tiles
# output and error piped to /dev/null
ogr2ogr -f GeoJSON -s_srs crs:84 -t_srs crs:84 ${destDir}/${geojsonFilename} ${destDir}/${shpFilename} > /dev/null 2>&1

# loop through the .tiff files and convert the tiff to jpg if we need to share them; jpeg won't appear in the database.
tiles=()
for f in ${destDir}/*.tif; do
  jpg="${f%.*}.jpg"
  gdal_translate -of JPEG -co worldfile=yes ${f} ${jpg} > /dev/null 2>&1
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
