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
sudo chmod +x /usr/local/bin/gdalogr_createtiles*.sh
sudo cp /tmp/pycharm_remote_debug_hpelitebook850g3/scripts/sh/mapserv_include.sh /usr/local/bin
sudo chmod +x /usr/local/bin/mapserv_include.sh

script=/usr/local/bin/gdalogr_createtiles.sh

# tests
geotiff=(2019-Boucherville-13225474-13410695_tile.tiff /app/tests/images/test-geotiff)
# sudo /usr/local/bin/gdalogr_createtiles.sh nogpsinfo_tile.jpg /app/tests/images/test-tiff-6/test-geotiff /app/tests/images/test-tiff-6/test-geotiff true
# sudo bash ${script} ${geotiff[0]} ${geotiff[1]} ${geotiff[1]} true

# -----------------------------------------------------------------------------
_test_jpg_nogps() {
  echo -e "${GREEN}${FUNCNAME[0]}${NC}"
  extension="jpg"
  [[ ! -z $1 && $1 = 'JPG' ]] && extension='JPG'
  [[ ! -z $1 && $1 = 'JPEG' ]] && extension='JPEG'
  repo=(nogpsinfo_tile.${extension} /app/tests/images/test-${extension}-nogps/test-${extension} test-${extension} test-${extension}-nogps)
  filename="${repo[0]%.*}"
  sudo rm -rf "${repo[1]}/${filename}/"
  sudo rm -rf "${repo[1]}/*.tif*"
  sudo rm -rf "${repo[1]}/*.jpg.aux.xml"
  sudo rm -rf "${repo[1]}/*.wld"
  sudo rm -rf "${repo[1]}/*.jgw"
  sudo bash ${script} ${repo[0]} ${repo[1]} ${repo[2] ${repo[3]} ${DEBUG}
  [[ -f "${repo[1]}/${filename}.jpg.aux.xml" ]] && {
    echo -e "${RED}Failed${NC}"
    exit 0
  }
  [[ -f "${repo[1]}/${filename}.wld" ]] && {
    echo -e "${RED}Failed${NC}"
    exit 0
  }
  [[ -f "${repo[1]}/${filename}.jgw" ]] && {
    echo -e "${RED}Failed${NC}"
    exit 0
  }
  [[ -f "${repo[1]}/${filename}.tif" ]] && {
    echo -e "${RED}Failed${NC}"
    exit 0
  }
  [[ ! -d "${repo[1]}/${filename}" ]] && {
    echo -e "${RED}Failed${NC}"
    exit 0
  }
  [[ ! -f "${repo[1]}/${filename}/${filename}.jpg" ]] && {
    echo -e "${RED}Failed${NC}"
    exit 0
  }
  [[ ! $(ls -1 ${repo[1]}/${filename}/${filename}_*.jpg 2>/dev/null | wc -l) -gt 0 ]] && {
    echo -e "${RED}Failed${NC}"
    exit 0
  }
  [[ $(ls -1 ${repo[1]}/${filename}/${filename}_*.tif 2>/dev/null | wc -l) -gt 0 ]] && {
    echo -e "${RED}Failed${NC}"
    exit 0
  }
  [[ ! -f "${repo[1]}/${filename}/${filename}.geojson" ]] && {
    echo -e "${RED}Failed${NC}"
    exit 0
  }
  if ! grep -q "\"coordinates\".*0\.0, 0\.0.*128\.0, 0\.0.*128\.0, -128\.0.*0\.0, -128\.0.*0\.0, 0\.0" "${repo[1]}/${filename}/${filename}.geojson"; then {
    echo -e "${RED}Failed${NC}"
    exit 0
  }; fi
  [[ -f "${repo[1]}/${filename}/${filename}.ms.template.geojson" ]] && {
    echo -e "${RED}Failed${NC}"
    exit 0
  }
  echo -e "${GREEN}Successful${NC}"
}

# -----------------------------------------------------------------------------
_test_jpg_gps() {
  echo -e "${GREEN}${FUNCNAME[0]}${NC}"
  repo=(2019-Boucherville-13225474-13410695_tile.jpg /app/tests/images/test-geojpg test-geojpg .)
  filename="${repo[0]%.*}"
  sudo rm -rf "${repo[1]}/${filename}/"
  sudo rm -rf "${repo[1]}/*.tif*"
  sudo rm -rf "${repo[1]}/*.jpg.aux.xml"
  sudo rm -rf "${repo[1]}/*.wld"
  sudo rm -rf "${repo[1]}/*.jgw"
  sudo bash ${script} ${repo[0]} ${repo[1]} ${repo[2] ${repo[3]} ${DEBUG}
  while [[ $(pgrep -x gdalogr_createtile_geotiff.sh >/dev/null) ]]; do
    echo "running; waiting 1 sec"
    sleep 1
  done

  sleep 7

  [[ -f "${repo[1]}/${filename}.jpg.aux.xml" ]] && {
    echo -e "${RED}Failed${NC}"
    exit 0
  }
  [[ -f "${repo[1]}/${filename}.wld" ]] && {
    echo -e "${RED}Failed${NC}"
    exit 0
  }
  [[ -f "${repo[1]}/${filename}.jgw" ]] && {
    echo -e "${RED}Failed${NC}"
    exit 0
  }
  [[ -f "${repo[1]}/${filename}.tif" ]] && {
    echo -e "${RED}Failed${NC}"
    exit 0
  }
  [[ ! -d "${repo[1]}/${filename}" ]] && {
    echo -e "${RED}Failed${NC}"
    exit 0
  }
  [[ ! -f "${repo[1]}/${filename}/${filename}.jpg" ]] && {
    echo -e "${RED}Failed${NC}"
    exit 0
  }
  [[ ! $(ls -1 ${repo[1]}/${filename}/${filename}_*.jpg 2>/dev/null | wc -l) -gt 0 ]] && {
    echo -e "${RED}Failed${NC}"
    exit 0
  }
  [[ ! -f "${repo[1]}/${filename}/${filename}.wld" ]] && {
    echo -e "${RED}Failed${NC}"
    exit 0
  }
  [[ ! $(ls -1 ${repo[1]}/${filename}/${filename}_*.wld 2>/dev/null | wc -l) -gt 0 ]] && {
    echo -e "${RED}Failed${NC}"
    exit 0
  }
  [[ ! -f "${repo[1]}/${filename}/${filename}.jgw" ]] && {
    echo -e "${RED}Failed${NC}"
    exit 0
  }
  [[ ! $(ls -1 ${repo[1]}/${filename}/${filename}_*.tif 2>/dev/null | wc -l) -gt 0 ]] && {
    echo -e "${RED}Failed${NC}"
    exit 0
  }
  [[ ! -f "${repo[1]}/${filename}/${filename}.geojson" ]] && {
    echo -e "${RED}Failed${NC}"
    exit 0
  }
  if ! grep -q "\"coordinates\".*0\.0, 0\.0.*128\.0, 0\.0.*128\.0, -128\.0.*0\.0, -128\.0.*0\.0, 0\.0" "${repo[1]}/${filename}/${filename}.geojson"; then {
    echo -e "${RED}Failed${NC}"
    exit 0
  }; fi
  [[ ! -f "${repo[1]}/${filename}/${filename}.ms.template.geojson" ]] && {
    echo -e "${RED}Failed${NC}"
    exit 0
  }
  if ! grep -q "\"coordinates\".*-73.*45.*-73.*45.*-73.*45.*-73.*45.*-73.*45" "${repo[1]}/${filename}/${filename}.ms.template.geojson"; then {
    echo -e "${RED}Failed${NC}"
    exit 0
  }; fi
  echo -e "${GREEN}Successful${NC}"
}

# -----------------------------------------------------------------------------
_test_tiff_notgeo() {
  echo -e "${GREEN}${FUNCNAME[0]}${NC}"
  extension="tif"
  [[ ! -z $1 && $1 = 'TIF' ]] && extension='TIF'
  [[ ! -z $1 && $1 = 'TIFF' ]] && extension='TIFF'
  repo=(test_notgeotiff_tile.${extension} /app/tests/images/test-${extension}-10/test-${extension} test-${extension} test-${extension}-10)
  filename="${repo[0]%.*}"
  sudo rm -rf "${repo[1]}/${filename}/"
  sudo rm -rf "${repo[1]}/*.jpg"
  sudo rm -rf "${repo[1]}/*.jpg_original"
  sudo rm -rf "${repo[1]}/*.jpg.aux.xml"
  sudo rm -rf "${repo[1]}/*.wld"
  sudo rm -rf "${repo[1]}/*.jgw"
  sudo bash ${script} ${repo[0]} ${repo[1]} ${repo[2] ${repo[3]} ${DEBUG}
  [[ -f "${repo[1]}/${filename}.jpg.aux.xml" ]] && {
    echo -e "${RED}Failed${NC}"
    exit 0
  }
  [[ -f "${repo[1]}/${filename}.wld" ]] && {
    echo -e "${RED}Failed${NC}"
    exit 0
  }
  [[ -f "${repo[1]}/${filename}.jgw" ]] && {
    echo -e "${RED}Failed${NC}"
    exit 0
  }
  [[ ! -d "${repo[1]}/${filename}" ]] && {
    echo -e "${RED}Failed${NC}"
    exit 0
  }
  [[ ! -f "${repo[1]}/${filename}/${filename}.jpg" ]] && {
    echo -e "${RED}Failed${NC}"
    exit 0
  }
  [[ -f "${repo[1]}/${filename}/${filename}.tif" ]] && {
    echo -e "${RED}Failed${NC}"
    exit 0
  }
  [[ ! $(ls -1 ${repo[1]}/${filename}/${filename}_*.jpg 2>/dev/null | wc -l) -gt 0 ]] && {
    echo -e "${RED}Failed${NC}"
    exit 0
  }
  [[ $(ls -1 ${repo[1]}/${filename}/${filename}_*.tif 2>/dev/null | wc -l) -gt 0 ]] && {
    echo -e "${RED}Failed${NC}"
    exit 0
  }
  [[ ! -f "${repo[1]}/${filename}/${filename}.geojson" ]] && {
    echo -e "${RED}Failed${NC}"
    exit 0
  }
  if ! grep -q "\"coordinates\".*0\.0, 0\.0.*128\.0, 0\.0.*128\.0, -128\.0.*0\.0, -128\.0.*0\.0, 0\.0" "${repo[1]}/${filename}/${filename}.geojson"; then {
    echo -e "${RED}Failed${NC}"
    exit 0
  }; fi
  [[ -f "${repo[1]}/${filename}/${filename}.ms.template.geojson" ]] && {
    echo -e "${RED}Failed${NC}"
    exit 0
  }
  echo -e "${GREEN}Successful${NC}"
}

# -----------------------------------------------------------------------------
_test_geotiff() {
  echo -e "${GREEN}${FUNCNAME[0]}${NC}"
  repo=(2019-Boucherville-13225474-13410695_tile.tiff /app/tests/images/test-geotiff-9/test-geotiff test-geotiff test-geotiff-9)
  filename="${repo[0]%.*}"
  sudo rm -rf "${repo[1]}/${filename}/"
  sudo rm -rf "${repo[1]}/*.jpg"
  sudo rm -rf "${repo[1]}/*.jpg.aux.xml"
  sudo rm -rf "${repo[1]}/*.wld"
  sudo rm -rf "${repo[1]}/*.jgw"
  sudo bash ${script} ${repo[0]} ${repo[1]} ${repo[2] ${repo[3]} false
  while [[ $(pgrep -x gdalogr_createtile_geotiff.sh >/dev/null) ]]; do
    echo "running; waiting 1 sec"
    sleep 1
  done

  sleep 7

  [[ ! -f "${repo[1]}/${filename}.jpg" ]] && {
    echo -e "${RED}Failed${NC}"
    exit 0
  }
  [[ ! -f "${repo[1]}/${filename}.tiff" ]] && {
    echo -e "${RED}Failed${NC}"
    exit 0
  }
  [[ -f "${repo[1]}/${filename}.jpg.aux.xml" ]] && {
    echo -e "${RED}Failed${NC}"
    exit 0
  }
  [[ -f "${repo[1]}/${filename}.wld" ]] && {
    echo -e "${RED}Failed${NC}"
    exit 0
  }
  [[ -f "${repo[1]}/${filename}.jgw" ]] && {
    echo -e "${RED}Failed${NC}"
    exit 0
  }
  [[ ! -d "${repo[1]}/${filename}" ]] && {
    echo -e "${RED}Failed${NC}"
    exit 0
  }
  [[ ! -f "${repo[1]}/${filename}/${filename}.jpg" ]] && {
    echo -e "${RED}Failed${NC}"
    exit 0
  }
  [[ ! $(ls -1 ${repo[1]}/${filename}/${filename}_*.jpg 2>/dev/null | wc -l) -gt 0 ]] && {
    echo -e "${RED}Failed${NC}"
    exit 0
  }
  [[ ! -f "${repo[1]}/${filename}/${filename}.wld" ]] && {
    echo -e "${RED}Failed${NC}"
    exit 0
  }
  [[ ! $(ls -1 ${repo[1]}/${filename}/${filename}_*.wld 2>/dev/null | wc -l) -gt 0 ]] && {
    echo -e "${RED}Failed${NC}"
    exit 0
  }
  [[ ! -f "${repo[1]}/${filename}/${filename}.tiff" ]] && {
    echo -e "${RED}Failed${NC}"
    exit 0
  }
  [[ ! $(ls -1 ${repo[1]}/${filename}/${filename}_*.tif 2>/dev/null | wc -l) -gt 0 ]] && {
    echo -e "${RED}Failed${NC}"
    exit 0
  }
  [[ ! -f "${repo[1]}/${filename}/${filename}.geojson" ]] && {
    echo -e "${RED}Failed${NC}"
    exit 0
  }
  if ! grep -q "\"coordinates\".*0\.0, 0\.0.*128\.0, 0\.0.*128\.0, -128\.0.*0\.0, -128\.0.*0\.0, 0\.0" "${repo[1]}/${filename}/${filename}.geojson"; then {
    echo -e "${RED}Failed${NC}"
    exit 0
  }; fi
  [[ ! -f "${repo[1]}/${filename}/${filename}.ms.template.geojson" ]] && {
    echo -e "${RED}Failed${NC}"
    exit 0
  }
  if ! grep -q "\"coordinates\".*-73.*45.*-73.*45.*-73.*45.*-73.*45.*-73.*45" "${repo[1]}/${filename}/${filename}.ms.template.geojson"; then {
    echo -e "${RED}Failed${NC}"
    exit 0
  }; fi
  echo -e "${GREEN}Successful${NC}"
}

_test_jpg_nogps
_test_jpg_nogps JPG
_test_jpg_nogps JPEG
_test_jpg_gps
_test_tiff_notgeo
_test_tiff_notgeo TIF
_test_tiff_notgeo TIFF
_test_geotiff
