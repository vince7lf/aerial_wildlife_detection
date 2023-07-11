#!/bin/bash
#
# Docker container initialization script.
#
# 2020-22 Jaroslaw Szczegielniak, Benjamin Kellenberger
#
set -x

echo "alias Hg='history | grep '" > /root/.bash_aliases
echo "alias H='history'" >> /root/.bash_aliases
echo "alias lh='ls -altrh'" >> /root/.bash_aliases

lsb_release -a
uname -a
landscape-sysinfo

echo PYTHONPATH=${PYTHONPATH}
echo AIDE_CONFIG_PATH=${AIDE_CONFIG_PATH}
echo AIDE_MODULES=${AIDE_MODULES}

host=$(python util/configDef.py --section=Server --parameter=static_host)

sudo systemctl enable redis-server.service
sudo service redis-server start 

echo "============================="
echo "Setup of database IS STARTING"
echo "============================="
pgVersion=10
dbName=$(python util/configDef.py --section=Database --parameter=name)
export AIDE_DB=dbName
dbUser=$(python util/configDef.py --section=Database --parameter=user)
dbPassword=$(python util/configDef.py --section=Database --parameter=password)
dbPort=$(python util/configDef.py --section=Database --parameter=port)
sudo sed -i "s/\s*port\s*=\s[0-9]*/port = $dbPort/g" /etc/postgresql/$pgVersion/main/postgresql.conf

# 20230703 Avoid Error: Config owner (postgres:105) and data owner (systemd-resolve:104) do not match, and config owner is not root
chown -R postgres:postgres /etc/postgresql/$pgVersion/main
chown -R postgres:postgres /var/lib/postgresql/$pgVersion/main
sudo chmod 700 /var/lib/postgresql/$pgVersion/main

sudo service postgresql restart

sudo -u postgres psql -p $dbPort -tc "SELECT 1 FROM pg_roles WHERE pg_roles.rolname='$dbUser'" | grep -q 1 || sudo -u postgres psql -p $dbPort -c "CREATE USER \"$dbUser\" WITH PASSWORD '$dbPassword';"
sudo -u postgres psql -p $dbPort -tc "SELECT 1 FROM pg_database WHERE datname = '$dbName'" | grep -q 1 || sudo -u postgres psql -p $dbPort -c "CREATE DATABASE \"$dbName\" WITH OWNER \"$dbUser\" CONNECTION LIMIT -1;"
sudo -u postgres psql -p $dbPort -c "GRANT CREATE, CONNECT ON DATABASE \"$dbName\" TO \"$dbUser\";"
sudo -u postgres psql -p $dbPort -d $dbName -c "CREATE EXTENSION IF NOT EXISTS \"uuid-ossp\";"
sudo -u postgres psql -p $dbPort -d $dbName -c "GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO \"$dbUser\";"

# Create DB schema
python setup/setupDB.py
sudo systemctl enable postgresql.service

sudo service postgresql start

# setup the cronjob to backup the database
mkdir -p /home/aide/app/backup
echo AIDE_ENV=${AIDE_ENV} > /home/aide/app/aide_env.sh
echo AIDE_VERSION=${AIDE_VERSION} >> /home/aide/app/aide_env.sh
(sudo crontab -u root -l 2>/dev/null; echo "0 2 * * * /bin/bash /usr/local/sbin/aide_backup_data.sh 2>&1 | tee /var/log/aide_backup_data.sh-\$(date +\%Y\%m\%dT\%H\%M\%S).log") | sudo crontab -u root -

echo "=============================="
echo "Setup of database IS COMPLETED"
echo "=============================="
echo ""

echo "=========================="
echo "RABBITMQ SETUP IS STARTING"
echo "=========================="
# I need to set rabbitmq user and permissions here, as it takes hostname (dynamic) during build of previous phases as part of config folder :-()
RMQ_username=aide
RMQ_password=password # This should never be left here for any serious use of course
sudo service rabbitmq-server start
# add the user we defined above
sudo rabbitmqctl list_users|grep -q $RMQ_username || sudo rabbitmqctl add_user $RMQ_username $RMQ_password

# add new virtual host
sudo rabbitmqctl list_vhosts|grep -q 'aide_vhost' || sudo rabbitmqctl add_vhost aide_vhost

# set permissions
sudo rabbitmqctl set_permissions -p aide_vhost $RMQ_username ".*" ".*" ".*"
sudo systemctl enable rabbitmq-server.service
echo "==========================="
echo "RABBITMQ SETUP IS COMPLETED"
echo "==========================="
echo ""
# If AIDE is run on MS Azure: TCP connections are dropped after 4 minutes of inactivity
# (see https://docs.microsoft.com/en-us/azure/load-balancer/load-balancer-outbound-connections#idletimeout)
# This is fatal for our database connection system, which keeps connections open.
# To avoid idling/dead connections, we thus use Ubuntu's keepalive timer:
if ! grep -q ^net.ipv4.tcp_keepalive_* /etc/sysctl.conf ; then
    echo "net.ipv4.tcp_keepalive_time = 60" | tee -a "/etc/sysctl.conf" > /dev/null
    echo "net.ipv4.tcp_keepalive_intvl = 60" | tee -a "/etc/sysctl.conf" > /dev/null
    echo "net.ipv4.tcp_keepalive_probes = 20" | tee -a "/etc/sysctl.conf" > /dev/null
else
    sed -i "s/^\s*net.ipv4.tcp_keepalive_time.*/net.ipv4.tcp_keepalive_time = 60 /g" /etc/sysctl.conf
    sed -i "s/^\s*net.ipv4.tcp_keepalive_intvl.*/net.ipv4.tcp_keepalive_intvl = 60 /g" /etc/sysctl.conf
    sed -i "s/^\s*net.ipv4.tcp_keepalive_probes.*/net.ipv4.tcp_keepalive_probes = 20 /g" /etc/sysctl.conf
fi
sysctl -p

# file server: static files directory
fsDir=$(python util/configDef.py --section=FileServer --parameter=staticfiles_dir) 
mkdir -p $fsDir
