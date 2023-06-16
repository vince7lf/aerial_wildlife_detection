#!/bin/bash
set -ex

git checkout -f

# aide_env=lefoai
# tag=v3.0.0b20230615T1610EST
aide_env=$1
tag=$2

git checkout ${tag}

rm docker-compose.yml
mv docker-compose@${aide_env}.yml docker-compose.yml
rm Dockerfile
mv Dockerfile@${aide_env} Dockerfile

AIDE_VERSION=${tag} AIDE_ENV=${aide_env} sudo -E docker compose -f docker-compose.yml build

# reset all changes to avoid pb next time to pull
git checkout -f
