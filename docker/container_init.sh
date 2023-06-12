#!/bin/bash
#
# Docker container initialization script.
#
# 2020-22 Jaroslaw Szczegielniak, Benjamin Kellenberger
#

sudo systemctl enable redis-server.service
sudo service redis-server start 

echo "============================="
echo "Setup of database IS STARTING"
echo "============================="
pgVersion=10
dbName=$(python util/configDef.py --section=Database --parameter=name) 
dbUser=$(python util/configDef.py --section=Database --parameter=user)
dbPassword=$(python util/configDef.py --section=Database --parameter=password)
dbPort=$(python util/configDef.py --section=Database --parameter=port)
sudo sed -i "s/\s*port\s*=\s[0-9]*/port = $dbPort/g" /etc/postgresql/$pgVersion/main/postgresql.conf
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

# This run inside the container as there is not access to the postgreSQL data from outside of the container  (TODO)
# Backup the database
# Pre-requirements : clean the old Dictstates as it takes lots of memory. Usefull to see the loss statistics. Keep the statistics but set the binary dictstate to null (which will generate an error)
# Run at 2am at night EST time
# sudo -u postgres pg_dump -Fc -d ailabeltooldb > /home/aide/app/backup/tes2-graham-ailabeltooldb-`date +%Y%m%dT%H%M%S`.dump
(crontab -u root -l 2>/dev/null; echo "* 2 * * * /bin/bash /usr/local/sbin/backup_aide_data.sh") | crontab -u root -

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
