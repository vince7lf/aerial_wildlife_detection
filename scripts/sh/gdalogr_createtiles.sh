#!/bin/bash

# how-to run the script
# ./gdalogr_createtiles.sh 2019-Boucherville-13225474-13410695_tile.jpg /mnt/c/Users/User/Downloads/AIDE+MELCC/presence_AIDE/test test > /dev/null 2>&1

# this script is a part of a proof of concept, and assume things work as expected.
# It should not be the way to do, and not used in production and by operations.
# no logging and no error management.

# -x to exit immediately when an error occurred
# -e to display more information
DEBUG=$5
devnull=/dev/null
[ ${DEBUG} = true ] && set -x
# trick to cut the errors/warnings in the output of the command : redirect to /dev/null and then copy the error output 2 to standard output 1; syntax is: command > /dev/null 2>&1
[ ${DEBUG} = true ] && devnull=1 # when debug is true, need to specify an output file descriptor to replace /dev/null; in that case we replace /dev/null by error output 2
# In that case the syntax is: command > 2 2>&1. The 2>&1 is important in case the command output errors/warnings we do not want to display
# set echo off

# imgFilename='test_266_tile.jpg'
# srcDir='/tmp/test/gdal'
imgFilename=$1
imgFilenameOrg=${imgFilename}
srcDir=$2
parentDir=$3
project=$4
extension="${imgFilename##*.}"
filename="${imgFilename%.*}"
imgFilenameNotGeo="${filename}.jpg"
destDir="${srcDir}/${filename}"
shpFilename="${filename}.shp"
geojsonFilename="${filename}.geojson"

