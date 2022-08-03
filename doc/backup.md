# Backup and restore of AIDE : database and images

## Database

Docker volumes is being used to persist the data of the database (and the images) on the host and not inside the container.

To list the docker volumes, execute the command `docker volumes ls` on the host. Then you can inspect the volume using the _inspect_ option.

But the right way to backup and restore a database is not to take a copy of the data folder, but to dump and restore the data using the database CLI. 
 
```
ubuntu@tes2:/app/images$ sudo docker volume ls
DRIVER    VOLUME NAME
local     aide_db_data
local     aide_images

ubuntu@tes2:/app/images$ sudo docker volume inspect aide_db_data
[
    {
        "CreatedAt": "2022-08-01T19:51:03Z",
        "Driver": "local",
        "Labels": {},
        "Mountpoint": "/app/var/lib/docker/volumes/aide_db_data/_data",
        "Name": "aide_db_data",
        "Options": {},
        "Scope": "local"
    }
]
ubuntu@tes2:/app/images$ sudo ls -altr /app/var/lib/docker/volumes/aide_db_data/_data
total 24
-rw-------  1 _apt mlocate   88 Jun 21  2021 postgresql.auto.conf
drwx------  2 _apt mlocate    6 Jun 21  2021 pg_twophase
drwx------  2 _apt mlocate    6 Jun 21  2021 pg_tblspc
drwx------  2 _apt mlocate    6 Jun 21  2021 pg_stat_tmp
drwx------  2 _apt mlocate    6 Jun 21  2021 pg_stat
drwx------  2 _apt mlocate    6 Jun 21  2021 pg_snapshots
drwx------  2 _apt mlocate    6 Jun 21  2021 pg_serial
drwx------  2 _apt mlocate    6 Jun 21  2021 pg_replslot
drwx------  2 _apt mlocate    6 Jun 21  2021 pg_dynshmem
drwx------  2 _apt mlocate    6 Jun 21  2021 pg_commit_ts
-rw-------  1 _apt mlocate    3 Jun 21  2021 PG_VERSION
drwxr-xr-x  3 root root      19 Jun 24  2021 ..
drwx------  4 _apt mlocate   36 Jun 24  2021 pg_multixact
drwx------  2 _apt mlocate   18 Jun 24  2021 pg_subtrans
drwx------  2 _apt mlocate   18 Jun 24  2021 pg_xact
drwx------  6 _apt mlocate   54 Jun 24  2021 base
drwx------  3 _apt mlocate   92 Sep 29  2021 pg_wal
drwx------ 19 _apt mlocate 4096 Aug  1 19:51 .
drwx------  2 _apt mlocate   18 Aug  1 19:51 pg_notify
-rw-------  1 _apt mlocate  130 Aug  1 19:51 postmaster.opts
-rw-------  1 _apt mlocate   99 Aug  1 19:51 postmaster.pid
drwx------  2 _apt mlocate 4096 Aug  1 19:51 global
drwx------  4 _apt mlocate   68 Aug  1 21:11 pg_logical

```

### Dump the database

To retrieve a dump of the database, we need to connect inside the docker container image and run the _pg_dump_ command front it using the local _postgres_ service account. 

* Connect SSH to the remote host where the docker container runs.
* Find out the name of the running container

```
ubuntu@tes2:/app/images$ sudo docker container ls
CONTAINER ID   IMAGE      COMMAND                  CREATED             STATUS             PORTS                                       NAMES
86e2817c6b05   aide_app   "/bin/sh -c 'bash do…"   About an hour ago   Up About an hour   0.0.0.0:8080->8080/tcp, :::8080->8080/tcp   docker_aide_app_1
```

* Connect bash inside the docker container 

```
ubuntu@tes2:/app/images$ sudo docker exec -it docker_aide_app_1 /bin/bash
root@aide_app_host:/home/aide/app#
```

* Execute the _pg_dump_ command on the _ailabeltooldb_. The destination of the dump file is in the backup folder of the application folder, which can be accessed from the host.   

```
root@aide_app_host:/home/aide/app# sudo -u postgres pg_dump -Fc -d ailabeltooldb > /home/aide/app/backup/<hostname>-ailabeltooldb-`date +%Y%m%dT%H%M%S`.dump
```

### Transfer the dump

The application running inside the container is mapped to the host through a volume. 
Within the application folder there is a backup folder that can be used to share the backups between the host and the container.

By default the application folder on the host is _/app/aerial_wildlife_detection/docker_.

The application folder in the container is _/home/aide/app_ and is mapped to that folder.

| host                                  | container             |
|---------------------------------------|-----------------------|
| /app/aerial_wildlife_detection/backup | /home/aide/app/backup |

From the host, you can _scp_ the dump file to another host. 

```
ubuntu@tes2:/app/images$ scp /app/aerial_wildlife_detection/backup/<hostname>-ailabeltooldb-<dump datetime>.dump user@host:/path/to/app/folder/backup   
```

### Restore the dump

> **Note : Before restoring the dump, do not have the application running.**

Start the container, wait for the application to start, and then stop it manually. Make the restore, and then restart manually the application to test .Finally if everything is good, restart the complete container and run some regression testing again.
 
