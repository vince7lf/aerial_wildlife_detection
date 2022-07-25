#!/bin/bash
gdalogr_createtiles.sh $1 $2 $3 2>&1 | tee /tmp/gdalogr_createtiles.sh.log