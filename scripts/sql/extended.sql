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