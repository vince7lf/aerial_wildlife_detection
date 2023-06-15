#!/bin/bash
set -ex

sudo -u postgres pg_dump -Fc -d ${AIDE_DB} > /home/aide/app/backup/${AIDE_ENV}-${AIDE_VERSION}-${AIDE_DB}-`date +%Y%m%dT%H%M%S`.dump