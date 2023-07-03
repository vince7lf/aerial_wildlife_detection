# Installing AIDE

## Migration from AIDE v1

If you have [AIDE v1](https://github.com/microsoft/aerial_wildlife_detection/tree/v1) already running and want to
upgrade its contents to AIDE v2, see [here](upgrade_from_v1.md).

## New installation

Arbutus : After a boot, mount manually the /app drive

`sudo mount /dev/vdb1 /app`

### With Docker

Here's how to install and launch AIDE with Docker on the current machine:

1. Download and install [Docker] as well as [Docker Compose](https://docs.docker.com/compose/install/linux/)

```bash
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

3. Clone the AIDE
   repository: `git clone https://github.com/microsoft/aerial_wildlife_detection.git && cd aerial_wildlife_detection/`
4. **Important:** modify the `docker/settings.ini` file and replace the default super user credentials (
   section `[Project]`) with new values. Make sure to review and update the other default settings as well, if needed.
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

After a reboot, if you get the error _failed to build: failed to get layer for image ... layer does not exist_

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

You might have another build errors after, like 'network docker_default is ambiguous' and when running an error with the
adress port binding

## ERROR: 2 matches found based on name: network docker_default is ambiguous

After a reboot, if you run a docker-compose build and get the error with the network docker_default, use docker network
prune to remove unused network interfaces

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

# VERY IMPORTANT Restart docker service after the mount, because the images are located on the mounted volume
sudo service docker restart

# disable apache2 and postgresql services on host system to prevent port binding
sudo systemctl disable apache2 && sudo systemctl stop apache2
sudo systemctl disable postgresql && sudo systemctl stop postgresql

# Make sure the _data folder of postgresql is not owned by root and permission 700  
sudo chown _apt:mlocate /app/var/lib/docker/volumes/aide_db_data/_data
sudo chmod 700 /app/var/lib/docker/volumes/aide_db_data/_data

# move to the docker folder containing the Dockerfile and docker-compose init files 
cd /app/aerial_wildlife_detection/docker/

# build image to make sure everything is still ok
AIDE_ENV=dev sudo -E docker-compose build

# Start container
AIDE_ENV=arbutus sudo -E docker-compose up &
```

## Error upload image

If you have the image being uploaded infinitely (Message is "uploading..."), you might have a connection with the VPN
that prevent good communication between the browser and the server. Disconnect from the VPN (if possible).

## Error login

If you login with the right password, but an error show a login error, then there is an issue with the application and
it needs to be restarted.

## Error no menu on the left

If you have trouble to login with the right password, and you finally can login but missing the menu on the left, then
you have something wrong with the cache.

## Error no image showin-up

If there is no image showing up but they have been uploaded successfully, it's probably because there is a '.' in the
filename. Or it does not end with _tile.jpg.

## Error: Config owner (postgres:105) and data owner (systemd-resolve:104) do not match, and config owner is not root

Error occur when runnig the docker.  

Fix : in container_init.sh, set postgres owner for postgres folders  
```
chown -R postgres:postgres /etc/postgresql/$pgVersion/main
chown -R postgres:postgres /var/lib/postgresql/$pgVersion/main
```

Ref : 
* https://stackoverflow.com/questions/39983732/postgresql-9-5-installation-config-owner-postgres105-and-data-owner-ubuntu
* https://github.com/mediagis/nominatim-docker/issues/51

Stacktrace:

```
aidev3_cnt  | + sudo sed -i 's/\s*port\s*=\s[0-9]*/port = 17685/g' /etc/postgresql/10/main/postgresql.conf
aidev3_cnt  | + sudo service postgresql restart
aidev3_cnt  |  * Restarting PostgreSQL 10 database server
aidev3_cnt  |  * Error: Config owner (postgres:105) and data owner (systemd-resolve:104) do not match, and config owner is not root
aidev3_cnt  |    ...fail!
aidev3_cnt  | + sudo -u postgres psql -p 17685 -tc 'SELECT 1 FROM pg_roles WHERE pg_roles.rolname='\''ailabeluser'\'''
aidev3_cnt  | + grep -q 1
aidev3_cnt  | psql: could not connect to server: No such file or directory
aidev3_cnt  |   Is the server running locally and accepting
aidev3_cnt  |   connections on Unix domain socket "/var/run/postgresql/.s.PGSQL.17685"?
aidev3_cnt  | + sudo -u postgres psql -p 17685 -c 'CREATE USER "ailabeluser" WITH PASSWORD '\''aiLabelUser'\'';'
aidev3_cnt  | psql: could not connect to server: No such file or directory
aidev3_cnt  |   Is the server running locally and accepting
aidev3_cnt  |   connections on Unix domain socket "/var/run/postgresql/.s.PGSQL.17685"?
aidev3_cnt  | + grep -q 1
aidev3_cnt  | + sudo -u postgres psql -p 17685 -tc 'SELECT 1 FROM pg_database WHERE datname = '\''aidev3'\'''
aidev3_cnt  | psql: could not connect to server: No such file or directory
aidev3_cnt  |   Is the server running locally and accepting
aidev3_cnt  |   connections on Unix domain socket "/var/run/postgresql/.s.PGSQL.17685"?
aidev3_cnt  | + sudo -u postgres psql -p 17685 -c 'CREATE DATABASE "aidev3" WITH OWNER "ailabeluser" CONNECTION LIMIT -1;'
aidev3_cnt  | psql: could not connect to server: No such file or directory
aidev3_cnt  |   Is the server running locally and accepting
aidev3_cnt  |   connections on Unix domain socket "/var/run/postgresql/.s.PGSQL.17685"?
aidev3_cnt  | + sudo -u postgres psql -p 17685 -c 'GRANT CREATE, CONNECT ON DATABASE "aidev3" TO "ailabeluser";'
aidev3_cnt  | psql: could not connect to server: No such file or directory
aidev3_cnt  |   Is the server running locally and accepting
aidev3_cnt  |   connections on Unix domain socket "/var/run/postgresql/.s.PGSQL.17685"?
aidev3_cnt  | + sudo -u postgres psql -p 17685 -d aidev3 -c 'CREATE EXTENSION IF NOT EXISTS "uuid-ossp";'
aidev3_cnt  | psql: could not connect to server: No such file or directory
aidev3_cnt  |   Is the server running locally and accepting
aidev3_cnt  |   connections on Unix domain socket "/var/run/postgresql/.s.PGSQL.17685"?
aidev3_cnt  | + sudo -u postgres psql -p 17685 -d aidev3 -c 'GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO "ailabeluser";'
aidev3_cnt  | psql: could not connect to server: No such file or directory
aidev3_cnt  |   Is the server running locally and accepting
aidev3_cnt  |   connections on Unix domain socket "/var/run/postgresql/.s.PGSQL.17685"?
aidev3_cnt  | + python setup/setupDB.py
aidev3_cnt  | Traceback (most recent call last):
aidev3_cnt  |   File "setup/setupDB.py", line 124, in <module>
aidev3_cnt  |     setupDB()
aidev3_cnt  |   File "setup/setupDB.py", line 96, in setupDB
aidev3_cnt  |     dbConn.execute(sql, None, None)
aidev3_cnt  |   File "/home/aide/app/modules/Database/app.py", line 99, in execute
aidev3_cnt  |     with self._get_connection() as conn:
aidev3_cnt  |   File "/usr/lib/python3.8/contextlib.py", line 113, in __enter__
aidev3_cnt  |     return next(self.gen)
aidev3_cnt  |   File "/home/aide/app/modules/Database/app.py", line 89, in _get_connection
aidev3_cnt  |     conn = self.connectionPool.getconn()
aidev3_cnt  |   File "/usr/local/lib/python3.8/dist-packages/psycopg2/pool.py", line 169, in getconn
aidev3_cnt  |     return self._getconn(key)
aidev3_cnt  |   File "/usr/local/lib/python3.8/dist-packages/psycopg2/pool.py", line 93, in _getconn
aidev3_cnt  |     return self._connect(key)
aidev3_cnt  |   File "/usr/local/lib/python3.8/dist-packages/psycopg2/pool.py", line 63, in _connect
aidev3_cnt  |     conn = psycopg2.connect(*self._args, **self._kwargs)
aidev3_cnt  |   File "/usr/local/lib/python3.8/dist-packages/psycopg2/__init__.py", line 122, in connect
aidev3_cnt  |     conn = _connect(dsn, connection_factory=connection_factory, **kwasync)
aidev3_cnt  | psycopg2.OperationalError: could not connect to server: Connection refused
aidev3_cnt  |   Is the server running on host "localhost" (127.0.0.1) and accepting
aidev3_cnt  |   TCP/IP connections on port 17685?
aidev3_cnt  | could not connect to server: Cannot assign requested address
aidev3_cnt  |   Is the server running on host "localhost" (::1) and accepting
aidev3_cnt  |   TCP/IP connections on port 17685?
aidev3_cnt  |
aidev3_cnt  | + sudo systemctl enable postgresql.service
aidev3_cnt  | Synchronizing state of postgresql.service with SysV service script with /lib/systemd/systemd-sysv-install.
aidev3_cnt  | Executing: /lib/systemd/systemd-sysv-install enable postgresql
aidev3_cnt  | + chown postgres /var/lib/postgresql/10/main
aidev3_cnt  | + sudo service postgresql start
aidev3_cnt  |  * Starting PostgreSQL 10 database server
aidev3_cnt  |  * Removed stale pid file.
aidev3_cnt  | Error: /usr/lib/postgresql/10/bin/pg_ctl /usr/lib/postgresql/10/bin/pg_ctl start -D /var/lib/postgresql/10/main -l /var/log/postgresql/postgresql-10-main.log -s -o  -c config_file="/etc/postgresql/10/main/postgresql.conf"  exited with status 1:
aidev3_cnt  | 2023-07-03 14:51:47.037 GMT [162] LOG:  skipping missing configuration file "/var/lib/postgresql/10/main/postgresql.auto.conf"
aidev3_cnt  | 2023-07-03 15:51:47.057 BST [162] FATAL:  could not open file "/var/lib/postgresql/10/main/PG_VERSION": Permission denied
aidev3_cnt  | pg_ctl: could not start server
```

## Error :  AttributeError: module 'lib' has no attribute 'X509_V_FLAG_CB_ISSUER_CHECK' 

Error occur when running the docker.

Root : conflict between pip and pyOpenSSL 
Fix : reinstall pip and upgrade pyOpenSSL 

```
pip3 install pyOpenSSL --upgrade
```

Refs : 
* https://stackoverflow.com/questions/73830524/attributeerror-module-lib-has-no-attribute-x509-v-flag-cb-issuer-check
* https://askubuntu.com/questions/1428181/module-lib-has-no-attribute-x509-v-flag-cb-issuer-check  

Stacktrace :

```
aidev3_cnt  | + sudo sed -i 's/\s*port\s*=\s[0-9]*/port = 17685/g' /etc/postgresql/10/main/postgresql.conf
aidev3_cnt  | + sudo service postgresql restart
aidev3_cnt  |  * Restarting PostgreSQL 10 database server
aidev3_cnt  |  * Error: Config owner (postgres:105) and data owner (systemd-resolve:104) do not match, and config owner is not root
aidev3_cnt  |    ...fail!
aidev3_cnt  | + sudo -u postgres psql -p 17685 -tc 'SELECT 1 FROM pg_roles WHERE pg_roles.rolname='\''ailabeluser'\'''
aidev3_cnt  | + grep -q 1
aidev3_cnt  | psql: could not connect to server: No such file or directory
aidev3_cnt  |   Is the server running locally and accepting
aidev3_cnt  |   connections on Unix domain socket "/var/run/postgresql/.s.PGSQL.17685"?
aidev3_cnt  | + sudo -u postgres psql -p 17685 -c 'CREATE USER "ailabeluser" WITH PASSWORD '\''aiLabelUser'\'';'
aidev3_cnt  | psql: could not connect to server: No such file or directory
aidev3_cnt  |   Is the server running locally and accepting
aidev3_cnt  |   connections on Unix domain socket "/var/run/postgresql/.s.PGSQL.17685"?
aidev3_cnt  | + grep -q 1
aidev3_cnt  | + sudo -u postgres psql -p 17685 -tc 'SELECT 1 FROM pg_database WHERE datname = '\''aidev3'\'''
aidev3_cnt  | psql: could not connect to server: No such file or directory
aidev3_cnt  |   Is the server running locally and accepting
aidev3_cnt  |   connections on Unix domain socket "/var/run/postgresql/.s.PGSQL.17685"?
aidev3_cnt  | + sudo -u postgres psql -p 17685 -c 'CREATE DATABASE "aidev3" WITH OWNER "ailabeluser" CONNECTION LIMIT -1;'
aidev3_cnt  | psql: could not connect to server: No such file or directory
aidev3_cnt  |   Is the server running locally and accepting
aidev3_cnt  |   connections on Unix domain socket "/var/run/postgresql/.s.PGSQL.17685"?
aidev3_cnt  | + sudo -u postgres psql -p 17685 -c 'GRANT CREATE, CONNECT ON DATABASE "aidev3" TO "ailabeluser";'
aidev3_cnt  | psql: could not connect to server: No such file or directory
aidev3_cnt  |   Is the server running locally and accepting
aidev3_cnt  |   connections on Unix domain socket "/var/run/postgresql/.s.PGSQL.17685"?
aidev3_cnt  | + sudo -u postgres psql -p 17685 -d aidev3 -c 'CREATE EXTENSION IF NOT EXISTS "uuid-ossp";'
aidev3_cnt  | psql: could not connect to server: No such file or directory
aidev3_cnt  |   Is the server running locally and accepting
aidev3_cnt  |   connections on Unix domain socket "/var/run/postgresql/.s.PGSQL.17685"?
aidev3_cnt  | + sudo -u postgres psql -p 17685 -d aidev3 -c 'GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO "ailabeluser";'
aidev3_cnt  | psql: could not connect to server: No such file or directory
aidev3_cnt  |   Is the server running locally and accepting
aidev3_cnt  |   connections on Unix domain socket "/var/run/postgresql/.s.PGSQL.17685"?
aidev3_cnt  | + python setup/setupDB.py
aidev3_cnt  | Traceback (most recent call last):
aidev3_cnt  |   File "setup/setupDB.py", line 20, in <module>
aidev3_cnt  |     from modules import Database
aidev3_cnt  |   File "/home/aide/app/modules/__init__.py", line 9, in <module>
aidev3_cnt  |     import celery_worker
aidev3_cnt  |   File "/home/aide/app/celery_worker.py", line 192, in <module>
aidev3_cnt  |     from modules.DataAdministration.backend import celery_interface as da_int
aidev3_cnt  |   File "/home/aide/app/modules/DataAdministration/backend/celery_interface.py", line 16, in <module>
aidev3_cnt  |     from .dataWorker import DataWorker
aidev3_cnt  |   File "/home/aide/app/modules/DataAdministration/backend/dataWorker.py", line 32, in <module>
aidev3_cnt  |     from util import drivers, parsers
aidev3_cnt  |   File "/home/aide/app/util/parsers/__init__.py", line 9, in <module>
aidev3_cnt  |     from .segmentationParser import SegmentationFileParser
aidev3_cnt  |   File "/home/aide/app/util/parsers/segmentationParser.py", line 14, in <module>
aidev3_cnt  |     import rasterio
aidev3_cnt  |   File "/usr/local/lib/python3.8/dist-packages/rasterio/__init__.py", line 29, in <module>
aidev3_cnt  |     from rasterio.crs import CRS
aidev3_cnt  |   File "rasterio/crs.pyx", line 1, in init rasterio.crs
aidev3_cnt  |   File "rasterio/_base.pyx", line 22, in init rasterio._base
aidev3_cnt  |   File "/usr/local/lib/python3.8/dist-packages/rasterio/dtypes.py", line 10, in <module>
aidev3_cnt  |     from rasterio.env import GDALVersion
aidev3_cnt  |   File "/usr/local/lib/python3.8/dist-packages/rasterio/env.py", line 24, in <module>
aidev3_cnt  |     from rasterio.session import Session, DummySession
aidev3_cnt  |   File "/usr/local/lib/python3.8/dist-packages/rasterio/session.py", line 13, in <module>
aidev3_cnt  |     import boto3
aidev3_cnt  |   File "/usr/local/lib/python3.8/dist-packages/boto3/__init__.py", line 17, in <module>
aidev3_cnt  |     from boto3.session import Session
aidev3_cnt  |   File "/usr/local/lib/python3.8/dist-packages/boto3/session.py", line 17, in <module>
aidev3_cnt  |     import botocore.session
aidev3_cnt  |   File "/usr/local/lib/python3.8/dist-packages/botocore/session.py", line 26, in <module>
aidev3_cnt  |     import botocore.client
aidev3_cnt  |   File "/usr/local/lib/python3.8/dist-packages/botocore/client.py", line 15, in <module>
aidev3_cnt  |     from botocore import waiter, xform_name
aidev3_cnt  |   File "/usr/local/lib/python3.8/dist-packages/botocore/waiter.py", line 18, in <module>
aidev3_cnt  |     from botocore.docs.docstring import WaiterDocstring
aidev3_cnt  |   File "/usr/local/lib/python3.8/dist-packages/botocore/docs/__init__.py", line 15, in <module>
aidev3_cnt  |     from botocore.docs.service import ServiceDocumenter
aidev3_cnt  |   File "/usr/local/lib/python3.8/dist-packages/botocore/docs/service.py", line 14, in <module>
aidev3_cnt  |     from botocore.docs.client import ClientDocumenter, ClientExceptionsDocumenter
aidev3_cnt  |   File "/usr/local/lib/python3.8/dist-packages/botocore/docs/client.py", line 17, in <module>
aidev3_cnt  |     from botocore.docs.example import ResponseExampleDocumenter
aidev3_cnt  |   File "/usr/local/lib/python3.8/dist-packages/botocore/docs/example.py", line 13, in <module>
aidev3_cnt  |     from botocore.docs.shape import ShapeDocumenter
aidev3_cnt  |   File "/usr/local/lib/python3.8/dist-packages/botocore/docs/shape.py", line 19, in <module>
aidev3_cnt  |     from botocore.utils import is_json_value_header
aidev3_cnt  |   File "/usr/local/lib/python3.8/dist-packages/botocore/utils.py", line 37, in <module>
aidev3_cnt  |     import botocore.httpsession
aidev3_cnt  |   File "/usr/local/lib/python3.8/dist-packages/botocore/httpsession.py", line 45, in <module>
aidev3_cnt  |     from urllib3.contrib.pyopenssl import (
aidev3_cnt  |   File "/usr/local/lib/python3.8/dist-packages/urllib3/contrib/pyopenssl.py", line 50, in <module>
aidev3_cnt  |     import OpenSSL.crypto
aidev3_cnt  |   File "/usr/lib/python3/dist-packages/OpenSSL/__init__.py", line 8, in <module>
aidev3_cnt  |     from OpenSSL import crypto, SSL
aidev3_cnt  |   File "/usr/lib/python3/dist-packages/OpenSSL/crypto.py", line 1550, in <module>
aidev3_cnt  |     class X509StoreFlags(object):
aidev3_cnt  |   File "/usr/lib/python3/dist-packages/OpenSSL/crypto.py", line 1570, in X509StoreFlags
aidev3_cnt  |     CB_ISSUER_CHECK = _lib.X509_V_FLAG_CB_ISSUER_CHECK
aidev3_cnt  | AttributeError: module 'lib' has no attribute 'X509_V_FLAG_CB_ISSUER_CHECK'
aidev3_cnt  | + sudo systemctl enable postgresql.service
aidev3_cnt  | Synchronizing state of postgresql.service with SysV service script with /lib/systemd/systemd-sysv-install.
aidev3_cnt  | Executing: /lib/systemd/systemd-sysv-install enable postgresql
aidev3_cnt  | + sudo service postgresql start
aidev3_cnt  |  * Starting PostgreSQL 10 database server
aidev3_cnt  |  * Error: Config owner (postgres:105) and data owner (systemd-resolve:104) do not match, and config owner is not root
aidev3_cnt  |    ...fail!
aidev3_cnt  | + mkdir -p /home/aide/app/backup

```