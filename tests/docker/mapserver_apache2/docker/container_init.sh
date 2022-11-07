#!/bin/bash
set -x

echo ${PYTHONPATH}
echo ${AIDE_CONFIG_PATH}
echo ${AIDE_MODULES}
echo ${AIDE_ENV}

sudo cp -fap /home/aide/app/docker/settings@${AIDE_ENV}.ini ${AIDE_CONFIG_PATH}

sudo systemctl enable apache2.service
sudo service apache2 start

sysctl -p
