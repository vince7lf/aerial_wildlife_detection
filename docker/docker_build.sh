#!/bin/bash
set -ex

DEFAULT_BRANCH=v3.0-for-ivado-multienv
LATEST_TAG=latest

# rebuild all or use the cache
nocache=$1

git pull origin ${DEFAULT_BRANCH}
git checkout -f ${DEFAULT_BRANCH}
git pull

git fetch --all --tags --force

# aide_env=lefoai
# tag=v3.0.0b20230615T1610EST
# tag=v3.0-for-ivado-multienv
# volume=aidev3
# proxy=http://mandataire.ti.umontreal.ca:80/

# checkout latest tag
git branch -D tmpb_${LATEST_TAG} || true
git checkout tags/${LATEST_TAG} -b tmpb_${LATEST_TAG}

# read versions.txt
source ../versions.txt
echo ${DOCKER_AIDE_APP_VERSION}
echo ${DOCKER_AIDE_VOLUME_VERSION}

# delete and checkout version
git branch -D tmpb_${DOCKER_AIDE_APP_VERSION} || true
git checkout tags/${DOCKER_AIDE_APP_VERSION} -b tmpb_${DOCKER_AIDE_APP_VERSION}

# untag images with latest tag
sudo docker rmi aidev3_app:aide_${LATEST_TAG} || true

# docker build image
# DOCKER_AIDE_APP_VERSION=${tag} AIDE_ENV=${aide_env} VOLUME_VERSION=${volume} sudo -E docker compose -f docker-compose.yml build
DOCKER_AIDE_APP_VERSION=${DOCKER_AIDE_APP_VERSION} \
  AIDE_ENV=${AIDE_ENV} \
  sudo -E docker build \
  --tag=aidev3_app:aide_${DOCKER_AIDE_APP_VERSION} \
  --tag=aidev3_app:aide_${LATEST_TAG} \
  --rm \
  ${nocache} \
  --build-arg HTTP_PROXY=${HTTP_PROXY} \
  --build-arg HTTPS_PROXY=${HTTPS_PROXY} \
  --file Dockerfile@${AIDE_ENV} \
  ..

sudo docker image prune --force

# reset and clean
git pull origin ${DEFAULT_BRANCH}
git checkout -f ${DEFAULT_BRANCH}
git pull
git branch -D tmpb_${DOCKER_AIDE_APP_VERSION} || true
git branch -D tmpb_${LATEST_TAG} || true
