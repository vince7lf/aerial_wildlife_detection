#!/bin/bash
set -ex

# read docker_versions.sh
source docker/docker_versions.sh
echo ${DOCKER_AIDE_APP_VERSION}
echo ${DOCKER_AIDE_VOLUME_VERSION}

# remove tag local
git tag -d ${DOCKER_AIDE_APP_VERSION} || true
# remove tag latest local
git tag -d latest || true

# remove tag remote
git push --delete origin ${DOCKER_AIDE_APP_VERSION} || true
# remove tag latest remote
git push --delete origin latest || true

# create tag
git tag ${DOCKER_AIDE_APP_VERSION}
# create tag latest
git tag latest

# push tag to remote
git push origin ${DOCKER_AIDE_APP_VERSION}
git push origin latest