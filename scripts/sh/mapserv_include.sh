#!/bin/bash

# how-to run the script
# mapserv_include.sh 2019-Boucherville-13225474-13410695_tile.jpg /mnt/c/Users/User/Downloads/AIDE+MELCC/presence_AIDE/test /mnt/c/Users/User/Downloads/AIDE+MELCC/presence_AIDE/test > /dev/null 2>&1

# this script is a part of a proof of concept, and assume things work as expected.
# It should not be the way to do, and not used in production and by operations.
# no logging and no error management.

# -x to exit immediately when an error occurred
# -e to display more information
# set -ex
# set echo off
DEBUG=$4
devnull=/dev/null
[ ${DEBUG} = true ] && set -xe

# imgFilename='test_266_tile.jpg'
# srcDir='/tmp/test/gdal'
imgFilename=$1
srcDir=$2
parentDir=$3
filename="${imgFilename%.*}"
destDir="${srcDir}/${filename}"
msGeojsonFilename="${filename}.ms.geojson"

mapservFolder="/app/mapserv"
aideMapfile="${mapservFolder}/aide.map"
templateLayerMapfile="${mapservFolder}/layer_template.map"
layerMapfileDest=${mapservFolder}/${srcDir}/${filename}
layerMapfile="${layerMapfileDest}/${filename}.map"
# create the layer's map file using the template in ./mapserv/layer_template.map, save it into /app/mapserv/<project_name>/<image_folder_name>/<image_name>/<image_name>.map (same path as the ms.geojson in the /app/images folder, replace '/app/images' by '/app/mapserv'

# create destination folder for the layer map file
mkdir -p ${layerMapfileDest}
# copy template layer map file into destination folder using the image name
cp -fap ${templateLayerMapfile} ${layerMapfile}

# replace the directives:
# @LAYER_NAME <image_name>
sudo sed -i "s/^  @LAYER_NAME$/  NAME \"${filename}\"/" ${layerMapfile}
# @LAYER_CONNECTION "<project_name>/<image_folder_name>/<image_name>/<image_name>.ms.geojson
sudo sed -i "s/^  @LAYER_CONNECTION$/  CONNECTION \"${destDir//\//\\/}\/${msGeojsonFilename//\//\\/}\"/" ${layerMapfile}
# @LAYER_DATA <image_name>.ms
sudo sed -i "s/^  @LAYER_DATA$/  DATA \"${filename}.ms\"/" ${layerMapfile}
# @LAYER_METADATA_WFS_TITLE <image_name>.ms
sudo sed -i "s/^    @LAYER_METADATA_WFS_TITLE$/    \"wfs_title\" \"${filename}\"/" ${layerMapfile}
# @LAYER_METADATA_WFS_EXTENT get the extent lat lon of the geojson using gdal
sudo sed -i "s/^    @LAYER_METADATA_WFS_EXTENT$/    \"wfs_extent\" \"-73.46665 45.626178 -73.46664 45.626179\"/" ${layerMapfile}

# add a reference into the main /app/mapserv/aide.map file
# INCLUDE "./<project_name>/<image_folder_name>/<image_name>.map"
sudo sed -i "/^  # @INCLUDE$/a\ \ # @INCLUDE" ${aideMapfile}
# add if not already there
[ grep -q "./${srcDir}\/${filename}/${filename}.map" "${aideMapfile}" ] || sudo sed -i "0,/^  # @INCLUDE$/s//  INCLUDE \".\/${srcDir//\//\\/}\/${filename//\//\\/}\/${filename}.map\"/" ${aideMapfile}
# insert a new line with # @INCLUDE for the next time need INCLUDE
# TODO

# [ ${DEBUG} = true ] && mapserv_include.sh "$1" "$2" "$3" true || nohup gdalogr_createtiles_geotiff.sh "$1" "$2" "$3" true >/dev/null 2>&1 &
