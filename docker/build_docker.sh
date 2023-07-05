#!/bin/bash
set -ex

git checkout -f

# aide_env=lefoai
# tag=v3.0.0b20230615T1610EST
# tag=v3.0-for-ivado-multienv
# volume=aidev3
aide_env=$1
tag=$2
volume=$3

git checkout ${tag}
git pull

rm docker-compose.yml
mv docker-compose@${aide_env}.yml docker-compose.yml
rm Dockerfile
mv Dockerfile@${aide_env} Dockerfile

AIDE_VERSION=${tag} AIDE_ENV=${aide_env} VOLUME_VERSION=${volume} sudo -E docker compose -f docker-compose.yml build

# reset all changes to avoid pb next time to pull
git checkout -f
