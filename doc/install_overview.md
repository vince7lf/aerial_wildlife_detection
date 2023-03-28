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
  # DO NOT INSTALL DOCKER WITH WITH SNAP OR YUM ON UBUNTU !!!! I DID AGAIN THE MISTAKE 2022-11-22 AND LOST A DAY. Follow directions HERE https://docs.docker.com/engine/install/ubuntu/
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
sudo mount /dev/vdb1 /app # mount the volume if needed
cd /app/aerial_wildlife_detection/docker
sudo service postgres stop # make sure potsgres does not take the port
sudo service apache2 stop # make sure apache does not take the port
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

# Error with Docker 

## ERROR: Service 'aide_app' failed to build: failed to get layer for image sha256:7554ac65eba52a9e5a2104d19f024eef40f0cc0b99d5ba3e168676ff377f7ec3: layer does not exist

After a reboot, if you get the error _failed to build: failed to get layer for image  ... layer does not exist_

```
ubuntu@tes2:/app/aerial_wildlife_detection/docker$ AIDE_ENV=arbutus sudo -E docker-compose up &
[1] 2727
ubuntu@tes2:/app/aerial_wildlife_detection/docker$ Creating network "docker_default" with the default driver
Creating volume "aide_db_data" with default driver
Creating volume "aide_images" with default driver
Creating volume "aide_mapserv" with default driver
Building aide_app
Step 1/28 : FROM pytorch/pytorch:1.7.1-cuda11.0-cudnn8-devel
1.7.1-cuda11.0-cudnn8-devel: Pulling from pytorch/pytorch
Digest: sha256:f0d0c1b5d4e170b4d2548d64026755421f8c0df185af2c4679085a7edc34d150
Status: Downloaded newer image for pytorch/pytorch:1.7.1-cuda11.0-cudnn8-devel
ERROR: Service 'aide_app' failed to build: failed to get layer for image sha256:7554ac65eba52a9e5a2104d19f024eef40f0cc0b99d5ba3e168676ff377f7ec3: layer does not exist

[1]+  Exit 1                  AIDE_ENV=arbutus sudo -E docker-compose up
ubuntu@tes2:/app/aerial_wildlife_detection/docker$ Hg docker
```

Stop the docker service and restart it. 

Stop and restart docker service
```
ubuntu@tes2:/app/aerial_wildlife_detection/docker$ sudo service docker stop
ubuntu@tes2:/app/aerial_wildlife_detection/docker$ sudo service docker start
```

You might have another build errors after, like 'network docker_default is ambiguous' and when running an error with the adress port binding   

## ERROR: 2 matches found based on name: network docker_default is ambiguous

After a reboot, if you run a docker-compose build and get the error with the network docker_default, use docker network prune to remove unused network interfaces  

```
ubuntu@tes2:/app/aerial_wildlife_detection/docker$ AIDE_ENV=dev sudo -E docker-compose build
ERROR: 2 matches found based on name: network docker_default is ambiguous
```

list the network interfaces and prune
```
ubuntu@tes2:/app/aerial_wildlife_detection/docker$ sudo docker network ls
NETWORK ID     NAME             DRIVER    SCOPE
843f1fdfa9d1   bridge           bridge    local
9308ee6b42a6   docker_default   bridge    local
0c7434b021dc   docker_default   bridge    local
8f40e15cd7a0   host             host      local
119e0c051bb8   none             null      local

ubuntu@tes2:/app/aerial_wildlife_detection/docker$ sudo docker network prune
WARNING! This will remove all custom networks not used by at least one container.
Are you sure you want to continue? [y/N] y
Deleted Networks:
docker_default
docker_default
```

Stop and restart docker service
```
ubuntu@tes2:/app/aerial_wildlife_detection/docker$ sudo service docker stop
ubuntu@tes2:/app/aerial_wildlife_detection/docker$ sudo service docker start
```

Re-try building image
```
ubuntu@tes2:/app/aerial_wildlife_detection/docker$ AIDE_ENV=dev sudo -E docker-compose build
Building aide_app
Step 1/28 : FROM pytorch/pytorch:1.7.1-cuda11.0-cudnn8-devel
 ---> 7554ac65eba5
```

