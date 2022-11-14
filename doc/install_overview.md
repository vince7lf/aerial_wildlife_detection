# Installing AIDE

## Migration from AIDE v1
If you have [AIDE v1](https://github.com/microsoft/aerial_wildlife_detection/tree/v1) already running and want to upgrade its contents to AIDE v2, see [here](upgrade_from_v1.md).


## New installation

Arbutus : After a boot, mount manually the /app drive 

`sudo mount /dev/vdb1 /app`

### With Docker

Here's how to install and launch AIDE with Docker on the current machine:

1. Download and install [Docker](https://docs.docker.com/engine/install) as well as [Docker Compose](https://docs.docker.com/compose/install)
```
  snap install docker
  sudo apt-get remove docker-compose
  sudo curl -L "https://github.com/docker/compose/releases/download/1.23.2/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
  sudo chmod +x /usr/local/bin/docker-compose
  sudo ln -s /usr/local/bin/docker-compose /usr/bin/docker-compose
  
  # move docker to another drive if missing space in / mount
  sudo service docker stop
  sudo vi /etc/docker/daemon.json
  {
   "data-root": "/app/var/lib/docker"
  }
  sudo mkdir -p /app/var/lib/docker
  sudo rsync -aP /var/lib/docker/ /app/var/lib/docker
  sudo mv /var/lib/docker /var/lib/docker.old
  sudo service docker start
  
  # if an error still occurs with space (snapd) stop docker service and restart it (restart seems not to do the same job)
  # ERROR: Could not install packages due to an OSError: [Errno 28] No space left on device
```
3. If you want to use a GPU (and only then), you have to install the NVIDIA container toolkit:
```bash
    distribution=$(. /etc/os-release;echo $ID$VERSION_ID)
    curl -s -L https://nvidia.github.io/nvidia-docker/gpgkey | sudo apt-key add -
    curl -s -L https://nvidia.github.io/nvidia-docker/$distribution/nvidia-docker.list | sudo tee /etc/apt/sources.list.d/nvidia-docker.list
    sudo apt-get update && sudo apt-get install -y nvidia-container-toolkit
    sudo systemctl restart docker
```
3. Clone the AIDE repository: `git clone https://github.com/microsoft/aerial_wildlife_detection.git && cd aerial_wildlife_detection/`
4. **Important:** modify the `docker/settings.ini` file and replace the default super user credentials (section `[Project]`) with new values. Make sure to review and update the other default settings as well, if needed.
   5. Install:
       ```bash
           cd docker
           AIDE_ENV=dev sudo -E docker-compose build
           # or AIDE_ENV=dev sudo -E docker-compose build --no-cache to rebuild completely
           cd ..
       ```
6. Launch:
    * With Docker:
    ```bash
        sudo docker/docker_run_cpu.sh     # for machines without a GPU
        sudo docker/docker_run_gpu.sh     # for AIWorker instances with a CUDA-enabled GPU (strongly recommended for model training)
    ```
    * With Docker Compose (note that Docker Compose currently does not provide support for GPUs):
    ```bash
        cd docker
        AIDE_ENV=arbutus sudo -E docker-compose up &
    ```

7. To export as tar file
    ```bash
        sudo docker save -o aide_melcc.tar aide_app:latest
    ```


### Manual installation

See [here](install.md) for instructions on configuring an instance of AIDE.

After that, see [here](launch_aide.md) for instructions on launching an instance of AIDE.

## Google Cloud Platform GCP

Script that start the AIDE instance everyday : 

```
#! /bin/bash
cd /app/aerial_wildlife_detection/docker
sudo service docker stop
sudo service docker start
git fetch --tags
git checkout AIDE+MELCC-1.8
AIDE_ENV=dev sudo -E docker-compose build
AIDE_ENV=arbutus sudo -E docker-compose up &
```

Wait 2 minutes until it completely started. Then launch the respective, URL port 8080.

* remote dev : <http://206.12.94.82:8080/>
* GCP : <http://35.208.225.49:8080/>
