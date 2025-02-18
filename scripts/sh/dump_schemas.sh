#!/bin/bash

# sudo /bin/bash /app/aerial_wildlife_detection/scripts/sh/dump_schema.sh | sudo tee /var/log/dump_schema_$(date +\%Y\%m\%dT\%H\%M).log 2>&1
# 0 6 * * * /bin/bash /app/aerial_wildlife_detection/scripts/sh/dump_schema.sh > /var/log/dump_schema_$(date +\%Y\%m\%dT\%H\%M).log 2>&1

set -x
set -e
set -u
set -o pipefail

date

# Database name
db_name="ailabeltooldb"

# Base backup directory
backup_base="/home/aide/app/backup"

# Retrieve schemas dynamically excluding system and public schemas
sql_query="SELECT schema_name
           FROM information_schema.schemata
           WHERE schema_name NOT LIKE 'pg_%'
             AND schema_name NOT LIKE 'test%'
             AND schema_name != 'public'
             AND schema_name != 'information_schema';"

mapfile -t schemas < <(sudo -u postgres psql -d "$db_name" -t -c "$sql_query" |
                       awk '{gsub(/[ \t]/, ""); if (length($0) > 0) print}')

# Iterate over schemas and perform backups
for schema in "${schemas[@]}"; do
    timestamp=$(date +"%Y%m%dT%H%M%S")
    output_dir="$backup_base/$schema"

    # Ensure the output directory exists
    mkdir -p "$output_dir"

    # Perform the backup
    echo "Backing up schema: $schema"
    sudo -u postgres pg_dump -Fc -d "$db_name" --schema="\"$schema\"" > "$output_dir/tes2-arbutus-$db_name-$schema-$timestamp.dump"

done

echo "All backups completed."

date
echo