## ERROR: for docker_aide_app_1  Cannot start service aide_app: driver failed programming external connectivity on endpoint docker_aide_app_1 (7d1f5bbd3fcacafc7a8dc8e6fd81c2a8f25f04327129bd5a24d48529d1183f8a): Error starting userland proxy: listen tcp4 0.0.0.0:8081: bind: address already in use

If you get this error when running the container :  
```
ubuntu@tes2:/app/aerial_wildlife_detection/docker$ AIDE_ENV=arbutus sudo -E docker-compose up &
[1] 7280
ubuntu@tes2:/app/aerial_wildlife_detection/docker$ Creating network "docker_default" with the default driver
Recreating docker_aide_app_1 ... error

ERROR: for docker_aide_app_1  Cannot start service aide_app: driver failed programming external connectivity on endpoint docker_aide_app_1 (7d1f5bbd3fcacafc7a8dc8e6fd81c2a8f25f04327129bd5a24d48529d1183f8a): Error starting userland proxy: listen tcp4 0.0.0.0:8081: bind: address already in use

ERROR: for aide_app  Cannot start service aide_app: driver failed programming external connectivity on endpoint docker_aide_app_1 (7d1f5bbd3fcacafc7a8dc8e6fd81c2a8f25f04327129bd5a24d48529d1183f8a): Error starting userland proxy: listen tcp4 0.0.0.0:8081: bind: address already in use
ERROR: Encountered errors while bringing up the project.
^C
[1]+  Exit 1                  AIDE_ENV=arbutus sudo -E docker-compose up
```

Find out which service is taking this port at reboot : 
```
ubuntu@tes2:/app/aerial_wildlife_detection/docker$ sudo netstat -ano -p tcp | grep 8081
tcp6       0      0 :::8081                 :::*                    LISTEN      1457/apache2         off (0.00/0/0)
```

Stop service Apache2 
```
ubuntu@tes2:/app/aerial_wildlife_detection/docker$ sudo service apache2 stop
```

Retry 
```
ubuntu@tes2:/app/aerial_wildlife_detection/docker$ AIDE_ENV=arbutus sudo -E docker-compose up &
[1] 7280
```

## ERROR Cannot start service aide_app: network 6c6dbb0dd10a68c65f932b2cca97c17e7a4438ff67d9d7b771d3e527edbe8461 not found 

If you get the error _Cannot start service aide_app: network not found_, even after a `sudo docker network prune`  
```
sudo service docker restart
ubuntu@tes2:/app/aerial_wildlife_detection/docker$ AIDE_ENV=arbutus sudo -E docker-compose up &
[1] 5319
Starting docker_aide_app_1 ... error

ERROR: for docker_aide_app_1  Cannot start service aide_app: network 6c6dbb0dd10a68c65f932b2cca97c17e7a4438ff67d9d7b771d3e527edbe8461 not found

ERROR: for aide_app  Cannot start service aide_app: network 6c6dbb0dd10a68c65f932b2cca97c17e7a4438ff67d9d7b771d3e527edbe8461 not found
ERROR: Encountered errors while bringing up the project.

[1]+  Exit 1                  AIDE_ENV=arbutus sudo -E docker-compose up
ubuntu@tes2:/app/aerial_wildlife_detection/docker$ AIDE_ENV=arbutus sudo -E docker-compose up --force-recreate &



ubuntu@tes2:/app/aerial_wildlife_detection/docker$ AIDE_ENV=arbutus sudo -E docker-compose up --force-recreate &
```

start with option `--force-recreate` to force the creation of the network interface.   

```
AIDE_ENV=arbutus sudo -E docker-compose up --force-recreate &
```

## Error with postgreSQL

