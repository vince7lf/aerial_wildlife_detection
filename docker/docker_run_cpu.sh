docker volume ls | grep -q aidev3_images || docker volume create aidev3_images
docker volume ls | grep -q aidev3_db_data || docker volume create aidev3_db_data

docker run --name aidev3_cnt \
 --rm \
 -v `pwd`:/home/aide/app \
 -v aidev3_db_data:/var/lib/postgresql/10/main \
 -v aidev3_images:/home/aide/images \
 -p 8080:8080 \
 -h 'aidev3_app_host' \
 aidev3_app:aide_latest

 # Options:
 # --name   - container name
 # --gpus   - sets GPU configuration
 # --rm     - forces container removal on close (it doesn't affect volumes)
 # -v       - maps volume (note: aide_db_data and aide_images needs to be created before this script is executed)
 # -p       - maps ports
 # -h       - sets hostname (fixed hostname is required for some internal components)
