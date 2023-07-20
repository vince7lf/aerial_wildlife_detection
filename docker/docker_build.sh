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

# read docker_versions.sh
source docker_versions.sh
echo AIDE_APP_VERSION=${AIDE_APP_VERSION}
echo DOCKER_AIDE_APP_VERSION=${DOCKER_AIDE_APP_VERSION}
echo DOCKER_AIDE_VOLUME_VERSION=${DOCKER_AIDE_VOLUME_VERSION}
echo AUTODEPLOY=${AUTODEPLOY}

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

if [ ${AUTODEPLOY} = "true" ]; then
  pushd ..
  AIDE_ENV=${AIDE_ENV} \
  sudo -E \
  /bin/bash docker/docker_run_gpu.sh &
  popd
fi
# if autodeploy==true
# restart container with tag name

# to build docker on vbox-udem
# cd /app/aerial_wildlife_detection/docker; \
#   AIDE_ENV=vbox-udem \
#   sudo -E \
#   /bin/bash /app/aerial_wildlife_detection/docker/docker_build.sh 2>&1 | \
#   sudo tee /var/log/docker_build.sh-`date +%Y%m%dT%H%M%S`.log

# to run docker on vbox-udem
# ! make sure to have sudo password already set; commande just return without any error / feedback otherwise
# cd /app/aerial_wildlife_detection; \
#   AIDE_ENV=vbox-udem \
#   sudo -E \
#   /bin/bash docker/docker_run_cpu.sh &

# to build docker on lefoai with proxy
# cd /app/aerial_wildlife_detection/docker; \
#   AIDE_ENV=lefoai \
#   HTTP_PROXY=http://mandataire.ti.umontreal.ca:80/ \
#   HTTPS_PROXY=http://mandataire.ti.umontreal.ca:80/ \
#   sudo -E \
#   /bin/bash /app/aerial_wildlife_detection/docker/docker_build.sh 2>&1 | \
#   sudo tee /var/log/docker_build.sh-`date +%Y%m%dT%H%M%S`.log

# to run docker on lefoai

# to build docker on aidev3-vgpu
# cd /mnt/app/aerial_wildlife_detection/docker; \
#   AIDE_ENV=aidev3-vgpu \
#   sudo -E \
#   /bin/bash /mnt/app/aerial_wildlife_detection/docker/docker_build.sh 2>&1 | \
#   sudo tee /var/log/docker_build.sh-`date +%Y%m%dT%H%M%S`.log

# to run docker on aidev3-vgpu
# ! make sure to have sudo password already set; command just return without any error / feedback otherwise
# cd /mnt/app/aerial_wildlife_detection; \
#   AIDE_ENV=aidev3-vgpu \
#   sudo -E \
#   /bin/bash docker/docker_run_cpu.sh &
