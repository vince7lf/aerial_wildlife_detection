#! /bin/bash
cd /app/aerial_wildlife_detection/docker
sudo service docker stop
sudo service docker start
git checkout AIDE+MELCC-1.7
sudo docker-compose build
sudo docker-compose up &
