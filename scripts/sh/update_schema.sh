#! /bin/bash

schemas=$(sudo -u postgres psql -d ailabeltooldb -p 17685 -tc "select shortname from aide_admin.project;")

for schema in $schemas; do
        sudo -u postgres psql -d ailabeltooldb -p 17685 -c "\
                ALTER TABLE \"${schema}\".labelclass \
                        ADD favorit BOOLEAN DEFAULT FALSE NOT NULL; \
                INSERT INTO \"${schema}\".labelclassgroup (id, name, color) VALUES \
                        ('10000001-1001-1001-1001-100000000001', 'Favorits', '#FF0000'), \
                        ('20000002-2002-2002-2002-200000000002', 'Tile', '#FFA500'), \
                        ('30000003-3003-3003-3003-300000000003', 'Image', '#FFA500');"
done
