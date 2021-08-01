# Set up the database

AIDE uses [PostgreSQL](https://www.postgresql.org/) to store labels, predictions, file paths and metadata. The following instructions apply for recent versions of Debian-based Linux distributions, such as Ubuntu.
Note that AIDE requires PostgreSQL >= 9.5 (it has been tested with version 10).

## Define database details

The instructions below assume you have [installed the AIDE project](install.md) and [configured the project configuration file](configure_settings.md) on the machine that is dedicated to running the database.
However, for the database operation, this is not required. If you wish to skip these steps you will have to manually provide the four parameters below (replace `$(python util/configDef.py ...)` with the respective values).

```bash
    # Run these command
    # Need to have AIDE_CONFIG_PATH setup before
    export AIDE_CONFIG_PATH=/app/aerial_wildlife_detection/config/settings.ini
    
    export PYTHONPATH=.     # run this line if you get import error messages

    dbName=$(python util/configDef.py --section=Database --parameter=name)
    dbUser=$(python util/configDef.py --section=Database --parameter=user)
    dbPassword=$(python util/configDef.py --section=Database --parameter=password)
    dbPort=$(python util/configDef.py --section=Database --parameter=port)
```


## Install PostgreSQL server

```bash
    # specify postgres version you wish to use (must be >= 9.5)
    version=10


    # install packages
    sudo apt-get update && sudo apt-get install -y wget
    echo "deb http://apt.postgresql.org/pub/repos/apt/ $(lsb_release -cs)-pgdg main" | sudo tee /etc/apt/sources.list.d/pgdg.list
    wget --quiet -O - https://www.postgresql.org/media/keys/ACCC4CF8.asc | sudo apt-key add -
    sudo apt-get update && sudo apt-get install -y postgresql-$version


    # update the postgres configuration with the correct port
    sudo sed -i "s/\s*port\s*=\s[0-9]*/port = $dbPort/g" /etc/postgresql/$version/main/postgresql.conf


    # modify authentication
    # NOTE: you might want to manually adapt these commands for increased security; the following makes postgres listen to all global connections
    sudo sed -i "s/\s*#\s*listen_addresses\s=\s'localhost'/listen_addresses = '\*'/g" /etc/postgresql/$version/main/postgresql.conf
    echo "host    all             all             0.0.0.0/0               md5" | sudo tee -a /etc/postgresql/$version/main/pg_hba.conf > /dev/null


    # restart postgres and auto-launch it on boot
    sudo service postgresql restart
    sudo systemctl enable postgresql


    # If AIDE is run on MS Azure: TCP connections are dropped after 4 minutes of inactivity
    # (see https://docs.microsoft.com/en-us/azure/load-balancer/load-balancer-outbound-connections#idletimeout)
    # This is fatal for our database connection system, which keeps connections open.
    # To avoid idling/dead connections, we thus use Ubuntu's keepalive timer:
    if ! sudo grep -q ^net.ipv4.tcp_keepalive_* /etc/sysctl.conf ; then
        echo "net.ipv4.tcp_keepalive_time = 60" | sudo tee -a "/etc/sysctl.conf" > /dev/null
        echo "net.ipv4.tcp_keepalive_intvl = 60" | sudo tee -a "/etc/sysctl.conf" > /dev/null
        echo "net.ipv4.tcp_keepalive_probes = 20" | sudo tee -a "/etc/sysctl.conf" > /dev/null
    else
        sudo sed -i "s/^\s*net.ipv4.tcp_keepalive_time.*/net.ipv4.tcp_keepalive_time = 60 /g" /etc/sysctl.conf
        sudo sed -i "s/^\s*net.ipv4.tcp_keepalive_intvl.*/net.ipv4.tcp_keepalive_intvl = 60 /g" /etc/sysctl.conf
        sudo sed -i "s/^\s*net.ipv4.tcp_keepalive_probes.*/net.ipv4.tcp_keepalive_probes = 20 /g" /etc/sysctl.conf
    fi
    sudo sysctl -p
```

## postgresql folders, including logs
* /var/log/postgresql: main logs
* /etc/init.d/postgresql: service
* /var/lib/postgresql/10/main/pg_log: all other logs
* /etc/postgresql/10/main: configuration files


## Activate the postgresql logs to see statements
As root.
`vi /etc/postgresql/10/main/postgresql.conf`

```
#------------------------------------------------------------------------------
# ERROR REPORTING AND LOGGING
#------------------------------------------------------------------------------

# - Where to Log -

log_destination = 'stderr'              # Valid values are combinations of
                                        # stderr, csvlog, syslog, and eventlog,
                                        # depending on platform.  csvlog
                                        # requires logging_collector to be on.

# This is used when logging to stderr:
logging_collector = on          # Enable capturing of stderr and csvlog
                                        # into log files. Required to be on for
                                        # csvlogs.
                                        # (change requires restart)

# These are only used if logging_collector is on:
log_directory = 'pg_log'                        # directory where log files are written,
                                        # can be absolute or relative to PGDATA
                                        # cd /var/lib/postgresql/10/main/pg_log
log_filename = 'postgresql-%Y-%m-%d_%H%M%S.log' # log file name pattern,
                                        # can include strftime() escapes
log_file_mode = 0600                    # creation mode for log files,
                                        # begin with 0 to use octal notation
log_truncate_on_rotation = off          # If on, an existing log file with the
                                        # same name as the new log file will be
                                        # truncated rather than appended to.
                                        # But such truncation only occurs on
                                        # time-driven rotation, not on restarts
                                        # or size-driven rotation.  Default is
                                        # off, meaning append to existing files
                                        # in all cases.
log_rotation_age = 1d                   # Automatic rotation of logfiles will
                                        # happen after that time.  0 disables.
log_rotation_size = 10MB                # Automatic rotation of logfiles will
                                        # happen after that much log output.
                                        # 0 disables.

log_connections = on
log_disconnections = on

log_hostname = on

log_statement = 'all'                   # none, ddl, mod, all


```

## Validate postgresql.conf
type `psql` in a console. Any error within the configurarion will be printed. 

```
root@tes2:/var/log/postgresql# psql
Error: invalid line 456 in /etc/postgresql/10/main/postgresql.conf: x#log_statement = 'all'                     # none, ddl, mod, all
```

## Restart the service
```
sudo service postgresql restart
or
sudo /etc/init.d/postgresql restart
```

## check main postgresql logs

To check if service restarted successfully. Otherwise the 'listening' parts would not be displayed. 

```
root@tes2:/var/log/postgresql# tail postgresql-10-main.log
2021-07-11 16:19:21.540 UTC [1356] LOG:  received smart shutdown request
2021-07-11 16:19:21.595 UTC [1356] LOG:  worker process: logical replication launcher (PID 1556) exited with exit code 1
2021-07-11 16:19:21.596 UTC [1549] LOG:  shutting down
2021-07-11 16:19:21.671 UTC [1356] LOG:  database system is shut down
2021-07-11 16:31:07.451 UTC [12495] LOG:  listening on IPv4 address "0.0.0.0", port 17685
2021-07-11 16:31:07.451 UTC [12495] LOG:  listening on IPv6 address "::", port 17685
2021-07-11 16:31:07.453 UTC [12495] LOG:  listening on Unix socket "/var/run/postgresql/.s.PGSQL.17685"
2021-07-11 16:31:07.513 UTC [12495] LOG:  redirecting log output to logging collector process
2021-07-11 16:31:07.513 UTC [12495] HINT:  Future log output will appear in directory "pg_log".
```


## Create a new database and the main user account
This needs to be done from the installation root of AIDE, with the correct environment activated.

```bash
    sudo -u postgres psql -c "CREATE USER $dbUser WITH PASSWORD '$dbPassword';"
    sudo -u postgres psql -c "CREATE DATABASE $dbName WITH OWNER $dbUser CONNECTION LIMIT -1;"
    sudo -u postgres psql -c "GRANT CONNECT ON DATABASE $dbName TO $dbUser;"
    sudo -u postgres psql -d $dbName -c "CREATE EXTENSION IF NOT EXISTS \"uuid-ossp\";"

    # NOTE: needs to be run after init
    sudo -u postgres psql -d $dbName -c "GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO $dbUser;"
```


## Setup the database schema
We do that using the newly created user account instead of the postgres user:

```bash
    python setup/setupDB.py
```


## Clean up

If you have used the settings file [above](#define-database-details) to get the database details, you can now remove the AIDE code base (and Python environment) from the database server, unless the machine hosts any other AIDE module(s).
