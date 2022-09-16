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

### Presence AIDE 2019 Boucherville

Fichiers JPEG utilisé par Antoine.
<https://drive.google.com/drive/folders/1l1KdPTVQAVTlakL7Q1kibt4RpZ5D83lF> 

### Dossier Partagé par le MELCC environnementqc.sharepoint.com

Accès avec compte vincent.le.falher@usherbrooke.ca
<https://environnementqc.sharepoint.com/:f:/r/sites/ReseauBdQc/Documents%20partages/Indicateurs/V%C3%A9g%C3%A9tation/Drone_Dossier_Partage?csf=1&web=1&e=4k3NAZ>

### 279 photos de 2018

Accés publique avec le lien, pas d'authentification. 

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

In a conda venv environment
```
sudo apt-get update && \
    sudo apt-get install -y software-properties-common && \
    sudo rm -rf /var/lib/apt/lists/*
    
sudo add-apt-repository ppa:ubuntugis/ppa \
    && sudo apt-get update \
    && sudo apt-get install -y gdal-bin \
    && sudo apt-get install -y libgdal-dev \
    && sudo apt-get install -y python3-pip \
    && export CPLUS_INCLUDE_PATH=/usr/include/gdal \
    && export C_INCLUDE_PATH=/usr/include/gdal \
    && sudo ogrinfo --version \
    # fix an error in the installation
    && pip3 install --upgrade --no-cache-dir setuptools==41.0.0 \
    && pip3 install GDAL==2.4.2    
``` 

Some error can occur when installing gdal python module

```
(aide) vince@vince-VirtualBox:~/aerial_wildlife_detection$ pip3 install GDAL==2.4.2
Error processing line 1 of /home/vince/anaconda3/envs/aide/lib/python3.7/site-packages/distutils-precedence.pth:

  Traceback (most recent call last):
    File "/home/vince/anaconda3/envs/aide/lib/python3.7/site.py", line 168, in addpackage
      exec(line)
    File "<string>", line 1, in <module>
  ModuleNotFoundError: No module named '_distutils_hack'

Remainder of file ignored
Collecting GDAL==2.4.2
  Using cached GDAL-2.4.2.tar.gz (564 kB)
  Preparing metadata (setup.py) ... done
Building wheels for collected packages: GDAL
  Building wheel for GDAL (setup.py) ... done
  Created wheel for GDAL: filename=GDAL-2.4.2-cp37-cp37m-linux_x86_64.whl size=2345436 sha256=b2bc1d6e9debc0e8786dc99392c877fd1922634b3e7bc096509aeeb713ac6d38
  Stored in directory: /home/vince/.cache/pip/wheels/2d/ed/4a/ec59835b868d89864ec563404136ecee6d954370df3d26b68a
Successfully built GDAL
Installing collected packages: GDAL
Successfully installed GDAL-2.4.2
(aide) vince@vince-VirtualBox:~/aerial_wildlife_detection$ vi ~/.profile
```

# update the .profile file 

.profile file: 
```
(aide) vince@vince-VirtualBox:~/aerial_wildlife_detection$ cat ~/.profile
export AIDE_CONFIG_PATH=/home/vince/aerial_wildlife_detection/config/settings.ini
export AIDE_MODULES=LabelUI,AIController,FileServer,AIWorker
export PYTHONPATH=/home/vince/aerial_wildlife_detection
export CPLUS_INCLUDE_PATH=/usr/include/gdal
export C_INCLUDE_PATH=/usr/include/gdal
source .bashrc
(aide) vince@vince-VirtualBox:~/aerial_wildlife_detection$
```

# Setup new project multilabel with OpenLayer tile
- create project as annotation
- load all the classes using json file
- set the number of images to be displayed equal to the number of images to load (exe : 267 for a 13x13=266 + 1)
- upload all images + the main image + geojson on the /imsages/projecrt folder
- create the annotation_label table  

# georeference JPEG

## JPEG to GeoTiff

Method to convert JPEG into GeoTiff. But prefered way is to create a worldfile with the lat_y/lon_x coordinates extracted from ex EXIF GPS metadata.   
<https://gis.stackexchange.com/questions/149803/create-geotiff-from-jpg-and-jfw-files-with-gdal>

<https://gdal.org/drivers/raster/gtiff.html>

## Geotagged JPEG with QGIS

In QGIS there is a tool to automatically import georeferenced JPEG. 

