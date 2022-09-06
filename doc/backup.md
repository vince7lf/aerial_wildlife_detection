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

Make sure there is no other connection opened with the database, like pg_admin or another client.

Reset the postgresql service if needed :

```
sudo service postgresql stop
sudo service postgresql start
```

Or you will have a returned message error like this :
```
vince@vince-VirtualBox:~$ sudo -u postgres psql -c "DROP DATABASE IF EXISTS ailabeltooldb;"
[sudo] password for vince:
ERROR:  database "ailabeltooldb" is being accessed by other users
DETAIL:  There is 1 other session using the database.
```

In that case reset the postgresql service (stop restart, see above) 

Drop the database using dropdb or SQL command :  
```
vince@vince-VirtualBox:~$ sudo -u postgres /usr/bin/dropdb -e -i --if-exists ailabeltooldb
Database "ailabeltooldb" will be permanently removed.
Are you sure? (y/n) y
SELECT pg_catalog.set_config('search_path', '', false)
DROP DATABASE IF EXISTS ailabeltooldb;

or

vince@vince-VirtualBox:~$ sudo -u postgres psql -c "DROP DATABASE IF EXISTS ailabeltooldb;"
DROP DATABASE

```

Add the user in case this is a new fresh install of postgreSQL. Command is the same used when creating the project. 
```
vince@vince-VirtualBox:~$ sudo -u postgres psql -tc "SELECT 1 FROM pg_roles WHERE pg_roles.rolname='ailabeluser'" | grep -q 1 || sudo -u postgres psql -c "CREATE USER ailabeluser WITH PASSWORD 'aiLabelUser';"
```

Recreate the database. Command is the same used when creating the project. 
```
vince@vince-VirtualBox:~$ sudo -u postgres psql -tc "SELECT 1 FROM pg_database WHERE datname = 'ailabeltooldb'" | grep -q 1 || sudo -u postgres psql -c "CREATE DATABASE ailabeltooldb WITH OWNER ailabeluser CONNECTION LIMIT -1;"
CREATE DATABASE
```
Grant the user to access the database. Command is the same used when creating the project. 
```
vince@vince-VirtualBox:~$ sudo -u postgres psql -c "GRANT CONNECT ON DATABASE ailabeltooldb TO ailabeluser;"
GRANT
vince@vince-VirtualBox:~$ sudo -u postgres pg_restore -d ailabeltooldb /app/backup/vbox-ailabeltooldb-20220803T084827.dump
```

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
ubuntu@tes2:/app/images$ sudo tar -cvf /app/aerial_wildlife_detection/backup/<hostname>-aide_images-`date +%Y%m%dT%H%M%S`.tar -C /app/var/lib/docker/volumes/aide_images/_data .  
```

### Transfer the images

After taring the images folder, you can use the _scp_ command to copy it to the other host.

```
ubuntu@tes2:/app/images$ scp /app/aerial_wildlife_detection/backup/<hostname>-aide_images-`date +%Y%m%dT%H%M%S`.tar user@host:/path/to/app/folder/backup   
```

From the localhost to the virtualbox, use the MobaXterm internal terminal shell : 

```
/home/mobaxterm  scp -P 7722 /drives/c/Users/User/Downloads/gcp-ailabeltooldb-20220901T205210.dump vince@127.0.0.1:/home/vince
gcp-ailabeltooldb-20220901T205210.dump
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

Check the _celery_ and _gunicorn_ process up and running (`ps -ef | grep python`).

Test using the URL of the app _http://localhost:8080_ , login and browse the test project.  

2. [From the host system] Connect to the container bash

`sudo docker exec -it docker_aide_app_1 /bin/bash` 

Result will be a prompt inside the container. like `root@aide_app_host:/home/aide/app#`.  

3. [Within the container] Stop the application manually with the command provided. 

`bash AIDE.sh stop` will stop the docker container (killing guniron processes stops the docker container)

Instead just stop the celery workers and reset the postgreslq service (trop / start):

```
export PYTHONPATH=/home/aide/app
export AIDE_CONFIG_PATH=/home/aide/app/docker/settings.ini
export AIDE_MODULES=LabelUI,AIController,AIWorker,FileServer
/opt/conda/bin/celery -A celery_worker control shutdown
# pkill gunicorn # do not kill gunicorn processes as it will stop the docker container.   
sudo service postgresql stop
sudo service postgresql start
```

Wait until completely stopped, including celery workers. 

No more _celery_ or _gunicorn_ process should be up and running (`ps -ef | grep python`).

4. [Within the container] Backup the current application database and images

Data : `sudo -u postgres pg_dump -Fc -d ailabeltooldb > ./backup/<hostname>-ailabeltooldb-`date +%Y%m%dT%H%M%S`-org.dump`

Images : `tar -cvf ./backup/<hostname>-aide_images-`date +%Y%m%dT%H%M%S`-org.tar -C /home/aide/images .`

5. [Within the container] Remove the database

Run the psql command to remove the database ailabeltooldb. 
`vince@vince-VirtualBox:~$ sudo -u postgres /usr/bin/dropdb -e -i --if-exists ailabeltooldb`

