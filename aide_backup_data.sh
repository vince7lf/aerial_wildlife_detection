#!/bin/bash
set -ex

sudo -u postgres pg_dump -Fc -d aidev3 > /home/aide/app/backup/${AIDE_ENV}-${AIDE_VERSION}-aidev3-`date +%Y%m%dT%H%M%S`.dump