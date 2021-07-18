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
   
