#!/bin/bash
set -ex

git checkout -f

# aide_env=lefoai
# tag=v3.0.0b20230615T1610EST
# tag=v3.0-for-ivado-multienv
# tag=latest
# volume=aidev3
# proxy=http://mandataire.ti.umontreal.ca:80/
aide_env=$1
tag=$2
volume=$3
proxy=$4

git checkout ${tag}
git pull

# AIDE_VERSION=${tag} AIDE_ENV=${aide_env} VOLUME_VERSION=${volume} sudo -E docker compose -f docker-compose.yml build
AIDE_VERSION=${tag} \
  AIDE_ENV=${aide_env} \
  VOLUME_VERSION=${volume} \
  sudo -E docker build \
  --tag=aidev3_app:${tag}
  --rm \
  --no-cache \
  --build-arg HTTP_PROXY=${proxy} \
  --build-arg HTTPS_PROXY=${proxy} \
  --file Dockerfile@${aide_env} \
  ..