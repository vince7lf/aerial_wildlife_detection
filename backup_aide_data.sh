#!/bin/bash
set -x

echo "|`date +%Y%m%dT%H%M%S`|Started|"

sudo -u postgres pg_dump -Fc -d ailabeltooldb \
  > /home/aide/app/backup/tes2-graham-ailabeltooldb-`date +%Y%m%dT%H%M%S`.dump 2>&1 \
  | tee /var/log/backup_aide_data.sh-$(date +%Y%m%dT%H%M%S).log

echo "|`date +%Y%m%dT%H%M%S`|Completed|"