or 

`vince@vince-VirtualBox:~$ sudo -u postgres psql -c "DROP DATABASE IF EXISTS ailabeltooldb;"`

6. [Within the container] Remove the images


7. [Within the container] Restore the new backup and images

Data :

```
sudo -u postgres psql -tc "SELECT 1 FROM pg_roles WHERE pg_roles.rolname='ailabeluser'" | grep -q 1 || sudo -u postgres psql -c "CREATE USER ailabeluser WITH PASSWORD 'aiLabelUser';"
sudo -u postgres psql -tc "SELECT 1 FROM pg_database WHERE datname = 'ailabeltooldb'" | grep -q 1 || sudo -u postgres psql -c "CREATE DATABASE ailabeltooldb WITH OWNER ailabeluser CONNECTION LIMIT -1;"
sudo -u postgres psql -c "GRANT CONNECT ON DATABASE ailabeltooldb TO ailabeluser;"
sudo -u postgres psql -d ailabeltooldb -c "CREATE EXTENSION IF NOT EXISTS \"uuid-ossp\";"
sudo -u postgres psql -d ailabeltooldb -c "GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO ailabeluser;"

sudo -u postgres pg_restore -d ailabeltooldb /app/backup/vbox-ailabeltooldb-20220803T084827.dump
```

Images : `tar -xvf ./backup/<hostname>-aide_images-<tar datetime>.tar -C /home/aide/images`

8. [Within the container] Start the application manually

No need to start the application manually as it is still running, only the connection to the database was dropped while dropping and restoring the database.  

Check the _celery_ and _gunicorn_ process up and running (`ps -ef | grep python`).

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

Check the _celery_ and _gunicorn_ process up and running (`ps -ef | grep python`).

Test using the URL of the app _http://localhost:8080_ , login and browse the test project.  

12. [From the host system] Test

Wait until the system is up.

Test using the URL of the app _http://localhost:8080_ , login and browse the test project.  

13. Keep the backup for 2-4 weeks or the time needed to test that everything is fine. 


## Add labelclassgroup 'favorits', 'Tile' and 'Image' to existing project

Connect to the docker shell:
```
(aide) ubuntu@tes2:/app/aerial_wildlife_detection/docker$ sudo docker exec -it docker_aide_app_1 /bin/bash
```

Connect to the database
```
root@aide_app_host:/home/aide/app# sudo -u postgres psql -d ailabeltooldb
```

Check the existing projects
```
ailabeltooldb=# select shortname from aide_admin.project;
```

Execute the SQL on the right schema and table labelclassgroup :
```
ailabeltooldb=# ALTER TABLE "tests_vincent".labelclass
ADD favorit BOOLEAN DEFAULT FALSE NOT NULL;

ailabeltooldb=# INSERT INTO tests_vincent.labelclassgroup
    (id, name, color)
VALUES ('10000001-1001-1001-1001-100000000001', 'Favorits', '#FF0000'),
     ('20000002-2002-2002-2002-200000000002', 'Tile', '#FFA500'),
     ('30000003-3003-3003-3003-300000000003', 'Image', '#FFA500');
INSERT 0 3
```

## psql shortcuts

- help command : ailabeltooldb=# \?
- list of schemas : ailabeltooldb=# \dn
- list of tables for a specific schema : ailabeltooldb=# \dt aide_admin.*
- turn display to row : ailabeltooldb=# \x
- quit : ailabeltooldb=# \q
- drop schema : ailabeltooldb=# drop schema "test_tiles_docker" CASCADE;


## Remove a project

Drop project ands schema from database 

```
sudo -u postgres psql -d ailabeltooldb -c "delete from aide_admin.authentication where project = '<project-short-name>';"
sudo -u postgres psql -d ailabeltooldb -c "delete from aide_admin.project where shortname = '<project-short-name>';"
sudo -u postgres psql -d ailabeltooldb -c "drop schema IF EXISTS \"<project-short-name>\" CASCADE;"
```

Delete images : 

```
rm -rf /app/images/<project-short-name>
```


## From a newly created postgreSQL instance

Some external objects needs to be added to the postgreSQL instances on top of the database itself.  

Replace the variables by their real values (dbUser, dbPassword, dbName) 
```
sudo -u postgres psql -tc "SELECT 1 FROM pg_roles WHERE pg_roles.rolname='$dbUser'" | grep -q 1 || sudo -u postgres psql -c "CREATE USER $dbUser WITH PASSWORD '$dbPassword';"
sudo -u postgres psql -tc "SELECT 1 FROM pg_database WHERE datname = '$dbName'" | grep -q 1 || sudo -u postgres psql -c "CREATE DATABASE $dbName WITH OWNER $dbUser CONNECTION LIMIT -1;"
sudo -u postgres psql -c "GRANT CONNECT ON DATABASE $dbName TO $dbUser;"
sudo -u postgres psql -d $dbName -c "CREATE EXTENSION IF NOT EXISTS \"uuid-ossp\";"
sudo -u postgres psql -d $dbName -c "GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO $dbUser;"
```

