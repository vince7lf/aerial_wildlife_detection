#!/bin/bash

# how-to run the script
# sudo bash /tmp/pycharm_remote_debug_hpelitebook850g3/tests/sh/test_gdalogr_createtile.sh true

# x test jpg-nogps
#  test geojpg
#  test tif-notgeo
#
#  test jpeg
#  test JPEG
#  test jpg
#  test JPG
#  test tiff
#  test TIFF
#  test tif
#  test TIF

# ANSI Escape code ref <https://en.wikipedia.org/wiki/ANSI_escape_code>
#Black        0;30     Dark Gray     1;30
#Red          0;31     Light Red     1;31
#Green        0;32     Light Green   1;32
#Brown/Orange 0;33     Yellow        1;33
#Blue         0;34     Light Blue    1;34
#Purple       0;35     Light Purple  1;35
#Cyan         0;36     Light Cyan    1;36
#Light Gray   0;37     White         1;37

DEBUG=$1
[ "$DEBUG" = true ] && set -x

#set -x
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# make sure that the latest scripts are  being used
sudo cp /tmp/pycharm_remote_debug_hpelitebook850g3/scripts/sh/gdalogr_createtiles*.sh /usr/local/bin

script=/usr/local/bin/gdalogr_createtiles.sh

# tests
geotiff=(2019-Boucherville-13225474-13410695_tile.tiff /app/tests/images/test-geotiff)
# sudo /usr/local/bin/gdalogr_createtiles.sh nogpsinfo_tile.jpg /app/tests/images/test-tiff-6/test-geotiff /app/tests/images/test-tiff-6/test-geotiff true
# sudo bash ${script} ${geotiff[0]} ${geotiff[1]} ${geotiff[1]} true

_test_jpg_nogps()
{
  echo -e "${GREEN}${FUNCNAME[0]}${NC}"
  jpg_nogps=(nogpsinfo_tile.jpg /app/tests/images/test-jpg-nogps/test-jpg)
  filename="${jpg_nogps[0]%.*}"
  sudo rm -rf "${jpg_nogps[1]}/${filename}/"
  sudo rm -rf "${jpg_nogps[1]}/*.tif*"
  sudo rm -rf "${jpg_nogps[1]}/*.jpg.aux.xml"
  sudo rm -rf "${jpg_nogps[1]}/*.wld"
  sudo rm -rf "${jpg_nogps[1]}/*.jgw"
  sudo bash ${script} ${jpg_nogps[0]} ${jpg_nogps[1]} ${jpg_nogps[1]} false
  [[ -f "${jpg_nogps[1]}/${filename}.jpg.aux.xml" ]] && {
    echo -e "${RED}Failed${NC}"
    exit 0
  }
  [[ -f "${jpg_nogps[1]}/${filename}.wld" ]] && {
    echo -e "${RED}Failed${NC}"
    exit 0
  }
  [[ -f "${jpg_nogps[1]}/${filename}.jgw" ]] && {
    echo -e "${RED}Failed${NC}"
    exit 0
  }
  [[ -f "${jpg_nogps[1]}/${filename}.tif*" ]] && {
    echo -e "${RED}Failed${NC}"
    exit 0
  }
  [[ ! -d "${jpg_nogps[1]}/${filename}" ]] && {
    echo -e "${RED}Failed${NC}"
    exit 0
  }
  [[ ! -f "${jpg_nogps[1]}/${filename}/${filename}.geojson" ]] && {
    echo -e "${RED}Failed${NC}"
    exit 0
  }
  if ! grep -q "\"coordinates\".*0\.0, 0\.0.*128\.0, 0\.0.*128\.0, -128\.0.*0\.0, -128\.0.*0\.0, 0\.0" "${jpg_nogps[1]}/${filename}/${filename}.geojson"; then {
    echo -e "${RED}Failed${NC}"
    exit 0
  }; fi
  [[ -f "${jpg_nogps[1]}/${filename}/${filename}.ms.geojson" ]] && {
    echo -e "${RED}Failed${NC}"
    exit 0
  }
  [[ -f "${jpg_nogps[1]}/${filename}/${filename}_*.tif" ]] && {
    echo -e "${RED}Failed${NC}"
    exit 0
  }
  echo -e "${GREEN}Successful${NC}"
}

_test_jpg_nogps