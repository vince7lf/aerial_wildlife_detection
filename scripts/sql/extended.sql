-- Table: testVLF2.image_annotation

-- DROP TABLE "testVLF2".annotation_label;

CREATE TABLE IF NOT EXISTS "testVLF2".annotation_label
(
    annotation uuid NOT NULL,
    label uuid NOT NULL,
    CONSTRAINT annotation_label_pkey PRIMARY KEY (annotation, label),
    CONSTRAINT annotation_label_image_fkey FOREIGN KEY (label)
        REFERENCES "testVLF2".labelclass (id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE NO ACTION,
    CONSTRAINT annotation_label_annotation_fkey FOREIGN KEY (annotation)
        REFERENCES "testVLF2".annotation (id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE NO ACTION
)
WITH (
    OIDS = FALSE
)
TABLESPACE pg_default;

ALTER TABLE "testVLF2".annotation_label
    OWNER to ailabeluser;

ALTER TABLE "test".labelclass
ADD vascan_id INT NOT NULL DEFAULT -1,
ADD bryoquel_id INT DEFAULT NULL,
ADD coleo_vernacular_fr VARCHAR DEFAULT NULL,
ADD coleo_vernacular_en VARCHAR DEFAULT NULL,
ADD vascan_region VARCHAR NOT NULL DEFAULT 'Central',
ADD vascan_province VARCHAR NOT NULL DEFAULT 'Québec',
ADD vascan_port VARCHAR DEFAULT NULL,
ADD vascan_statut_repartition VARCHAR DEFAULT NULL,
ADD tsn INT DEFAULT NULL,
ADD coleo_category VARCHAR NOT NULL DEFAULT 'plantes';

ALTER TABLE "test".labelclass
ADD favorit BOOLEAN DEFAULT FALSE NOT NULL;

INSERT INTO "test".labelclassgroup
    (id, name, color)
VALUES ('10000001-1001-1001-1001-100000000001', 'Favorits', '#FF0000'),
     ('20000002-2002-2002-2002-200000000002', 'Tile', '#FFA500'),
     ('30000003-3003-3003-3003-300000000003', 'Image', '#FFA500');

-- C:\Program Files\pgAdmin 4\v5\runtime\pg_dump.exe --file "C:\\Users\\VINCEN~1.LE_\\DOWNLO~1\\LABELC~1.DUM" --host "206.12.94.82" --port "17685" --username "ailabeluser" --no-password --verbose --quote-all-identifiers --role "ailabeluser" --format=p --data-only --inserts --column-inserts --encoding "UTF8" --table "test.labelclass" "ailabeltooldb"
-- C:\Program Files\pgAdmin 4\v5\runtime\pg_dump.exe --file "C:\\Users\\VINCEN~1.LE_\\DOWNLO~1\\LABELC~1.SQL" --host "206.12.94.82" --port "17685" --username "ailabeluser" --no-password --verbose --quote-all-identifiers --role "ailabeluser" --format=p --data-only --inserts --column-inserts --encoding "UTF8" --table "test.labelclassgroup" "ailabeltooldb"