Refer to the [detailed step](#steps) before proceeding.   

## Images

### Locate the images

Docker volumes is being used to persist the images (and the data of the database) on the host and not inside the container.

To list the docker volumes, execute the command `docker volumes ls` on the host. Then you can inspect the volume using the _inspect_ option.

The way to backup and restore images is to _tar_ them, transfer the tar file, and _untar_ the images on the backup host.  

```
ubuntu@tes2:/app/images$ sudo docker volume ls
DRIVER    VOLUME NAME
local     aide_db_data
local     aide_images

ubuntu@tes2:/app/images$ sudo docker volume inspect aide_images
[
    {
        "CreatedAt": "2021-09-27T01:17:22Z",
        "Driver": "local",
        "Labels": {},
        "Mountpoint": "/app/var/lib/docker/volumes/aide_images/_data",
        "Name": "aide_images",
        "Options": {},
        "Scope": "local"
    }
]

ubuntu@tes2:/app/images$ sudo ls -altr "/app/var/lib/docker/volumes/aide_images/_data"
total 0
drwxr-xr-x 3 root root  19 Jun 24  2021 ..
drwxr-xr-x 3 root root  49 Jun 26  2021 test
drwxr-xr-x 3 root root  21 Sep 10  2021 test_AIDE+MELCC_v1.1
drwxr-xr-x 4 root root  35 Sep 12  2021 test_tiles_docker
drwxr-xr-x 3 root root  20 Sep 12  2021 test2-tile-docker
drwxr-xr-x 3 root root  21 Sep 12  2021 test_docker
drwxr-xr-x 8 root root 136 Sep 27  2021 .
drwxr-xr-x 3 root root  21 Sep 27  2021 tests_vincent
```  

From the host, you can _tar_ the images folder:

```
ubuntu@tes2:/app/images$ tar -cvf /app/aerial_wildlife_detection/backup/<hostname>-aide_images-`date +%Y%m%dT%H%M%S`.tar -C /app/var/lib/docker/volumes/aide_images/_data .  
```

### Transfer the images

After taring the images folder, you can use the _scp_ command to copy it to the other host.

```
ubuntu@tes2:/app/images$ scp /app/aerial_wildlife_detection/backup/<hostname>-aide_images-`date +%Y%m%dT%H%M%S`.tar user@host:/path/to/app/folder/backup   
```

### Restore the images

> **Note : Before restoring the dump, do not have the application running.**

Refer to the [detailed step](#steps) before proceeding.   

To restore the images, _untar_ the tar file inside volume location of the backup host.

```
ubuntu@tes2:/app/images$ tar -xvf /app/aerial_wildlife_detection/backup/<hostname>-aide_images-<tar datetime>.tar -C /app/var/lib/docker/volumes/aide_images/_data    
```

## <a name="steps"></a>Detailed steps

Here are the steps to apply a complete backup of the database and images:

1. Start the container and test that the application starts and works
2. Connect to the container bash
3. Stop the application manually
4. Backup the current application database and images
5. Remove the database
6. Remove the images
7. Restore the new backup and images
8. Start the application manually
9. Test
10. When everything is fine, exit the container bash
11. Restart the container
12. Test
13. Keep the backup for 2-4 weeks or the time needed to test that everything is fine. 


1. [From the host system] Start the container and test that the application starts and works

```
#! /bin/bash
cd /app/aerial_wildlife_detection/docker
sudo service docker stop
sudo service docker start
git checkout AIDE+MELCC-<tag>
git pull
sudo docker-compose build
sudo docker-compose up &
```

Wait until completely started, including celery workers. 

Check the _celery_ and _gunicorn_ process up and running (`ps -ef`).

Test using the URL of the app _http://localhost:8080_ , login and browse the test project.  

2. [From the host system] Connect to the container bash

`sudo docker exec -it docker_aide_app_1 /bin/bash` 

Result will be a prompt inside the container. like `root@aide_app_host:/home/aide/app#`.  

3. [Within the container] Stop the application manually with the command provided. 

`AIDE.sh stop`

Wait until completely stopped, including celery workers. 

No more _celery_ or _gunicorn_ process should be up and running (`ps -ef`).

4. [Within the container] Backup the current application database and images

Data : `sudo -u postgres pg_dump -Fc -d ailabeltooldb > ./backup/<hostname>-ailabeltooldb-`date +%Y%m%dT%H%M%S`-org.dump`

Images : `tar -cvf ./backup/<hostname>-aide_images-`date +%Y%m%dT%H%M%S`-org.tar -C /home/aide/images .`

5. [Within the container] Remove the database

Run the psql command to remove the database ailabeltooldb. 
And recreate it. 
`sudo -u postgres pg_dump -Fc -d ailabeltooldb > ./backup/<hostname>-ailabeltooldb-`date +%Y%m%dT%H%M%S`-org.dump`


6. [Within the container] Remove the images


7. [Within the container] Restore the new backup and images

Data : `sudo -u postgres pg_restore -Fc -d ailabeltooldb > ./backup/<hostname>-ailabeltooldb-<dump datetime>.dump`

Images : `tar -xvf ./backup/<hostname>-aide_images-<tar datetime>.tar -C /home/aide/images`

8. [Within the container] Start the application manually

`AIDE.sh stop`

Wait until completely started, including celery workers. 

Check the _celery_ and _gunicorn_ process up and running (`ps -ef`).

9. [From the host system] Test

Wait until the system is up.

Test using the URL of the app _http://localhost:8080_ , login and browse the test project.  

10. When everything is fine, exit the container bash

Hit CTRL-D or `exit` command.

11. [From the host system] Restart the container

```
#! /bin/bash
sudo docker-compose down
cd /app/aerial_wildlife_detection/docker
sudo service docker stop
sudo service docker start
git checkout AIDE+MELCC-<tag>
git pull
sudo docker-compose build
sudo docker-compose up &
```

Wait until completely started, including celery workers. 

Check the _celery_ and _gunicorn_ process up and running (`ps -ef`).

Test using the URL of the app _http://localhost:8080_ , login and browse the test project.  

12. [From the host system] Test

Wait until the system is up.

Test using the URL of the app _http://localhost:8080_ , login and browse the test project.  

13. Keep the backup for 2-4 weeks or the time needed to test that everything is fine. 
