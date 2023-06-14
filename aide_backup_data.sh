#!/bin/bash
set -x

echo "|`date +%Y%m%dT%H%M%S`|Started|"

sudo -u postgres pg_dump -Fc -d aide \
  > /home/aide/app/backup/aide-`date +%Y%m%dT%H%M%S`.dump 2>&1 \
  | tee /var/log/aide_backup_data.sh-$(date +%Y%m%dT%H%M%S).log

echo "|`date +%Y%m%dT%H%M%S`|Completed|"

