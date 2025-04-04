import csv
import json

# Specify the input CSV file and the output JSON file
# csv_file_path = '/mnt/c/Users/vincent.le.falher/Downloads/AIDE+MELCC/MELCC-Res-Suivi-BdQc-Volet-4/etiquettes_annotation_selection_CPK_CLG_serie1_vascan.csv'  # Update this to the name of your CSV file
# csv_file_path = '/mnt/c/Users/vincent.le.falher/Downloads/AIDE+MELCC/MELCC-Res-Suivi-BdQc-Volet-4/backup/CoveyHill_139_87_H03_labelclass_20250127_50.csv'  # Update this to the name of your CSV file
# json_file_path = '/mnt/c/Users/vincent.le.falher/Downloads/AIDE+MELCC/MELCC-Res-Suivi-BdQc-Volet-4/MELCC-Res-Suivi-BdQc-Volet-4-labels_v20250121.json'

csv_file_path = '/mnt/c/Users/vincent.le.falher/Downloads/AIDE+MELCC/MELCC-Res-Suivi-BdQc-Volet-4/etiquettes_annotation_selection_serie3_20250404_vlf_ready_fixed.csv'  # Update this to the name of your CSV file
json_file_path = '/mnt/c/Users/vincent.le.falher/Downloads/AIDE+MELCC/MELCC-Res-Suivi-BdQc-Volet-4/etiquettes_annotation_selection_serie3_20250404.json'

# Define a list to hold the processed data
species_list = []

# Open the CSV file and process it
with open(csv_file_path, mode='r', encoding='utf-8') as csv_file:
    csv_reader = csv.DictReader(csv_file)

    for row in csv_reader:
        # Skip rows with missing required fields
        if not row['name']:
            continue

        # Create a dictionary for each species
        species_dict = {
            "name": row["name"],
            "color": "#095797",
            "vascan_id": row["vascan_id"] or "-1",
            "coleo_vernacular_fr": row["coleo_vernacular_fr"] or "NA",
            "coleo_vernacular_en": row["coleo_vernacular_en"] or "NA",
            "vascan_port": row["vascan_port"] or "NA",
            "vascan_statut_repartition": row["vascan_statut_repartition"] or "NA"
        }

        # Append the dictionary to the list
        species_list.append(species_dict)

# Wrap the list in a dictionary under the key "Espèce"
output_data = {"Espèce": species_list}

# Write the output JSON file
with open(json_file_path, mode='w', encoding='utf-8') as json_file:
    json.dump(output_data, json_file, ensure_ascii=False, indent=4)

print(f"JSON file has been generated: {json_file_path}")
