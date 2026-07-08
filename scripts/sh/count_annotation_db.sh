#!/bin/bash

DB=ailabeltooldb

# Get the list of schemas containing 'annotation_label' table
schemas=$(sudo -u postgres psql -d "$DB" -t -A -c \
  "SELECT table_schema FROM information_schema.tables WHERE table_name = 'annotation_label'")

# Loop through each schema and count rows
for schema in $schemas; do
  count=$(sudo -u postgres psql -d "$DB" -t -A -c \
    "SELECT count(*) FROM \"$schema\".annotation_label" 2>/dev/null)
  printf "%s;%s\n" "$schema" "$count"
done
