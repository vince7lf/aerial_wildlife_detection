# Installing AIDE

## Migration from AIDE v1
If you have [AIDE v1](https://github.com/microsoft/aerial_wildlife_detection/tree/v1) already running and want to upgrade its contents to AIDE v2, see [here](upgrade_from_v1.md).


## New installation

Arbutus : After a boot, mount manually the /app drive 

`sudo mount /dev/vdb1 /app`

### With Docker

Here's how to install and launch AIDE with Docker on the current machine:

1. Download and install [Docker] as well as [Docker Compose](https://docs.docker.com/compose/install/linux/)
```
  # DO NOT INSTALL DOCKJER WITH WITH SNAP OR YUM ON UBUNTU !!!! I DID AGAIN THE MISTAKE 2022-11-22 AND LOST A DAY. Follow directions HERE https://docs.docker.com/engine/install/ubuntu/
  # Docker latest version
  sudo apt-get update
  sudo apt-get install \
    ca-certificates \
    curl \
    gnupg \
    lsb-release
  sudo mkdir -p /etc/apt/keyrings
  curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
  echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
  sudo apt-get update
  sudo apt-get install docker-ce docker-ce-cli containerd.io docker-compose-plugin
  sudo service docker start 
  sudo docker run hello-world
    
  # Docker compose
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
  sudo snap start docker
  
  # if an error still occurs with space (snapd) stop docker service and restart it (restart seems not to do the same job)
  # ERROR: Could not install packages due to an OSError: [Errno 28] No space left on device
  
  # ERROR Failed to stop docker.service: Unit docker.service not loaded. 
  # ERROR Failed to start docker.service: Unit docker.service not found. 
  # Because you did not install docker on Ubuntu correctly, like using sudo apt isntall docker, which is nmot the right way. Need to install it using docker installation for Ubuntu (and not on debian or else like snap or yum) 
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

# ERROR port already bind

Finding the PID of the process using a specific port on unix ubuntu

```
ubuntu@tes2:~$ sudo ss -lptn 'sport = :8081'
State                                 Recv-Q                                  Send-Q                                                                    Local Address:Port                                                                   Peer Address:Port
LISTEN                                0                                       128                                                                                   *:8081                                                                              *:*                                     users:(("apache2",pid=1379,fd=4),("apache2",pid=1378,fd=4),("apache2",pid=1376,fd=4),("apache2",pid=1374,fd=4))
```