#!/bin/bash

# sudo /bin/bash /app/aerial_wildlife_detection/scripts/sh/clean_duplicates.sh | sudo tee /var/log/clean_duplicates_$(date +\%Y\%m\%dT\%H\%M).log 2>&1
# 0 6 * * * /bin/bash /app/aerial_wildlife_detection/scripts/sh/clean_duplicates.sh > /var/log/clean_duplicates_$(date +\%Y\%m\%dT\%H\%M).log 2>&1

set -ex

date

# Base directory where the subfolders are located
BASE_DIR="/app/aerial_wildlife_detection/backup"

# Find all immediate subdirectories in the BASE_DIR
echo "Discovering subfolders in $BASE_DIR..."
SUBFOLDERS=()
while IFS= read -r folder; do
  SUBFOLDERS+=("$(basename "$folder")")
done < <(find "$BASE_DIR" -mindepth 1 -maxdepth 1 -type d)

# Iterate through each subfolder
for folder in "${SUBFOLDERS[@]}"; do
    TARGET_DIR="$BASE_DIR/$folder"

    if [[ ! -d "$TARGET_DIR" ]]; then
        echo "Skipping: $TARGET_DIR (not found)"
        continue
    fi

    echo "Processing: $TARGET_DIR"
    cd "$TARGET_DIR" || exit

    # Find duplicates by file size
    declare -A size_map

    for file in *.dump; do
        [[ -f "$file" ]] || continue

        size=$(stat --printf="%s" "$file")

        # If a duplicate size is found, delete the older file
        if [[ -n "${size_map[$size]}" ]]; then
            echo "Removing duplicate: $file (size: $size bytes)"
            rm -f "$file"
        else
            size_map[$size]="$file"
        fi
    done

    unset size_map

done
