#!/bin/bash

# sudo /bin/bash /app/aerial_wildlife_detection/scripts/sh/clean_duplicates.sh | sudo tee /var/log/clean_duplicates_$(date +\%Y\%m\%dT\%H\%M).log 2>&1
# 0 6 * * * /bin/bash /app/aerial_wildlife_detection/scripts/sh/clean_duplicates.sh > /var/log/clean_duplicates_$(date +\%Y\%m\%dT\%H\%M).log 2>&1

set -ex

date

# Base directory where the subfolders are located
BASE_DIR="/app/aerial_wildlife_detection/backup"

# List of subfolders to process
SUBFOLDERS=(
    "ABT_ParcAiguebelle-100_92_H01"
    "ABT_Temiscamingue_103_85_H01"
    "AT_ParcOpemican_A_104_81_H01_2023"
    "BSL_ParcBic_140_126_H02"
    "BSL_RiviereDuLoup_142_120_H01"
    "CHAPP_Bellechasse_141_108_H01"
    "CHAPP_Bellechasse_141_108_H03"
    "CHAPP_Bellechasse_141_108_H04"
    "CHAPP_SainteHelene_140_107_H01"
    "CHAPP_SainteHelene_140_107_H03"
    "CHAPP_SainteHelene_140_107_H04"
    "CN_Portneuf_133_106_H01_2023"
    "CN_StSimeon_138_120_H01_2023"
    "CoveyHill_139_87_H01"
    "CoveyHill_139_87_H03"
    "CoveyHill_139_87_H05"
    "ESTR_LeGranit_148_101_H01"
    "GIM_BaieAuChene_149_133_H01"
    "GIM_HauteGaspesie_145_141_H01_2023"
    "LANLAU_ParcMontTremblantOuest_129_93_H01"
    "LAUR_ValleedelaGatineau_desIles_123_89_H01_2023"
    "LAU_Tapini_AntoineLabelle_122_94_H01"
    "LargeTeaField_137_87_H01"
    "LargeTeaField_137_87_H03"
    "LargeTeaField_137_87_H04"
    "MAUR_LacALaTortue_135_101_H03"
    "MAUR_LacALaTortue_135_101_H04"
    "MAUR_RedMill_137_101_H03"
    "NQC_Obatogamau_113_113_H01"
    "NUNA_Kangiqsualujjuaq_90_189_H03_2023"
    "NUNA_Kangiqsualujjuaq_90_189_T01_2023"
    "OUTA_ParcdelaGatineau_127_83_H01_2023"
    "OUTA_ValleedelaGatineau_Kazabazua_124_86_H02_2023"
    "OUT_Dumont_Pontiac_122_84_H01"
    "SLSJ_LaDore_122_111_H01"
    "SLSJ_LacSimoncouche_132_116_H03"
)

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