Processing toolbox > Vector creation > Import geotagged photos
* Specify the Input folder
* Specify in the "Create temporary layer" > Save to file > geojson

Run the tool. 

It will create a layer with the extracted EXIF GPS attributes and create a .geojson file with the right coordinates.

In QGIS, using the HTML Map Tips make the photos appear when mouse-over the point-photo feature 

- right click on the point layer > properties > Display > HTML Maps Tips
- insert `<img src="file:///[% photo %]" width="350" height="250">`
- Menu View > Show Map Tips

Refer to:  
- <https://opengislab.com/blog/2020/8/23/mapping-and-viewing-geotagged-photos-in-qgis>
- <https://bnhr.xyz/2019/09/22/geotagged-photos-in-qgis.html>

## Tools to extract GPS info from image

### gdalinfo

```
(.venv) vincelf@DESKTOP-55EQ5NI:~$ gdalinfo /mnt/c/Users/User/Downloads/AIDE+MELCC/presence_AIDE/2019-Boucherville-13226
962-13426700_tile.jpg
Driver: JPEG/JPEG JFIF
Files: /mnt/c/Users/User/Downloads/AIDE+MELCC/presence_AIDE/2019-Boucherville-13226962-13426700_tile.jpg
Size is 1080, 1053
Coordinate System is `'
Metadata:
  EXIF_ApertureValue=(2.971)
  EXIF_Artist=b6cba20c-c3c0-430e-80fc-ff539a81584b
  EXIF_ColorSpace=1
  EXIF_ComponentsConfiguration=0x00 0x03 0x02 0x01
  EXIF_CompressedBitsPerPixel=(5.78194)
  EXIF_Contrast=0
  EXIF_CustomRendered=0
  EXIF_DateTime=2019:07:10 11:24:52
  EXIF_DateTimeDigitized=2019:07:10 11:13:33
  EXIF_DateTimeOriginal=2019:07:10 11:13:33
  EXIF_DeviceSettingDescription=0x00 0x00 0x00 0x00
  EXIF_DigitalZoomRatio=(0)
  EXIF_Document_Name=2019-07-10T15:30:29Z
  EXIF_ExifVersion=0230
  EXIF_ExposureBiasValue=(0.3)
  EXIF_ExposureIndex=(0.25)
  EXIF_ExposureMode=1
  EXIF_ExposureProgram=1
  EXIF_ExposureTime=(0.001)
  EXIF_FileSource=0x03
  EXIF_Flash=32
  EXIF_FlashpixVersion=0100
  EXIF_FNumber=(2.8)
  EXIF_FocalLength=(4.5)
  EXIF_FocalLengthIn35mmFilm=24
  EXIF_GainControl=0
  EXIF_GPSAltitude=(3.2)
  EXIF_GPSAltitudeRef=0x00
  EXIF_GPSLatitude=(45) (37) (37.5017)
  EXIF_GPSLatitudeRef=N
  EXIF_GPSLongitude=(73) (27) (55.3604)
  EXIF_GPSLongitudeRef=W
  EXIF_ImageDescription=c2a9fe59-24f5-4146-a16a-5acaf49f6de9
  EXIF_ImageUniqueID=c2a9fe59-24f5-4146-a16a-5acaf49f6de9
  EXIF_Interoperability_Index=R98
  EXIF_Interoperability_Version=0x30 0x31 0x30 0x30
  EXIF_ISOSpeedRatings=200
  EXIF_LensSpecification=(0) (0) (2.2) (2.2)
  EXIF_LightSource=0
  EXIF_Make=DJI
  EXIF_MakerNote=[awb_dbg_info:ADEHCCFRWZSDWUFWUJFRNNHNHNHNHNHNHNHNHNHNHNHNHNHNHNHNDTSEHFCQJJFRJQSIQ
  EXIF_MaxApertureValue=(2.971)
  EXIF_MeteringMode=1
  EXIF_Model=FC2103
  EXIF_PixelXDimension=1080
  EXIF_PixelYDimension=1053
  EXIF_ResolutionUnit=2
  EXIF_Saturation=0
  EXIF_SceneCaptureType=0
  EXIF_SceneType=0x01
  EXIF_Sharpness=0
  EXIF_Software=Fulcrum Android 2.33.0 (4881), Android 8.0.0, BullittGroupLimited, S41
  EXIF_SubjectDistance=(0)
  EXIF_SubjectDistanceRange=0
  EXIF_WhiteBalance=0
  EXIF_XResolution=(72)
  EXIF_YCbCrPositioning=1
  EXIF_YResolution=(72)
Image Structure Metadata:
  COMPRESSION=JPEG
  INTERLEAVE=PIXEL
  SOURCE_COLOR_SPACE=YCbCr
Corner Coordinates:
Upper Left  (    0.0,    0.0)
Lower Left  (    0.0, 1053.0)
Upper Right ( 1080.0,    0.0)
Lower Right ( 1080.0, 1053.0)
Center      (  540.0,  526.5)
Band 1 Block=1080x1 Type=Byte, ColorInterp=Red
  Overviews: 540x527, 270x264, 135x132
  Image Structure Metadata:
    COMPRESSION=JPEG
Band 2 Block=1080x1 Type=Byte, ColorInterp=Green
  Overviews: 540x527, 270x264, 135x132
  Image Structure Metadata:
    COMPRESSION=JPEG
Band 3 Block=1080x1 Type=Byte, ColorInterp=Blue
  Overviews: 540x527, 270x264, 135x132
  Image Structure Metadata:
    COMPRESSION=JPEG
```

### exiftool

```
(.venv) vincelf@DESKTOP-55EQ5NI:~$ exiftool /mnt/c/Users/User/Downloads/AIDE+MELCC/presence_AIDE/2019-Boucherville-13226
962-13426700_tile.jpg
ExifTool Version Number         : 10.80
File Name                       : 2019-Boucherville-13226962-13426700_tile.jpg
Directory                       : /mnt/c/Users/User/Downloads/AIDE+MELCC/presence_AIDE
File Size                       : 1191 kB
File Modification Date/Time     : 2021:10:04 10:27:06-04:00
File Access Date/Time           : 2022:09:16 11:30:08-04:00
File Inode Change Date/Time     : 2022:09:16 10:46:34-04:00
File Permissions                : rwxrwxrwx
File Type                       : JPEG
File Type Extension             : jpg
MIME Type                       : image/jpeg
JFIF Version                    : 1.01
Exif Byte Order                 : Little-endian (Intel, II)
Document Name                   : 2019-07-10T15:30:29Z
Image Description               : c2a9fe59-24f5-4146-a16a-5acaf49f6de9
Make                            : DJI
Camera Model Name               : FC2103
X Resolution                    : 72
Y Resolution                    : 72
Resolution Unit                 : inches
Software                        : Fulcrum Android 2.33.0 (4881), Android 8.0.0, BullittGroupLimited, S41
Modify Date                     : 2019:07:10 11:24:52
Artist                          : b6cba20c-c3c0-430e-80fc-ff539a81584b
Y Cb Cr Positioning             : Centered
Exposure Time                   : 1/1000
F Number                        : 2.8
Exposure Program                : Manual
ISO                             : 200
Exif Version                    : 0230
Date/Time Original              : 2019:07:10 11:13:33
Create Date                     : 2019:07:10 11:13:33
Components Configuration        : -, Cr, Cb, Y
Compressed Bits Per Pixel       : 5.781941633
Aperture Value                  : 2.8
Exposure Compensation           : +0.3
Max Aperture Value              : 2.8
Subject Distance                : undef
Metering Mode                   : Average
Light Source                    : Unknown
Flash                           : No flash function
Focal Length                    : 4.5 mm
Warning                         : Bad MakerNotes directory
Flashpix Version                : 0100
Color Space                     : sRGB
Exif Image Width                : 1080
Exif Image Height               : 1053
Interoperability Index          : R98 - DCF basic file (sRGB)
Interoperability Version        : 0100
Exposure Index                  : 0.25
File Source                     : Digital Camera
Scene Type                      : Directly photographed
Custom Rendered                 : Normal
Exposure Mode                   : Manual
White Balance                   : Auto
Digital Zoom Ratio              : undef
Focal Length In 35mm Format     : 24 mm
Scene Capture Type              : Standard
Gain Control                    : None
Contrast                        : Normal
Saturation                      : Normal
Sharpness                       : Normal
Device Setting Description      : (Binary data 4 bytes, use -b option to extract)
Subject Distance Range          : Unknown
Lens Info                       : 0mm f/2.2
GPS Latitude Ref                : North
GPS Longitude Ref               : West
GPS Altitude Ref                : Above Sea Level
XP Comment                      : 0.9.142
XP Keywords                     : N
Image Unique ID                 : c2a9fe59-24f5-4146-a16a-5acaf49f6de9
Compression                     : Unknown (0)
Image Width                     : 1080
Image Height                    : 1053
Encoding Process                : Baseline DCT, Huffman coding
Bits Per Sample                 : 8
Color Components                : 3
Y Cb Cr Sub Sampling            : YCbCr4:2:0 (2 2)
Aperture                        : 2.8
GPS Altitude                    : 3.2 m Above Sea Level
GPS Latitude                    : 45 deg 37' 37.50" N
GPS Longitude                   : 73 deg 27' 55.36" W
GPS Position                    : 45 deg 37' 37.50" N, 73 deg 27' 55.36" W
Image Size                      : 1080x1053
Megapixels                      : 1.1
Scale Factor To 35 mm Equivalent: 5.3
Shutter Speed                   : 1/1000
Circle Of Confusion             : 0.006 mm
Field Of View                   : 73.7 deg
Focal Length                    : 4.5 mm (35 mm equivalent: 24.0 mm)
Hyperfocal Distance             : 1.28 m
Light Value                     : 11.9
```

### identify

```
identify -format "%[EXIF:*GPS*]" /mnt/c/Users/User/Downloads/AIDE+MELCC/presence_AIDE/2019-Boucherville-13226962-13426700_tile.jpg
exif:GPSAltitude=32/10
exif:GPSAltitudeRef=0
exif:GPSInfo=8884
exif:GPSLatitude=45/1, 37/1, 2625118299/70000000
exif:GPSLatitudeRef=N
exif:GPSLongitude=73/1, 27/1, 3875226413/70000000
exif:GPSLongitudeRef=W
```

```
identify -verbose /mnt/c/Users/User/Downloads/AIDE+MELCC/presence_AIDE/2019-Boucherville-13226962-13426700_tile.jpg | grep GPS
    exif:GPSAltitude: 32/10
    exif:GPSAltitudeRef: 0
    exif:GPSInfo: 8884
    exif:GPSLatitude: 45/1, 37/1, 2625118299/70000000
    exif:GPSLatitudeRef: N
    exif:GPSLongitude: 73/1, 27/1, 3875226413/70000000
    exif:GPSLongitudeRef: W
```

### exifread.py

```
pip3 install exifread
EXIF.py /mnt/c/Users/User/Downloads/AIDE+MELCC/presence_AIDE/2019-Boucherville-13226962-13426700_tile.jpg | grep GPS
GPS GPSAltitude (Ratio): 16/5
GPS GPSAltitudeRef (Byte): 0
GPS GPSLatitude (Ratio): [45, 37, 2625118299/70000000]
GPS GPSLatitudeRef (ASCII): N
GPS GPSLongitude (Ratio): [73, 27, 3875226413/70000000]
GPS GPSLongitudeRef (ASCII): W
Image GPSInfo (Long): 8884
```

Refer to <https://pypi.org/project/ExifRead/>

## List of tools to georefence images

- We use a P3 and use PhotoScan by Agisoft to get georeferenced images into QGIS. Its expensive but has a generous trial period.

- We also tried these product below and they also offer trials for you to see how it works:

- Pix4D which can get expensive but can be rented per month. (We didnt buy because it was too expensive for us)
- DroneDeploy was a hosted solution and reasonably priced I thought. (We didn't buy because we wanted to process locally)
- Maps Made Easy was also a hosted solution and reasonably priced. (We didn't buy because we wanted to process locally)

- I have heard good things about Open Drone Map that @Luke mentioned in a comment but I have not personally used it.

- I have also seen on forums that some people are using a free product called Microsoft Image Composite Editor to mosaic their images and then georefence them with GDAL with or QGIS. This forum discussion starts off with someone who mosaics 20,000 Hectares with Microsoft ICE and a guy further down shares how he georeference a Microsoft ICE image using GDAL_Translate.

- I mentioned georeferencing in QGIS in the last paragraph, I didn't explicitly mention the tool but thats what I was referring to. Personally I would use the QGIS georeferencer to georeference an image that has already been mosaiced, I wouldn't use it to georeference 20-50 images that just came from my drone. If you are only wanting one or two images from your drone to be in QGIS then yes I would use the QGIS georeference as an excellent capable free tool.

Refer to : <https://gis.stackexchange.com/questions/202576/drone-aerial-imagery-to-qgis>

# List of datasets for machine-learning research

Biology Plants: <https://en.wikipedia.org/wiki/List_of_datasets_for_machine-learning_research#Plant>
List of biological databases: <https://en.wikipedia.org/wiki/List_of_biological_databases>

