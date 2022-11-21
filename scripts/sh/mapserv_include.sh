#!/bin/bash

# how-to run the script
# bash ./scripts/sh/mapserv_include.sh 2019-Boucherville-13225474-13410695_JPEG_tile.jpg /app/tests/images/test-jpg-gps-1/1imageJPEG 1imageJPEG true

# this script is a part of a proof of concept, and assume things work as expected.
# It should not be the way to do, and not used in production and by operations.
# no logging and no error management.

# -x to exit immediately when an error occurred
# -e to display more information
# set -ex
# set echo off
DEBUG=$5
devnull=/dev/null
[ ${DEBUG} = true ] && set -ex

# imgFilename='test_266_tile.jpg'
# srcDir='/tmp/test/gdal'
imgFilename=$1
srcDir=$2
parentDir=$3
project=$4
filename="${imgFilename%.*}"
destDir="${project}/${parentDir}/${filename}"
msGeojsonFilename="${filename}.ms.geojson"

mapservFolder="/home/aide/app/mapserv"
aideMapfile="${mapservFolder}/aide.map"
templateLayerMapfile="${mapservFolder}/layer_template.map"
layerMapfileDest=${mapservFolder}/${destDir}
layerMapfile="${layerMapfileDest}/${filename}.map"
# create the layer's map file using the template in ./mapserv/layer_template.map, save it into /app/mapserv/<project_name>/<image_folder_name>/<image_name>/<image_name>.map (same path as the ms.geojson in the /app/images folder, replace '/app/images' by '/app/mapserv'

# create destination folder for the layer map file
mkdir -p ${layerMapfileDest}
# copy template layer map file into destination folder using the image name
cp -fap ${templateLayerMapfile} ${layerMapfile}

# replace the directives:
# @LAYER_NAME <image_name>
sed -i "s/^  @LAYER_NAME$/  NAME \"layer-${filename}\"/" ${layerMapfile}
# @LAYER_CONNECTION "<project_name>/<image_folder_name>/<image_name>/<image_name>.ms.geojson
sed -i "s/^  @LAYER_CONNECTION$/  CONNECTION \"${destDir//\//\\/}\/${msGeojsonFilename//\//\\/}\"/" ${layerMapfile}
# @LAYER_DATA <image_name>.ms
sed -i "s/^  @LAYER_DATA$/  DATA \"${filename}.ms\"/" ${layerMapfile}
# @LAYER_METADATA_WFS_TITLE <image_name>.ms
sed -i "s/^    @LAYER_METADATA_WFS_TITLE$/    \"wfs_title\" \"${filename}\"/" ${layerMapfile}
# @LAYER_METADATA_WFS_EXTENT get the extent lat lon of the geojson using gdal
# sed -i "s/^    @LAYER_METADATA_WFS_EXTENT$/    \"wfs_extent\" \"-73.46665 45.626178 -73.46664 45.626179\"/" ${layerMapfile}
sed -i "s/^    @LAYER_METADATA_WFS_EXTENT$/    \"wfs_extent\" \"-77.1356416416588502 44.8246057661527431 -67.1366446378126511 49.4040720519291412\"/" ${layerMapfile}

# add the INCLUDE directive into the main aide.map file
# INCLUDE "./<project_name>/<image_folder_name>/<image_name>.map"
# add the layer map reference into the main /app/mapserv/aide.map file if not already there
grep -q "./${destDir}\/${filename}.map" "${aideMapfile}" || sed -i "0,/^  # @INCLUDE$/s//  INCLUDE \".\/${destDir//\//\\/}\/${filename}.map\"/" ${aideMapfile}
# insert a new line with # @INCLUDE for the next time need INCLUDE if not already there
grep -q "  # @INCLUDE" "${aideMapfile}" || sed -i "/^END$/i\ \ # @INCLUDE" ${aideMapfile}
