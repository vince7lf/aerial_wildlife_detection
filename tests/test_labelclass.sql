-- insert same one - error constraint
INSERT INTO test.labelclass
(name, color, labelclassgroup, keystroke, hidden, vascan_id, bryoquel_id, coleo_vernacular_fr, coleo_vernacular_en, vascan_region, vascan_province, vascan_port, vascan_statut_repartition, tsn, coleo_category)
VALUES ('×Duarctopoa labradorica', '#095797', '324d0e0a-41cf-11ec-a197-fa163e42617b', NULL, false, 8015, NULL, 'pâturin du Labrador', 'Labrador bluegrass', 'Central', 'Québec', 'Plante herbacée', 'Indigène', NULL, 'plantes');
-- result
-- ERROR:  duplicate key value violates unique constraint "uniq_labelclass"
-- DETAIL:  Key (name, vascan_id, coleo_vernacular_fr, coleo_vernacular_en, vascan_region, vascan_province, vascan_port, vascan_statut_repartition, coleo_category)=(×Duarctopoa labradorica, 8015, pâturin du Labrador, Labrador bluegrass, Central, Québec, Plante herbacée, Indigène, plantes) already exists.

-- update vascan_id - all fields new
INSERT INTO test.labelclass
(name, color, labelclassgroup, keystroke, hidden, vascan_id, bryoquel_id, coleo_vernacular_fr, coleo_vernacular_en, vascan_region, vascan_province, vascan_port, vascan_statut_repartition, tsn, coleo_category)
VALUES ('test_name', '#999999', '324d0e0a-41cf-11ec-a197-fa163e42617b', NULL, false, 9999, NULL, 'test_coleo_vernacular_fr', 'test_coleo_vernacular_en', 'test_vascan_region', 'test_vascan_province', 'test_vascan_port', 'test_vascan_statut_repartition', NULL, 'test_coleo_category');
-- successfull

-- update vascan_id - all duplicates except name -- working
INSERT INTO test.labelclass
(name, color, labelclassgroup, keystroke, hidden, vascan_id, bryoquel_id, coleo_vernacular_fr, coleo_vernacular_en, vascan_region, vascan_province, vascan_port, vascan_statut_repartition, tsn, coleo_category)
VALUES ('test_name2', '#999999', '324d0e0a-41cf-11ec-a197-fa163e42617b', NULL, false, 9999, NULL, 'test_coleo_vernacular_fr', 'test_coleo_vernacular_en', 'test_vascan_region', 'test_vascan_province', 'test_vascan_port', 'test_vascan_statut_repartition', NULL, 'test_coleo_category');

INSERT INTO test.labelclass
(name, color, labelclassgroup, keystroke, hidden, vascan_id, bryoquel_id, coleo_vernacular_fr, coleo_vernacular_en, vascan_region, vascan_province, vascan_port, vascan_statut_repartition, tsn, coleo_category)
VALUES ('test_name2', '#999999', '324d0e0a-41cf-11ec-a197-fa163e42617b', NULL, false, 9999, NULL, 'test_coleo_vernacular_fr2', 'test_coleo_vernacular_en2', 'test_vascan_region2', 'test_vascan_province2', 'test_vascan_port2', 'test_vascan_statut_repartition2', NULL, 'test_coleo_category2');

-- update vascan_id - all duplicates except coleo_vernacular_fr -- working
INSERT INTO test.labelclass
(name, color, labelclassgroup, keystroke, hidden, vascan_id, bryoquel_id, coleo_vernacular_fr, coleo_vernacular_en, vascan_region, vascan_province, vascan_port, vascan_statut_repartition, tsn, coleo_category)
VALUES ('test_name', '#999999', '324d0e0a-41cf-11ec-a197-fa163e42617b', NULL, false, 9999, NULL, 'test_coleo_vernacular_fr2', 'test_coleo_vernacular_en', 'test_vascan_region', 'test_vascan_province', 'test_vascan_port', 'test_vascan_statut_repartition', NULL, 'test_coleo_category');

-- update vascan_id - all duplicates except coleo_vernacular_en -- working
INSERT INTO test.labelclass
(name, color, labelclassgroup, keystroke, hidden, vascan_id, bryoquel_id, coleo_vernacular_fr, coleo_vernacular_en, vascan_region, vascan_province, vascan_port, vascan_statut_repartition, tsn, coleo_category)
VALUES ('test_name', '#999999', '324d0e0a-41cf-11ec-a197-fa163e42617b', NULL, false, 9999, NULL, 'test_coleo_vernacular_fr', 'test_coleo_vernacular_en2', 'test_vascan_region', 'test_vascan_province', 'test_vascan_port', 'test_vascan_statut_repartition', NULL, 'test_coleo_category');
-- redo : error : ok

-- update vascan_id - all duplicates except vascan_region -- working
INSERT INTO test.labelclass
(name, color, labelclassgroup, keystroke, hidden, vascan_id, bryoquel_id, coleo_vernacular_fr, coleo_vernacular_en, vascan_region, vascan_province, vascan_port, vascan_statut_repartition, tsn, coleo_category)
VALUES ('test_name', '#999999', '324d0e0a-41cf-11ec-a197-fa163e42617b', NULL, false, 9999, NULL, 'test_coleo_vernacular_fr', 'test_coleo_vernacular_en', 'test_vascan_region2', 'test_vascan_province', 'test_vascan_port', 'test_vascan_statut_repartition', NULL, 'test_coleo_category');
-- redo : error : ok

