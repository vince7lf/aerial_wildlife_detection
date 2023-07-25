#!/usr/bin/env bash

set -e

# stop currently running container, if running
docker container stop aidev3_cnt

# read docker_versions.sh
source docker/docker_versions.sh
echo AIDE_APP_VERSION=${AIDE_APP_VERSION}
echo DOCKER_AIDE_APP_VERSION=${DOCKER_AIDE_APP_VERSION}
echo DOCKER_AIDE_VOLUME_VERSION=${DOCKER_AIDE_VOLUME_VERSION}
echo AUTODEPLOY=${AUTODEPLOY}

docker volume ls | grep -q ${DOCKER_AIDE_VOLUME_VERSION}_images || docker volume create ${DOCKER_AIDE_VOLUME_VERSION}_images
docker volume ls | grep -q ${DOCKER_AIDE_VOLUME_VERSION}_db_data || docker volume create ${DOCKER_AIDE_VOLUME_VERSION}_db_data

docker run --name aidev3_cnt \
 --gpus device=0 \
 --rm \
 -v `pwd`:/home/aide/app \
 -v ${DOCKER_AIDE_VOLUME_VERSION}_db_data:/var/lib/postgresql/10/main \
 -v ${DOCKER_AIDE_VOLUME_VERSION}_images:/home/aide/images \
 -p 8080:8080 \
 -p 17586:17685 \
 -h "aidev3_host" \
 -e AIDE_ENV=${AIDE_ENV} \
 -e DOCKER_AIDE_APP_VERSION=${DOCKER_AIDE_APP_VERSION} \
 -e DOCKER_AIDE_VOLUME_VERSION=${DOCKER_AIDE_VOLUME_VERSION} \
 -e AIDE_APP_VERSION=${AIDE_APP_VERSION} \
 aidev3_app:aide_${DOCKER_AIDE_APP_VERSION}

 # Options:
 # --name   - container name
 # --gpus   - sets GPU configuration
 # --rm     - forces container removal on close (it doesn't affect volumes)
 # -v       - maps volume (note: aide_db_data and aide_images needs to be created before this script is executed)
 # -p       - maps ports
 # -h       - sets hostname (fixed hostname is required for some internal components)
 # -e       - set environment variables