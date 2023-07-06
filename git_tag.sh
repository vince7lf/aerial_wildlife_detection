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
git tag push --delete origin ${AIDE_VERSION}
# remove tag latest remote
git tag push --delete origin latest

# create tag
git tag ${AIDE_VERSION}
# create tag latest
git tag latest

# push tag to remote
git push origin ${AIDE_VERSION}
git push origin latest