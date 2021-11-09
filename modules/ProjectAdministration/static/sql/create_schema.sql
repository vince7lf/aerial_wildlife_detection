/*
    Template used to initialize a new schema in the course of
    creating a new project.
    Requires substitutions for identifiers and annotation/prediction
    type fields.

    2019-21 Benjamin Kellenberger
*/


/* base schema */
CREATE SCHEMA {id_schema}
    AUTHORIZATION {id_auth};


/* base tables */
CREATE TABLE IF NOT EXISTS {id_image} (      
    id uuid DEFAULT uuid_generate_v4(),
    filename VARCHAR UNIQUE NOT NULL,
    corrupt BOOLEAN,
    isGoldenQuestion BOOLEAN NOT NULL DEFAULT FALSE,
    --exif VARCHAR,
    --fVec bytea,
    date_added TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_requested TIMESTAMPTZ,
    PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS {id_iu} (
    username VARCHAR NOT NULL,
    image uuid NOT NULL,
    viewcount SMALLINT DEFAULT 1,
    first_checked TIMESTAMPTZ,
    last_checked TIMESTAMPTZ,
    last_time_required BIGINT,
    total_time_required BIGINT,
    num_interactions INTEGER NOT NULL DEFAULT 0,
    meta VARCHAR,

    PRIMARY KEY (username, image),
    FOREIGN KEY (username) REFERENCES aide_admin.user(name),
    FOREIGN KEY (image) REFERENCES {id_image}(id)
);

CREATE TABLE IF NOT EXISTS {id_bookmark} (
    username VARCHAR NOT NULL,
    image uuid NOT NULL,
    timeCreated TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (username, image),
    FOREIGN KEY (username) REFERENCES "aide_admin".user(name),
    FOREIGN KEY (image) REFERENCES {id_image}(id)
);

CREATE TABLE IF NOT EXISTS {id_labelclassGroup} (
    id uuid DEFAULT uuid_generate_v4(),
    name VARCHAR NOT NULL,
    color VARCHAR,
    parent uuid,
    PRIMARY KEY (id)
);

-- https://github.com/ReseauBiodiversiteQuebec/Coleo_DB/blob/master/API-coleo.md
-- https://data.canadensys.net/vascan/search
-- timescale db; insert only; ON CONFLICT DO NOTHING
CREATE TABLE IF NOT EXISTS {id_labelclass} (
    id uuid DEFAULT uuid_generate_v4(),
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
);
CREATE UNIQUE INDEX labelclass_idx
ON {id_labelclass} (name, vascan_id, coleo_vernacular_fr, coleo_vernacular_en, vascan_region, vascan_province, vascan_port, vascan_statut_repartition, coleo_category);
ALTER TABLE {id_labelclass}
ADD CONSTRAINT uniq_labelclass
UNIQUE USING INDEX labelclass_idx;

CREATE TABLE IF NOT EXISTS {id_annotation} (
    id uuid DEFAULT uuid_generate_v4(),
    username VARCHAR NOT NULL,
    image uuid NOT NULL,
    meta VARCHAR,
    autoConverted boolean,
    timeCreated TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    timeRequired BIGINT,
    unsure boolean NOT NULL DEFAULT false,
    {annotation_fields},
    PRIMARY KEY (id),
    FOREIGN KEY (username) REFERENCES aide_admin.user(name),
    FOREIGN KEY (image) REFERENCES {id_image}(id)
);

CREATE TABLE IF NOT EXISTS {id_cnnstate} (
    id uuid DEFAULT uuid_generate_v4(),
    model_library VARCHAR,
    alCriterion_library VARCHAR,
    timeCreated TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    stateDict bytea,
    stats VARCHAR,
    partial BOOLEAN NOT NULL,
    imported_from_marketplace BOOLEAN NOT NULL DEFAULT FALSE,
    marketplace_origin_id UUID,
    labelclass_autoupdate BOOLEAN NOT NULL DEFAULT FALSE,
    PRIMARY KEY (id),
    FOREIGN KEY (marketplace_origin_id) REFERENCES aide_admin.modelMarketplace(id)
);

CREATE TABLE IF NOT EXISTS {id_modellc} (
    --ai_model_library VARCHAR NOT NULL,
    marketplace_origin_id UUID NOT NULL,
    labelclass_id_model VARCHAR NOT NULL,
    labelclass_name_model VARCHAR NOT NULL,
    labelclass_id_project UUID,
    PRIMARY KEY (marketplace_origin_id, labelclass_id_model),
    FOREIGN KEY (labelclass_id_project) REFERENCES {id_labelclass} (id)
);

CREATE TABLE IF NOT EXISTS {id_prediction} (
    id uuid DEFAULT uuid_generate_v4(),
    image uuid NOT NULL,
    timeCreated TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    cnnstate UUID,
    confidence real,
    {prediction_fields},
    priority real,
    PRIMARY KEY (id),
    FOREIGN KEY (image) REFERENCES {id_image}(id),
    FOREIGN KEY (cnnstate) REFERENCES {id_cnnstate}(id)
);
CREATE INDEX pred_idx ON {id_prediction} (cnnstate);

CREATE TABLE IF NOT EXISTS {id_workflow} (
    id uuid DEFAULT uuid_generate_v4(),
    name VARCHAR UNIQUE,
    workflow VARCHAR NOT NULL,
    username VARCHAR NOT NULL,
    timeCreated TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    timeModified TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (id),
    FOREIGN KEY (username) REFERENCES aide_admin.user(name)
);

CREATE TABLE IF NOT EXISTS {id_workflowHistory} (
    id uuid DEFAULT uuid_generate_v4(),
    workflow VARCHAR NOT NULL,
    tasks VARCHAR,
    timeCreated TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    timeFinished TIMESTAMPTZ,
    launchedBy VARCHAR,
    abortedBy VARCHAR,
    succeeded BOOLEAN,
    messages VARCHAR,
    PRIMARY KEY (id),
    FOREIGN KEY (launchedBy) REFERENCES aide_admin.user (name),
    FOREIGN KEY (abortedBy) REFERENCES aide_admin.user (name)
);

CREATE OR REPLACE VIEW {id_filehierarchy} AS (
    SELECT DISTINCT
    CASE WHEN position('/' IN filename) = 0 THEN null
    ELSE left(filename, strposrev(filename, '/')-1) END
    AS folder
    FROM {id_image}
);

/* task history */
CREATE TABLE IF NOT EXISTS {id_taskHistory} (
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    task_id uuid NOT NULL,
    launchedBy VARCHAR,
    abortedBy VARCHAR,
    processDescription VARCHAR,
    timeCreated TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    timeFinished TIMESTAMPTZ,
    result VARCHAR,
    PRIMARY KEY (id),
    FOREIGN KEY (launchedBy) REFERENCES aide_admin.user (name),
    FOREIGN KEY (abortedBy) REFERENCES aide_admin.user (name)
);

CREATE TABLE IF NOT EXISTS {id_annotation_label}
(
    annotation uuid NOT NULL,
    label uuid NOT NULL,
    PRIMARY KEY (annotation, label),
    FOREIGN KEY (label) REFERENCES {id_labelclass} (id),
    FOREIGN KEY (annotation) REFERENCES {id_annotation} (id)
)
