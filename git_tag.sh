#!/bin/bash
set -ex

# read versions.txt
source versions.txt
echo ${AIDE_VERSION}
echo ${DOCKER_VOLUME_VERSION}

# remove tag local
git tag -d ${AIDE_VERSION} || true
# remove tag latest local
git tag -d latest || true

# remove tag remote
git push --delete origin ${AIDE_VERSION} || true
# remove tag latest remote
git push --delete origin latest || true

# create tag
git tag ${AIDE_VERSION}
# create tag latest
git tag latest

# push tag to remote
git push origin ${AIDE_VERSION}
git push origin latest