dump 23 jan
dump 29 jan

- lefocalcul : dump schéma du 23 jan 
CoveyHill_139_87_H01
CHAPP_SainteHelene_140_107_H01

- tes2 : dump db 29 jan
- lefocalcul : restore dump 29 jan
- lefocalcul : restore dump shéma  du 23 jan schémas 
CoveyHill_139_87_H01
CHAPP_SainteHelene_140_107_H01

Dump schema du 23 janvier: 
sudo -u postgres pg_dump -Fc -d ailabeltooldb --schema='"CoveyHill_139_87_H01"' > /home/aide/app/backup/lefocalcul-ailabeltooldb-23janv-CoveyHill_139_87_H01.dump; echo; 
sudo -u postgres pg_dump -Fc -d ailabeltooldb --schema='"CHAPP_SainteHelene_140_107_H01"' > /home/aide/app/backup/lefocalcul-ailabeltooldb-23janv-CHAPP_SainteHelene_140_107_H01.dump; echo; 

Dump schema du 29 janvier: 
sudo -u postgres pg_dump -Fc -d ailabeltooldb --schema='"CoveyHill_139_87_H01"' > /home/aide/app/backup/lefocalcul-ailabeltooldb-29janv-CoveyHill_139_87_H01.dump; echo; 
sudo -u postgres pg_dump -Fc -d ailabeltooldb --schema='"CHAPP_SainteHelene_140_107_H01"' > /home/aide/app/backup/lefocalcul-ailabeltooldb-29janv-CHAPP_SainteHelene_140_107_H01.dump; echo; 

# dump the database on tes2: 

connect to tes2 server using MobaXTerm
connect to the docker container

```
ubuntu@tes2:~$ sudo docker exec -it docker_aide_app_1 /bin/bash
```

dump the database
```
root@aide_app_host:/home/aide/app# sudo -u postgres pg_dump -Fc -d ailabeltooldb > /home/aide/app/backup/tes2-arbutus-ailabeltooldb-`date +%Y%m%dT%H%M%S`.dump
```

Download the dump file using MobaXTerm on the laptop

Move the file to lefocalcul instance. 
Requires the UdeM VPN

```
scp /mnt/c/Users/User/Downloads/MELCC-Res-Suivi-BdQc-Volet-4/backup/tes2-arbutus-ailabeltooldb-*20250129*.dump vfalher@lefocalcul-irbv.irbv.umontreal.ca:/tmp
```

Move the dump to the backup folder 

```
sudo mv /tmp/*.dump /app/aerial_wildlife_detection/backup/
```

# Restore a schema from tes2 in lefocalcul instance

Connect to lefocalcul server
VPN UdeM required. 

Restore full DB

If it's impossible to drop the database because there are current connections, stop the postgresql database and restart it : 

```
sudo service postgresql stop
sudo service postgresql start
```

# drop the database, recreate it, and initialize it. 
```
sudo -u postgres /usr/bin/dropdb -e --if-exists ailabeltooldb; echo; 
sudo -u postgres psql -tc "SELECT 1 FROM pg_roles WHERE pg_roles.rolname='ailabeluser'" | grep -q 1 || sudo -u postgres psql -c "CREATE USER ailabeluser WITH PASSWORD 'aiLabelUser';"; echo; 
sudo -u postgres psql -tc "SELECT 1 FROM pg_database WHERE datname = 'ailabeltooldb'" | grep -q 1 || sudo -u postgres psql -c "CREATE DATABASE ailabeltooldb WITH OWNER ailabeluser CONNECTION LIMIT -1;"; echo; 
sudo -u postgres psql -c "GRANT CONNECT ON DATABASE ailabeltooldb TO ailabeluser;"; echo;
sudo -u postgres psql -d ailabeltooldb -c "CREATE EXTENSION IF NOT EXISTS \"uuid-ossp\";"; echo;
sudo -u postgres psql -d ailabeltooldb -c "GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO ailabeluser;";echo;
```

Restore one of the database, basaed on the date
```
sudo -u postgres pg_restore -d ailabeltooldb ./backup/tes2-arbutus-ailabeltooldb-20250129T155307.dump; echo;
sudo -u postgres pg_restore -d ailabeltooldb ./backup/tes2-arbutus-ailabeltooldb-20250123T212625.dump; echo;
```

Then restore only the schema, dropping it and restoring it. 

```
sudo -u postgres psql -d ailabeltooldb -c 'DROP SCHEMA "CoveyHill_139_87_H01" CASCADE;'; echo; 
sudo -u postgres pg_restore -d ailabeltooldb ./backup/lefocalcul-ailabeltooldb-23janv-CoveyHill_139_87_H01.dump; echo; 

sudo -u postgres psql -d ailabeltooldb -c 'DROP SCHEMA "CHAPP_SainteHelene_140_107_H01" CASCADE;'; echo; 
sudo -u postgres pg_restore -d ailabeltooldb ./backup/tes2-arbutus-ailabeltooldb-CHAPP_SainteHelene_140_107_H01-20250129T155236.dump; echo; 
```