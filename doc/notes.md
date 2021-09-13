# Notes projet AIDE MELCC

* Drone_Dossier_Partage
<https://environnementqc.sharepoint.com/sites/ReseauBdQc/_layouts/15/guestaccess.aspx?e=5%3aXJWAkg&at=9&share=ErbXP2BTOV9Ohy1DknsJxP4BQ3pBjSOk9_uzUHudlM-_Kw>


## Outils d'annotation

Liste des outils :

1. V7labs Darwin $ plateforme https://www.v7labs.com 
2. SuperAnnotate $ plateforme https://superannotate.com/
3. Supervise.ly $* plateforme https://supervise.ly/
4. LabelBox $ plateforme https://labelbox.com/
5. CVAT gratuit outil Intel https://github.com/openvinotoolkit/cvat
6. Hasty.ai $ plateforme https://hasty.ai/
7. AIDE Annotation Interface for Data-driven Ecology gratuit plateforme Microsoft https://github.com/microsoft/aerial_wildlife_detection
12.Playment.io $* plateforme https://playment.io/
16.Scalabel gratuit plateforme https://www.scalabel.ai/
+ SIG QGIS, ArcGIS Pro

exemple ici pour un autre projet (http://aidedemo.westeurope.cloudapp.azure.com:8080/landcover/interface?imgs=adc29f56-22d5-4169-8b96-96e1eb813a55), mais il faudra l’adapter avec une plus grande taxonomie.

## Jeux de données Photos

### 279 photos de 2018

Voici les 279 photos de 2018 en format original pour l'interface AIDE : 
<https://drive.google.com/drive/folders/12H0GG1yldrsQPTNOO0ceymOur-bonZzV?usp=sharing> 

Il y a encore une légère compression par rapport aux photos sur le iCloud. La compression semble impossible à éviter en important les photos à partir de Fulcrum, mais celle-ci est très minime cette fois.

Les photos sont nommées selon le même format qu'avant ("Année-Boucherville-Numéro de parcelle-Numéro de sous-parcelle"). Il y a aussi un chiffre à la fin de chaque nom de photo (soit 1 ou 2) que tu peux ignorer, c'est simplement parce qu'il y a plusieurs photos dans la base de données pour chaque sous-parcelle et j'ai seulement gardé celle qui est pertinente.

### Photos original 2018 non compressées

Voici un tableau avec les liens de téléchargement des photos originales non-compressées et non-rognées pour 2018. Antoine va t'envoyer une nouvelle version de la BD faisait le lien entre les parcelles/sous-parcelles (parcelles = 3 m x 3m, sous-parcelles = 1 m x 1 m) et les noms des fichiers .JPG. Antoine va peut-être tout organiser ça dans un nouveau dossier partagé mais en attendant tu as accès aux photos originales à l'aide de ce tableau.

<https://docs.google.com/spreadsheets/d/11m0xBSYM_vS6HPtxyLBOnsno6z9qEs8fDQG2MFlzh1s/edit?usp=sharing>

## multilabel Resnet

Je viens de regarder rapidement le multilabel avec Resnet, et oui c’est exactement ce que tu as envoyé Étienne. Il suffit de changer la fonction d’activation et de bien sélectionner la fonction de perte. Vincent, il fera faire attention à cette partie dans le « fine tuning » de l’architecture resnet (ou les autres). Je vais faire des tests de mon côté.

<https://learnopencv.com/multi-label-image-classification-with-pytorch-image-tagging/>

## SSL Self-Supervised Learning

Pour info. Voici ce qui est à la mode en ce moment dans le monde de l’IA : le SSL (Self-Supervised Learning). Il permet de classer des données non étiquetées avec une précision intéressante. Des chercheurs ont présenté des résultats sur des données massives de photos  : https://www.journaldunet.com/solutions/dsi/1498405-premiere-mondiale-facebook-ai-industrialise-la-reconnaissance-d-images/

Facebook a sorti une librairie Open Source basée sur Pytorch : https://vissl.ai/

Ce serait l’outil idéal à tester pour l’identification des espèces

il va faire des regroupements de features par différents algorithmes (Vissl en propose plusieurs). Je verrai cet outil plus comme une aide à l’annotation pour un projet en démarrage. On ne l’utilisera pas dans le projet actuel (MELCC)l, mais dans de futures propositions, ce serait intéressant à intégrer/tester en plus du contexte spatial et la fusion multisource.

Pour info, Justine Boulent, ma postdoc va tester le self-supervised dans un projet. On pourra regarder les performances

# Open Layers
To use ol, install it from npm `npm install ol` 

Set proxy if VPN used.
```   
C:\Users\vincent.le_falher\myprojects\university\aerial_wildlife_detection>npm config get proxy
http://fastweb.bell.ca:8083/
C:\Users\vincent.le_falher\myprojects\university\aerial_wildlife_detection>npm config get https-proxy
http://fastweb.bell.ca:8083/
```
Get rid of the proxy if not begin VPN.
```
C:\Users\vincent.le_falher\myprojects\university\aerial_wildlife_detection>npm config rm https-proxy
C:\Users\vincent.le_falher\myprojects\university\aerial_wildlife_detection>npm config rm proxy
```
   
# Création des tuiles

Avec les commandes. Ensuite avec Python et modules gdal. 
```
c:\QGIS310>OSGeo4W.bat
c:\QGIS310>py3_env
c:\QGIS310>cd c:\Users\vincent.le_falher\Downloads\AIDEMELCC\gdal_tile

gdal_retile -levels 1 -tileIndex tuiles.shp -tileIndexField Location -ps 224 224 -targetDir c:\Users\vincent.le_falher\Downloads\AIDEMELCC\gdal_tile test_retile.jpg

ogr2ogr -f GeoJSON -s_srs crs:84 -t_srs crs:84 tuiles.geojson tuiles.shp
```

Modifier dans le fichier .geojson les .tif en .jpg

Transformer les fichiers .tif en .jpg

Creer la table 'annotation_label' dans le schema du nouveau projet (/scripts/sql/extended)

Copier le .geojson sur le serveur dans le images du projet avec les images

Copier l'image tuile et les images générées
l'image tuilée doit finir par '_tile.jpg'

Les autres images doivent être générées à partir de l'image _tile.jpg 

# Transformation des tif en jpg
Avec GDAL
```
c:\QGIS310>gdal_translate -of JPEG -scale -co worldfile=yes c:\Users\vincent.le_falher\Downloads\AIDEMELCC\gdal_tile\test_retile_14_15.tif c:\Users\vincent.le_falher\Downloads\AIDEMELCC\gdal_tile\test_retile_14_15.tif.jpg
Input file size is 224, 128
0...10...20...30...40...50...60...70...80...90...100 - done.
```

Avec ImageMagik (installation nécessaire)

exe dans le ENV PATH

dans Cygwin, dans DOS ne marche pas

```
mogrify -format jpg c:/Users/vincent.le_falher/Downloads/AIDEMELCC/gdal_tile/*.tif
```

# Install gdal/ogr on ubuntu 
Reference: <https://mothergeo-py.readthedocs.io/en/latest/development/how-to/gdal-ubuntu-pkg.html>

```
sudo add-apt-repository ppa:ubuntugis/ppa && sudo apt-get update
sudo apt-get update
sudo apt-get install gdal-bin
sudo apt-get install libgdal-dev
sudo apt install python3-pip
export CPLUS_INCLUDE_PATH=/usr/include/gdal
export C_INCLUDE_PATH=/usr/include/gdal
ogrinfo --version
GDAL 2.4.2, released 2019/06/28
pip3 install GDAL==2.4.2
``` 

Setup new project multilabel with OpenLayer tile
- create project as annotation
- load all the classes using json file
- set the number of images to be displayed equal to the number of images to load (exe : 267 for a 13x13=266 + 1)
- upload all images + the main image + geojson on the /imsages/projecrt folder
- create the annotation_label table  
