# Structure de la BD AIDE+MELCC

## labelclass
Les champs en gras sont obligatoires

Champs | Type | Description | Options
------------ | ------------- | ------------- | -------------
**id** | nombre entier | Identifiant unique | |
created_at | date-heure | Date et heure de création | |
updated_at | date-heure | Date et heure de mise à jour | |# labelclass


id | uuid | DEFAULT | uuid_generate_v4(),
name VARCHAR NOT NULL,
idx SERIAL UNIQUE NOT NULL,
timeCreated TIMESTAMPTZ NOT NULL DEFAULT NOW(),
color VARCHAR DEFAULT '#095797',
labelclassgroup uuid,
keystroke SMALLINT UNIQUE,
hidden BOOLEAN NOT NULL DEFAULT FALSE,
vascan_id INT NOT NULL,
bryoquel_id INT DEFAULT NULL,
coleo_vernacular_fr VARCHAR DEFAULT NULL,
coleo_vernacular_en VARCHAR DEFAULT NULL,
vascan_region VARCHAR NOT NULL DEFAULT 'Central',
vascan_province VARCHAR NOT NULL DEFAULT 'Québec',
vascan_port VARCHAR DEFAULT NULL,
vascan_statut_repartition VARCHAR DEFAULT NULL,
tsn INT DEFAULT NULL,
coleo_category VARCHAR NOT NULL DEFAULT 'plantes',
PRIMARY KEY (id),
FOREIGN KEY (labelclassgroup) REFERENCES {id_labelclassGroup}(id)

## labelclassgroup

