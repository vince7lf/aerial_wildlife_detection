# Release notes

## ZenHub board 
- https://github.com/vince7lf/aerial_wildlife_detection/issues/13#workspaces/aidemelcc-61ea0f55cc331a001ddaa028/board
- https://app.zenhub.com/workspaces/aidemelcc-61ea0f55cc331a001ddaa028/board

## Env
- DEV: http://206.12.94.82:8080/
- GCP: http://35.208.225.49:8080/

## Releases
v1.3.2 tile_image_favorits_groups vincent.lefalher@usherbrooke.ca 2022-07-29 
- (AIDE+MELCC#32) Exporte avec les annotations les champs vascan_id, bryoquel_id, coleo_vernacular_fr, coleo_vernacular_en, vascan_region, vascan_province, vascan_port, vascan_statut_repartition, tsn, coleo_category

v1.3.1 tile_image_favorits_groups vincent.lefalher@usherbrooke.ca 2022-07-26 
- (AIDE+MELCC#33) Dans l'interface d'annotation ajouter le id de la tuile, et la ligne et colonne
- Tag AIDE+MELCC-1.6

v1.3 branch tile_image_favorits_groups vincent.lefalher@usherbrooke.ca 2022-07-18 
- new document and screenshots to setup Pycharm (remote ssh, remote python interpreter, remote debug)
- updated doc to install AIDE for MELCC (anaconda, ogrgdal)
- new script to help debug issue with the ogrgdal_createtiles.sh script

v1.1 annotation_single_label vincent.lefalher@usherbrooke.ca 2022-03-03
- (AIDE+MELCC#6) implement the mono-label to easily associate multiple tiles for a specific label. Documented and tested. No automated testing.  
- merged and tagged AIDE+MELCC-1.5; backup tag is AIDE+MELCC_20220303T2226 

v1.2.4 manage_labels vincent.lefalher@usherbrooke.ca 2022-02-15
- (AIDE+MELCC#6) implement the singleclick event on map; refactor style variable names. Comment the map.on singleclick event. Will create a new branch to handle the annotation multiple.
- new json to add few labels to the new project; manual label cration do not work anymore

v1.2.3 manage_labels vincent.lefalher@usherbrooke.ca 2022-02-14
- (AIDE+MELCC#6) select multi-tuile; PoC working but not more event/style when mouseOver, just select / singleClick event; there is an issue with the select event after the singleClick, event not propagated anymore

v1.2.2 manage_labels vincent.lefalher@usherbrooke.ca 2022-02-09
- (AIDE+MELCC#13) data download; arrange SQL to support multi label annotation export

v1.2.1 manage_labels vincent.lefalher@usherbrooke.ca 2022-02-09
- (AIDE+MELCC#13) data download; issue with identation in DataWorker.py; commit and push to be able to test remotely within celery

v1.2 manage_labels vincent.lefalher@usherbrooke.ca 2022-02-07
- release 3 issues; tested and deployed
- (AIDE+MELCC#5) Choix taille des tuiles; deployed
- (AIDE+MELCC#7) Show file names below images; deployed
- (AIDE+MELCC#10) Autres comptes; provided guide 

v1.0 manage_labels vincent.lefalher@usherbrooke.ca
- initial release