# clean
_clean() {
  rm -rf ${srcDir}/*.jpg_original # generated by exiftool
  rm -rf ${srcDir}/*.jpg.aux.xml
  rm -rf ${srcDir}/*.wld
  rm -rf ${srcDir}/*.jgw

  rm -rf ${destDir}/*.tif
  rm -rf ${destDir}/*.wld

  rm -rf ${destDir}/*.jpg.aux.xml
  rm -rf ${destDir}/*.dbf
  rm -rf ${destDir}/*.prj
  rm -rf ${destDir}/*.shp
  rm -rf ${destDir}/*.shx
  rm -rf ${destDir}/1
}

# clean all
_cleanAll() {
  # be specific with the filename as multiple images can be in the same srcDir folder
  rm -rf ${srcDir}/${filename}.jpg_original # generated by exiftool
  rm -rf ${srcDir}/${filename}.jpg.aux.xml
  rm -rf ${srcDir}/${filename}.wld
  rm -rf ${srcDir}/${filename}.jgw

  [[ "${extension,,}" =~ "jpeg"|"jpg" ]] && rm -rf ${srcDir}/${filename}.tif*
  [[ "${extension,,}" =~ "tif"|"tiff" ]] && {
    rm -rf ${srcDir}/${filename}.jpg
    rm -rf ${srcDir}/${filename}.jpeg
  }

  rm -rf ${destDir}
}

_normalizeExtension() {
  # uppercase extension becomes lowercase
  imgFilename="${filename}.${extension,,}"
  # jpeg becomes jpg
  [[ "${extension,,}" = "jpeg" ]] && imgFilename="${filename}.jpg"

  [[ ${imgFilenameOrg} != ${imgFilename} ]] && cp -rap ${srcDir}/${imgFilenameOrg} ${srcDir}/${imgFilename}
}

_convertTIFFToJPEG() {
  # convert to geoTiff; compress like JPEG default 75%; to keep same size as original JPEG
  # important to specify 'worldfile=no' here. Otherwise the geojson will contain real coordinates, which we do not want here. the ms.template.geojson (mapserver) will be generated net step/script
  gdal_translate -of JPEG -co worldfile=no ${srcDir}/${imgFilename} ${srcDir}/${imgFilenameNotGeo} >${devnull} 2>&1

  # removes files that can help geolocalized the jpg
  rm -rf ${srcDir}/*.jpg.aux.xml
  rm -rf ${srcDir}/*.wld
  rm -rf ${srcDir}/*.jgw

  # strip all exif metadata
  exiftool -all= -overwrite_original ${srcDir}/${imgFilenameNotGeo} >${devnull} 2>&1

  cp -rap ${srcDir}/${imgFilenameNotGeo} ${destDir}/${imgFilenameNotGeo}
}

_testGeoJPEGExif() {
  [[ ! -z $(exiftool -s -s -s -c '%.13f' -gpslongitude ${srcDir}/${imgFilename}) ]] || {
    echo ""
    return
  }
  [[ ! -z $(exiftool -s -s -s -c '%.13f' -gpslatitude ${srcDir}/${imgFilename}) ]] || {
    echo ""
    return
  }
  echo 1
}

_testGeoTiffExif() {
  [[ ! -z $(exiftool -s -s -s -GeoTiffVersion ${srcDir}/${imgFilename}) ]] || {
    echo ""
    return
  }
  echo 1
}

# clean all before processing
_cleanAll

# prepare
_normalizeExtension

mkdir -p "${destDir}"
cp -rap ${srcDir}/${imgFilename} ${destDir}
[[ "${extension,,}" =~ "tif"|"tiff" ]] && _convertTIFFToJPEG

# create tile as shapefile
# output and error piped to /dev/null
# The command can return the following errors if JPEG is not georeferenced (no jwg/wld file)
# ERROR 1: The transformation is already "north up" or a transformation between pixel/line and georeferenced coordinates cannot be computed for TEMP. There is no affine transformation and no GCPs. Specify transformation option SRC_METHOD=NO_GEOTRANSFORM to bypass this check.
# Reprojection failed for /tmp/test-jpg-2/test-jpg/2019-Boucherville-13225474-13410695_tile/1/2019-Boucherville-13225474-13410695_tile_1_1.tif, error 3
gdal_retile.py -co "TILED=YES" -co "COMPRESS=JPEG" -r bilinear -levels 1 -tileIndex ${shpFilename} -tileIndexField Location -ps 128 128 -targetDir ${destDir} ${srcDir}/${imgFilenameNotGeo} >${devnull} 2>&1

# create .geojson and generate .tiff tiles
# output and error piped to /dev/null
ogr2ogr -f GeoJSON -s_srs crs:84 -t_srs crs:84 ${destDir}/${geojsonFilename} ${destDir}/${shpFilename} >${devnull} 2>&1

# loop through the .tiff files and convert to .jpg
tiles=()
for f in ${destDir}/*_tile_*_*.tif; do
  jpg="${f%.*}.jpg"
  # output and error piped to /dev/null
  gdal_translate -of JPEG -co worldfile=yes ${f} ${jpg} >${devnull} 2>&1
  tiles+=(${parentDir}/${filename}/$(basename -- "${jpg}"))
done

# change .tif to .jpg into the .geojson
sed -i 's/\.tif/\.jpg/g' ${destDir}/${geojsonFilename}

# remove unecessary files
_clean

if [ ${#tiles[@]} -eq 0 ]; then exit 0; fi

# output the list of new images with path
for tile in "${tiles[@]}"; do
  echo $tile
done

if [[ "${imgFilename##*.,,}" =~ "jpeg"|"jpg" ]]; then
  [[ ! -z $(_testGeoJPEGExif) ]] || exit 1
elif [[ "${imgFilename##*.,,}" =~ "tif"|"tiff" ]]; then
  [[ ! -z $(_testGeoTiffExif) ]] || exit 1
fi

# trigger the script to create the geolocalized geojson and tiles/images and used by mapserver.
# in the future that script should be the only one and openlayer in the annotation interface should support geolocalized geojson
# avoid output to nohup.out file with > /dev/null 2>&1
# run in the background and exit current script. The script gdalogr_createtiles_geotiff.sh will run in the background
[ ${DEBUG} = true ] && gdalogr_createtiles_geotiff.sh "$1" "$2" "$3" "$4" true || nohup gdalogr_createtiles_geotiff.sh "$1" "$2" "$3" "$4" false >/dev/null 2>&1 &

# assume always good, no errors
exit 1
