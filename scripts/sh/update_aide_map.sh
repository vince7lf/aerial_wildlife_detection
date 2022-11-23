#!/bin/bash

# how-to run the script
# bash ./scripts/sh/update_aide_map.sh true

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

mapservFolder="/home/aide/app/mapserv"
aideMapfile="${mapservFolder}/aide.map"

schemas=$(sudo -u postgres psql -d ailabeltooldb -p 17685 -tc "select shortname from aide_admin.project;")
for schema in ${schemas}; do
    pushd ${mapservFolder}/${schema}
    map_files=$(find ./ -iname "*.map" -type f)
    for map_file in ${map_files}; do
      # add the INCLUDE directive into the main aide.map file
      # INCLUDE "./<project_name>/<image_folder_name>/<image_name>.map"
      # add the layer map reference into the main /app/mapserv/aide.map file if not already there
      grep -q "${map_file}" "${aideMapfile}" || sed -i "0,/^  # @INCLUDE$/s//  INCLUDE \"${map_file}\"/" ${aideMapfile}
      # insert a new line with # @INCLUDE for the next time need INCLUDE if not already there
      grep -q "  # @INCLUDE" "${aideMapfile}" || sed -i "/^END$/i\ \ # @INCLUDE" ${aideMapfile}
    done
    popd
done