```
 + sudo service postgresql restart
aide_app_1  |  * Restarting PostgreSQL 10 database server
aide_app_1  |  * Error: Data directory /var/lib/postgresql/10/main must not be owned by root
aide_app_1  |    ...fail!
aide_app_1  | + grep -q 1
aide_app_1  | + sudo -u postgres psql -tc 'SELECT 1 FROM pg_roles WHERE pg_roles.rolname='\''ailabeluser'\'''
aide_app_1  | psql: connection to server on socket "/var/run/postgresql/.s.PGSQL.17685" failed: No such file or directory
aide_app_1  |   Is the server running locally and accepting connections on that socket?
aide_app_1  | + sudo -u postgres psql -c 'CREATE USER ailabeluser WITH PASSWORD '\''aiLabelUser'\'';'
aide_app_1  | psql: connection to server on socket "/var/run/postgresql/.s.PGSQL.17685" failed: No such file or directory
aide_app_1  |   Is the server running locally and accepting connections on that socket?
aide_app_1  | + grep -q 1
aide_app_1  | + sudo -u postgres psql -tc 'SELECT 1 FROM pg_database WHERE datname = '\''ailabeltooldb'\'''
aide_app_1  | psql: connection to server on socket "/var/run/postgresql/.s.PGSQL.17685" failed: No such file or directory
aide_app_1  |   Is the server running locally and accepting connections on that socket?
aide_app_1  | + sudo -u postgres psql -c 'CREATE DATABASE ailabeltooldb WITH OWNER ailabeluser CONNECTION LIMIT -1;'
aide_app_1  | psql: connection to server on socket "/var/run/postgresql/.s.PGSQL.17685" failed: No such file or directory
aide_app_1  |   Is the server running locally and accepting connections on that socket?
aide_app_1  | + sudo -u postgres psql -c 'GRANT CONNECT ON DATABASE ailabeltooldb TO ailabeluser;'
aide_app_1  | psql: connection to server on socket "/var/run/postgresql/.s.PGSQL.17685" failed: No such file or directory
aide_app_1  |   Is the server running locally and accepting connections on that socket?
aide_app_1  | + sudo -u postgres psql -d ailabeltooldb -c 'CREATE EXTENSION IF NOT EXISTS "uuid-ossp";'
aide_app_1  | psql: connection to server on socket "/var/run/postgresql/.s.PGSQL.17685" failed: No such file or directory
aide_app_1  |   Is the server running locally and accepting connections on that socket?
aide_app_1  | + sudo -u postgres psql -d ailabeltooldb -c 'GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO ailabeluser;'
aide_app_1  | psql: connection to server on socket "/var/run/postgresql/.s.PGSQL.17685" failed: No such file or directory
aide_app_1  |   Is the server running locally and accepting connections on that socket?
aide_app_1  | + python setup/setupDB.py
aide_app_1  | Traceback (most recent call last):
aide_app_1  |   File "setup/setupDB.py", line 72, in <module>
aide_app_1  |     setupDB()
aide_app_1  |   File "setup/setupDB.py", line 35, in setupDB
aide_app_1  |     dbConn.execute(sql, None, None)
aide_app_1  |   File "/home/aide/app/modules/Database/app.py", line 79, in execute
aide_app_1  |     with self._get_connection() as conn:
aide_app_1  |   File "/opt/conda/lib/python3.7/contextlib.py", line 112, in __enter__
aide_app_1  |     return next(self.gen)
aide_app_1  |   File "/home/aide/app/modules/Database/app.py", line 69, in _get_connection
aide_app_1  |     conn = self.connectionPool.getconn()
aide_app_1  |   File "/opt/conda/lib/python3.7/site-packages/psycopg2/pool.py", line 169, in getconn
aide_app_1  |     return self._getconn(key)
aide_app_1  |   File "/opt/conda/lib/python3.7/site-packages/psycopg2/pool.py", line 93, in _getconn
aide_app_1  |     return self._connect(key)
aide_app_1  |   File "/opt/conda/lib/python3.7/site-packages/psycopg2/pool.py", line 63, in _connect
aide_app_1  |     conn = psycopg2.connect(*self._args, **self._kwargs)
aide_app_1  |   File "/opt/conda/lib/python3.7/site-packages/psycopg2/__init__.py", line 122, in connect
aide_app_1  |     conn = _connect(dsn, connection_factory=connection_factory, **kwasync)
aide_app_1  | psycopg2.OperationalError: connection to server at "localhost" (127.0.0.1), port 17685 failed: Connection refused
aide_app_1  |   Is the server running on that host and accepting TCP/IP connections?
aide_app_1  | connection to server at "localhost" (::1), port 17685 failed: Cannot assign requested address
aide_app_1  |   Is the server running on that host and accepting TCP/IP connections?
aide_app_1  |
aide_app_1  | + sudo systemctl enable postgresql.service
aide_app_1  | Synchronizing state of postgresql.service with SysV service script with /lib/systemd/systemd-sysv-install.
aide_app_1  | Executing: /lib/systemd/systemd-sysv-install enable postgresql
aide_app_1  | + sudo service postgresql start
aide_app_1  |  * Starting PostgreSQL 10 database server
aide_app_1  |  * Error: Data directory /var/lib/postgresql/10/main must not be owned by root
aide_app_1  |    ...fail!
aide_app_1  | + echo ==============================
aide_app_1  | + echo 'Setup of database IS COMPLETED'
aide_app_1  | + echo ==============================
aide_app_1  | ==============================
aide_app_1  | Setup of database IS COMPLETED
aide_app_1  | ==============================
aide_app_1  |
aide_app_1  | ==========================
aide_app_1  | RABBITMQ SETUP IS STARTING
aide_app_1  | ==========================
aide_app_1  | + echo ''
aide_app_1  | + echo ==========================
aide_app_1  | + echo 'RABBITMQ SETUP IS STARTING'
aide_app_1  | + echo ==========================
aide_app_1  | + RMQ_username=aide
aide_app_1  | + RMQ_password=password
aide_app_1  | + sudo service rabbitmq-server start
aide_app_1  |  * Starting RabbitMQ Messaging Server rabbitmq-server
aide_app_1  | rmdir: failed to remove '/var/run/rabbitmq': Directory not empty
aide_app_1  |  * FAILED - check /var/log/rabbitmq/startup_\{log, _err\}
aide_app_1  |    ...fail!
aide_app_1  | + grep -q aide
aide_app_1  | + sudo rabbitmqctl list_users
aide_app_1  | Error: unable to connect to node rabbit@aide_app_host: nodedown
aide_app_1  |
aide_app_1  | DIAGNOSTICS
aide_app_1  | ===========
aide_app_1  |
aide_app_1  | attempted to contact: [rabbit@aide_app_host]
aide_app_1  |
aide_app_1  | rabbit@aide_app_host:
aide_app_1  |   * connected to epmd (port 4369) on aide_app_host
aide_app_1  |   * epmd reports: node 'rabbit' not running at all
aide_app_1  |                   no other nodes on aide_app_host
aide_app_1  |   * suggestion: start the node
aide_app_1  |
aide_app_1  | current node details:
aide_app_1  | - node name: 'rabbitmq-cli-94@aide_app_host'
aide_app_1  | - home dir: /var/lib/rabbitmq
aide_app_1  | - cookie hash: vZeYfJhrVFITuh0qesomMQ==
aide_app_1  |
aide_app_1  | + sudo rabbitmqctl add_user aide password
aide_app_1  | Error: unable to connect to node rabbit@aide_app_host: nodedown
aide_app_1  |
aide_app_1  | DIAGNOSTICS
aide_app_1  | ===========
aide_app_1  |
aide_app_1  | attempted to contact: [rabbit@aide_app_host]
aide_app_1  |
aide_app_1  | rabbit@aide_app_host:
aide_app_1  |   * connected to epmd (port 4369) on aide_app_host
aide_app_1  |   * epmd reports: node 'rabbit' not running at all
aide_app_1  |                   no other nodes on aide_app_host
aide_app_1  |   * suggestion: start the node
aide_app_1  |
aide_app_1  | current node details:
aide_app_1  | - node name: 'rabbitmq-cli-36@aide_app_host'
aide_app_1  | - home dir: /var/lib/rabbitmq
aide_app_1  | - cookie hash: vZeYfJhrVFITuh0qesomMQ==
aide_app_1  |
aide_app_1  | + sudo rabbitmqctl list_vhosts
aide_app_1  | + grep -q aide_vhost
aide_app_1  | Error: rabbit application is not running on node rabbit@aide_app_host.
aide_app_1  |  * Suggestion: start it with "rabbitmqctl start_app" and try again
aide_app_1  | + sudo rabbitmqctl add_vhost aide_vhost
aide_app_1  | Error: rabbit application is not running on node rabbit@aide_app_host.
aide_app_1  |  * Suggestion: start it with "rabbitmqctl start_app" and try again
aide_app_1  | + sudo rabbitmqctl set_permissions -p aide_vhost aide '.*' '.*' '.*'
aide_app_1  | Setting permissions for user "aide" in vhost "aide_vhost"
aide_app_1  | Error: {noproc,{gen_server2,call,
aide_app_1  |                             [worker_pool,{next_free,<10937.215.0>},infinity]}}
aide_app_1  | + sudo systemctl enable rabbitmq-server.service
aide_app_1  | Synchronizing state of rabbitmq-server.service with SysV service script with /lib/systemd/systemd-sysv-install.
aide_app_1  | Executing: /lib/systemd/systemd-sysv-install enable rabbitmq-server
aide_app_1  | ===========================
aide_app_1  | + echo ===========================
aide_app_1  | + echo 'RABBITMQ SETUP IS COMPLETED'
aide_app_1  | + echo ===========================
aide_app_1  | + echo ''
aide_app_1  | + grep -q '^net.ipv4.tcp_keepalive_*' /etc/sysctl.conf
aide_app_1  | RABBITMQ SETUP IS COMPLETED
aide_app_1  | ===========================
aide_app_1  |
aide_app_1  | + sed -i 's/^\s*net.ipv4.tcp_keepalive_time.*/net.ipv4.tcp_keepalive_time = 60 /g' /etc/sysctl.conf
aide_app_1  | + sed -i 's/^\s*net.ipv4.tcp_keepalive_intvl.*/net.ipv4.tcp_keepalive_intvl = 60 /g' /etc/sysctl.conf
aide_app_1  | + sed -i 's/^\s*net.ipv4.tcp_keepalive_probes.*/net.ipv4.tcp_keepalive_probes = 20 /g' /etc/sysctl.conf
aide_app_1  | + sysctl -p
aide_app_1  | sysctl: setting key "net.ipv4.tcp_keepalive_time": Read-only file system
aide_app_1  | sysctl: setting key "net.ipv4.tcp_keepalive_intvl": Read-only file system
aide_app_1  | sysctl: setting key "net.ipv4.tcp_keepalive_probes": Read-only file system
aide_app_1  | + '[' arbutus = vbox ']'
aide_app_1  | + mode=start
aide_app_1  | + '[' start == start ']'
aide_app_1  | + start
aide_app_1  | + IFS=,
aide_app_1  | + read -ra ADDR
aide_app_1  | + launchCeleryBeat=false
aide_app_1  | + IFS=,
aide_app_1  | + read -ra ADDR
aide_app_1  | + for i in "${ADDR[@]}"
aide_app_1  | ++ tr '[:upper:]' '[:lower:]'
aide_app_1  | ++ echo LabelUI
aide_app_1  | + module=labelui
aide_app_1  | + '[' labelui == fileserver ']'
aide_app_1  | + for i in "${ADDR[@]}"
aide_app_1  | ++ tr '[:upper:]' '[:lower:]'
aide_app_1  | ++ echo AIController
aide_app_1  | + module=aicontroller
aide_app_1  | + '[' aicontroller == fileserver ']'
aide_app_1  | + for i in "${ADDR[@]}"
aide_app_1  | ++ tr '[:upper:]' '[:lower:]'
aide_app_1  | ++ echo AIWorker
aide_app_1  | + module=aiworker
aide_app_1  | + '[' aiworker == fileserver ']'
aide_app_1  | + for i in "${ADDR[@]}"
aide_app_1  | ++ echo FileServer
aide_app_1  | ++ tr '[:upper:]' '[:lower:]'
aide_app_1  | + module=fileserver
aide_app_1  | + '[' fileserver == fileserver ']'
aide_app_1  | ++ python util/configDef.py --section=FileServer --parameter=watch_folder_interval --fallback=60
aide_app_1  | + folderWatchInterval=0
aide_app_1  | + '[' 0 -gt 0 ']'
aide_app_1  | + '[' false ']'
aide_app_1  | ++ python util/configDef.py --section=FileServer --parameter=tempfiles_dir --fallback=/tmp
aide_app_1  | + tempDir=/tmp/aide/celery/
aide_app_1  | + mkdir -p /tmp/aide/celery/
aide_app_1  | + numHTTPmodules=0
aide_app_1  | + for i in "${ADDR[@]}"
aide_app_1  | + celery -A celery_worker worker -B -s /tmp/aide/celery/ --hostname aide@%h
aide_app_1  | ++ echo LabelUI
aide_app_1  | ++ tr '[:upper:]' '[:lower:]'
aide_app_1  | + module=labelui
aide_app_1  | + '[' labelui '!=' aiworker ']'
aide_app_1  | + (( numHTTPmodules++ ))
aide_app_1  | + for i in "${ADDR[@]}"
aide_app_1  | ++ tr '[:upper:]' '[:lower:]'
aide_app_1  | ++ echo AIController
aide_app_1  | + module=aicontroller
aide_app_1  | + '[' aicontroller '!=' aiworker ']'
aide_app_1  | + (( numHTTPmodules++ ))
aide_app_1  | + for i in "${ADDR[@]}"
aide_app_1  | ++ tr '[:upper:]' '[:lower:]'
aide_app_1  | ++ echo AIWorker
aide_app_1  | + module=aiworker
aide_app_1  | + '[' aiworker '!=' aiworker ']'
aide_app_1  | + for i in "${ADDR[@]}"
aide_app_1  | ++ tr '[:upper:]' '[:lower:]'
aide_app_1  | ++ echo FileServer
aide_app_1  | + module=fileserver
aide_app_1  | + '[' fileserver '!=' aiworker ']'
aide_app_1  | + (( numHTTPmodules++ ))
aide_app_1  | + '[' 3 -gt 0 ']'
aide_app_1  | + python setup/assemble_server.py --migrate_db 0
aide_app_1  |
aide_app_1  | #################################
aide_app_1  |                                         version 2.0.210531
aide_app_1  |    ###    #### ########  ########
aide_app_1  |   ## ##    ##  ##     ## ##             Linux-4.15.0-202-generic-x86_64-with-debian-buster-sid
aide_app_1  |  ##   ##   ##  ##     ## ##
aide_app_1  | ##     ##  ##  ##     ## ######         [config]
aide_app_1  | #########  ##  ##     ## ##             .> /home/aide/app/docker/settings.ini
aide_app_1  | ##     ##  ##  ##     ## ##
aide_app_1  | ##     ## #### ########  ########       [modules]
aide_app_1  |                                         .> LabelUI, AIController, AIWorker, FileServer
aide_app_1  | #################################
aide_app_1  |
aide_app_1  | Reading configuration...                                                  [ OK ]
aide_app_1  | Connecting to database...                                                 [ OK ]
aide_app_1  | Checking database...                                                      connection to server at "localhost" (127.0.0.1), port 17685 failed: Connection refused
aide_app_1  |   Is the server running on that host and accepting TCP/IP connections?
aide_app_1  | connection to server at "localhost" (::1), port 17685 failed: Cannot assign requested address
aide_app_1  |   Is the server running on that host and accepting TCP/IP connections?
aide_app_1  |
aide_app_1  | + '[' 1 -eq 0 ']'
aide_app_1  | + echo -e '\033[0;31mPre-flight checks failed; aborting launch of AIDE.\033[0m'
aide_app_1  | Pre-flight checks failed; aborting launch of AIDE.
docker_aide_app_1 exited with code 0

```


# After the serveur restart :

```
shutdown and restart
sudo shutdown -r now

# mount the volume
sudo mount /dev/vdb1 /app

#  VERY IMPORTANT Restart docker service after the mount, because the images are located on the mounted volume
sudo service docker restart

# move to the docker folder containing the Dockerfile and docker-compose init files 
cd /app/aerial_wildlife_detection/docker/

# build image to make sure everything is still ok
AIDE_ENV=dev sudo -E docker-compose build

# Start container
AIDE_ENV=arbutus sudo -E docker-compose up &
```

