#!/usr/bin/env bash

set -ex

# read versions.txt
source ../versions.txt
echo ${AIDE_VERSION}
echo ${DOCKER_VOLUME_VERSION}

docker volume ls | grep -q ${DOCKER_VOLUME_VERSION}_images || docker volume create ${DOCKER_VOLUME_VERSION}_images
docker volume ls | grep -q ${DOCKER_VOLUME_VERSION}_db_data || docker volume create ${DOCKER_VOLUME_VERSION}_db_data

docker run --name ${DOCKER_VOLUME_VERSION}_cnt \
 --rm \
 -v `pwd`:/home/aide/app \
 -v ${DOCKER_VOLUME_VERSION}_db_data:/var/lib/postgresql/10/main \
 -v ${DOCKER_VOLUME_VERSION}_images:/home/aide/images \
 -p 8080:8080 \
 -p 17685:17685 \
 -h "aide_host_${AIDE_VERSION}" \
 -e AIDE_ENV=${AIDE_ENV} \
 -e AIDE_VERSION=${AIDE_VERSION} \
 -e VOLUME_VERSION=${DOCKER_VOLUME_VERSION} \
 aidev3_app:aide_${AIDE_VERSION}


 # Options:
 # --name   - container name
 # --gpus   - sets GPU configuration
 # --rm     - forces container removal on close (it doesn't affect volumes)
 # -v       - maps volume (note: aide_db_data and aide_images needs to be created before this script is executed)
 # -p       - maps ports
 # -h       - sets hostname (fixed hostname is required for some internal components)