-- update vascan_id - all duplicates except vascan_port -- working
INSERT INTO test.labelclass
(name, color, labelclassgroup, keystroke, hidden, vascan_id, bryoquel_id, coleo_vernacular_fr, coleo_vernacular_en, vascan_region, vascan_province, vascan_port, vascan_statut_repartition, tsn, coleo_category)
VALUES ('test_name', '#999999', '324d0e0a-41cf-11ec-a197-fa163e42617b', NULL, false, 9999, NULL, 'test_coleo_vernacular_fr', 'test_coleo_vernacular_en', 'test_vascan_region', 'test_vascan_province', 'test_vascan_port2', 'test_vascan_statut_repartition', NULL, 'test_coleo_category');
-- redo : error : ok

-- update vascan_id - all duplicates except test_vascan_statut_repartition -- working
INSERT INTO test.labelclass
(name, color, labelclassgroup, keystroke, hidden, vascan_id, bryoquel_id, coleo_vernacular_fr, coleo_vernacular_en, vascan_region, vascan_province, vascan_port, vascan_statut_repartition, tsn, coleo_category)
VALUES ('test_name', '#999999', '324d0e0a-41cf-11ec-a197-fa163e42617b', NULL, false, 9999, NULL, 'test_coleo_vernacular_fr', 'test_coleo_vernacular_en', 'test_vascan_region', 'test_vascan_province', 'test_vascan_port', 'test_vascan_statut_repartition2', NULL, 'test_coleo_category');
-- redo : error : ok

-- update vascan_id - all duplicates except test_coleo_category -- working
INSERT INTO test.labelclass
(name, color, labelclassgroup, keystroke, hidden, vascan_id, bryoquel_id, coleo_vernacular_fr, coleo_vernacular_en, vascan_region, vascan_province, vascan_port, vascan_statut_repartition, tsn, coleo_category)
VALUES ('test_name', '#999999', '324d0e0a-41cf-11ec-a197-fa163e42617b', NULL, false, 9999, NULL, 'test_coleo_vernacular_fr', 'test_coleo_vernacular_en', 'test_vascan_region', 'test_vascan_province', 'test_vascan_port', 'test_vascan_statut_repartition', NULL, 'test_coleo_category2');
-- redo : error : ok

-- update vascan_id - all duplicates except vascan_id -- working
INSERT INTO test.labelclass
(name, color, labelclassgroup, keystroke, hidden, vascan_id, bryoquel_id, coleo_vernacular_fr, coleo_vernacular_en, vascan_region, vascan_province, vascan_port, vascan_statut_repartition, tsn, coleo_category)
VALUES ('test_name', '#999999', '324d0e0a-41cf-11ec-a197-fa163e42617b', NULL, false, 9999, NULL, 'test_coleo_vernacular_fr', 'test_coleo_vernacular_en2', 'test_vascan_region2', 'test_vascan_province2', 'test_vascan_port2', 'test_vascan_statut_repartition2', NULL, 'test_coleo_category2');

-- update name - new one with new name
-- update coleo_vernacular_fr - new one with new coleo_vernacular_fr
-- update coleo_vernacular_en - new one with new coleo_vernacular_en
-- update vascan_region - new one with new vascan_region
-- update province - new one with new vascan_province
-- update port - new one with new vascan_port
-- update statut_repartition - new one with new vascan_statut_repartition
-- update tsn - new one with new vascan_statut_repartition
-- update coleo_category - new one with new vascan_statut_repartition
-- update labelclassgroup - new one with new labelclassgroup
-- view active unique

-- view history not active not unique
-- integrity check - check duplicate name diff vascan_id

CREATE OR REPLACE VIEW test.active_labelclass AS
	SELECT distinct on (lc.name) lc.*
	FROM test.labelclass lc
	INNER JOIN test.labelcl8ass lc_inner ON lc_inner.id = lc.id
	ORDER BY lc.name, lc.timeCreated DESC

SELECT id, idx, timecreated, name, color, labelclassgroup, keystroke, hidden, vascan_id, bryoquel_id, coleo_vernacular_fr, coleo_vernacular_en, vascan_region, vascan_province, vascan_port, vascan_statut_repartition, tsn, coleo_category
FROM test.labelclass
WHERE name = 'test_name'
ORDER BY timeCreated DESC

INSERT INTO test.labelclass
(name, color, labelclassgroup, keystroke, hidden, vascan_id, bryoquel_id, coleo_vernacular_fr, coleo_vernacular_en, vascan_region, vascan_province, vascan_port, vascan_statut_repartition, tsn, coleo_category)
VALUES ('test_name3', '#999999', '324d0e0a-41cf-11ec-a197-fa163e42617b', NULL, false, 9999, NULL, 'test_coleo_vernacular_fr2', 'test_coleo_vernacular_en', 'test_vascan_region2', 'test_vascan_province2', 'test_vascan_port2', 'test_vascan_statut_repartition2', NULL, 'test_coleo_category2');

INSERT INTO test.labelclass
(name, color, labelclassgroup, keystroke, hidden, vascan_id, bryoquel_id, coleo_vernacular_fr, coleo_vernacular_en, vascan_region, vascan_province, vascan_port, vascan_statut_repartition, tsn, coleo_category)
VALUES ('test_name', '#999999', '324d0e0a-41cf-11ec-a197-fa163e42617b', NULL, false, 9999, NULL, 'test_coleo_vernacular_fr', 'test_coleo_vernacular_en2', 'test_vascan_region2', 'test_vascan_province2', 'test_vascan_port2', 'test_vascan_statut_repartition2', NULL, 'test_coleo_category2');

select * from test.active_labelclass
where name LIKE 'test%'
order by timeCreated DESC;