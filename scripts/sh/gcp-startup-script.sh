## Important ! Please note that Chrome is caching; test using incognito browser

#! /bin/bash
cd /app/aerial_wildlife_detection/docker
sudo service docker stop
sudo service docker start
git checkout AIDE+MELCC-1.7
AIDE_ENV=dev sudo -E docker-compose build
AIDE_ENV=gcp sudo -E docker-compose up &
