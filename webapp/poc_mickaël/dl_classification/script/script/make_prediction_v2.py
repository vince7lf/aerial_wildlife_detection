# -*- coding: utf-8 -*-
import os, sys
os.environ['PATH'] = r'C:\Program Files\QGIS 2.18\bin'

import psycopg2
from psycopg2.extensions import AsIs # Sinon erreur dans le nom de colonne lors de l'insertion dans la BD

import numpy as np

# Importation des libs GDAL
from osgeo import ogr, osr, gdal, gdalconst

import optparse # for older version of python 2.7


# INPUT
#mosaic_id = 24
#model_id = 1

# model id
# 1 = sat6 3 bands
# 2 = sat6 4 bands
# 3 = sat4 3 bands
# 4 = sat4 4 bands

# Déclaration de variables
host = 'igeomedia.com'
password = '45rtfg'
user = 'paul'
dbname = 'paul'



class Mosaic:
    def __init__(self, mosaic_id, model_id, host, dbname, user, password):
        self.mosaic_id = mosaic_id
        self.name = self.getName(host, dbname, user, password)
        self.model_id = model_id
        self.tileSize = self.getSize(host, dbname, user, password)
        self.listTile = [] # Liste qui va contenir les tuiles
        self.path = self.getPath(host, dbname, user, password)
        self.ds = self.openMosaic()
        self.nbCols = self.ds.RasterXSize # Nombre de colonnes dans la mosaique
        self.nbRows = self.ds.RasterYSize # Nombre de lignes dans la mosaique
        self.nbBands = self.ds.RasterCount # Nombre de bandes dans la mosaique
        self.nbTiles = (self.nbCols / self.tileSize) * (self.nbRows / self.tileSize)
        self.imgProj = self.ds.GetProjection() # Récupération de la projection de l'image
        # Matrice vide qui va contenir les tuiles formatées pour le modèle d'apprentissage profond
        self.data = np.empty([self.nbTiles, self.tileSize, self.tileSize, self.nbBands], dtype=int)
        self.prediction = [] # Liste qui contient les prédictions du modèle d'apprentissage profond
        self.classNameList = self.getClassName(host, dbname, user, password)



    # Retourne la taille des tuiles en fonction du modèle choisi (model_id)
    def getSize(self, host, dbname, user, password):
        # Connection à la base de données
        # Define our connection string
        conn_string = "host=" + host + " dbname=" + dbname + " user=" + user + " password=" + password

        # get a connection, if a connect cannot be made an exception will be raised here
        conn = psycopg2.connect(conn_string)

        # conn.cursor will return a cursor object, you can use this cursor to perform queries
        cursor = conn.cursor()
        #conn.autocommit = True  # Sinon l'insert ne se fait pas

        cursor.execute('Select tile_size FROM dataset d, model m WHERE m.model_id = %s AND d.dataset_id = m.dataset_id',(self.model_id,))

        # Affection de la taille des tuiles pour le découpage
        tileSize = cursor.fetchone()[0]

        cursor.close()

        return tileSize

    # Retourne le chemin vers le fichier de la mosaique
    def getPath(self, host, dbname, user, password):
        # Connection à la base de données
        # Define our connection string
        conn_string = "host=" + host + " dbname=" + dbname + " user=" + user + " password=" + password

        # get a connection, if a connect cannot be made an exception will be raised here
        conn = psycopg2.connect(conn_string)

        # conn.cursor will return a cursor object, you can use this cursor to perform queries
        cursor = conn.cursor()
        #conn.autocommit = True  # Sinon l'insert ne se fait pas

        cursor.execute('Select mosaic_path FROM mosaic WHERE mosaic_id = %s',(self.mosaic_id,))

        # Affection de la taille des tuiles pour le découpage
        mosaic_path = cursor.fetchone()[0]

        cursor.close()

        return mosaic_path
    
    # Retourne le chemin vers le fichier de la mosaique
    def getName(self, host, dbname, user, password):
        # Connection à la base de données
        # Define our connection string
        conn_string = "host=" + host + " dbname=" + dbname + " user=" + user + " password=" + password

        # get a connection, if a connect cannot be made an exception will be raised here
        conn = psycopg2.connect(conn_string)

        # conn.cursor will return a cursor object, you can use this cursor to perform queries
        cursor = conn.cursor()
        #conn.autocommit = True  # Sinon l'insert ne se fait pas

        cursor.execute('Select mosaic_name FROM mosaic WHERE mosaic_id = %s',(self.mosaic_id,))

        # Affection de la taille des tuiles pour le découpage
        mosaic_name = cursor.fetchone()[0]

        cursor.close()

        return mosaic_name

    # Ouverture de la mosaique avec GDAL
    def openMosaic(self):
        # Dàcéaration de tous les pilotes
        gdal.AllRegister()

        # Ouverture de l'image avec GDAL
        # GDAL fera le choix du meilleur driver
        return gdal.Open(self.path, gdalconst.GA_ReadOnly)

    # Méthode pour ajouter des tuiles
    def addTile(self, tile):
        self.listTile.append(tile)

    # Méthode pour créer les tuiles
    def createTile(self):
        # Information géométrique de la mosaique
        inGeoTransform = self.ds.GetGeoTransform()

        # Coodonnées du haut et gauche de l'image
        left = inGeoTransform[0]
        top = inGeoTransform[3]

        # Taille d'un pixel
        pixelWidth = inGeoTransform[1]
        pixelHeight = inGeoTransform[5]

        tile_number = 0 # Initialisation d'un compteur pour l'id des tuiles

        # Parcours les colonnes de la mosaique
        for y in range(0, self.nbRows - (self.nbRows % self.tileSize), self.tileSize):
            # Ré-initialisation de la coordonnée x à chaque nouvelle ligne
            leftTile = left

            # Parcours les lignes de la mosaique
            for x in range(0, self.nbCols - (self.nbCols % self.tileSize), self.tileSize):
                # Parcours les bandes de la mosaique
                for band in range(1, self.nbBands + 1):
                    # Active chaque bande
                    rasterBand = self.ds.GetRasterBand(band)
                    # Création d'une matrice NumPy
                    matrix = rasterBand.ReadAsArray(x, y, self.tileSize, self.tileSize)
                    # Ajout de la bande à data
                    self.data[tile_number, :, :, band - 1] = matrix

                # Calcul des coordonnées de la tuile
                leftTile = left + (x * pixelWidth)
                topTile = top + (y * pixelHeight)
                rightTile = leftTile + (self.tileSize * pixelWidth)
                bottomTile = topTile + (self.tileSize * pixelHeight)
                #print leftTile, topTile, rightTile, bottomTile

                # Création d'une tuile
                tile = Tile(tile_number, leftTile, topTile, rightTile, bottomTile, self.imgProj)


                # Ajout de la tuile à la mosaique
                self.addTile(tile)

                # Incérmentation du compteur
                tile_number += 1
                #tempGeoTransform = (xCoordTemp, pixelWidth, inGeoTransform[2],yCoordTemp, inGeoTransform[4], pixelHeight)

                # Ajout à la matrice qui va contenir toute les geotransform des vignettes en tuple
                #outGeoRefMatrix.append(tempGeoTransform)

        #print 'Shape de data :', self.data.shape

    # Méthode pour ajouter la classificiation aux tuiles de la mosaique
    def addClassificationToTile(self):
        # Parcours les tuiles de la mosaique
        for tile in self.listTile:
            # Conversion de la prédiction en liste
            classification = self.prediction[tile.tile_number].tolist()

            # Arrondissement des valeurs
            classification = [int(i * 10000) for i in classification]
            classification = [(float(i) / 10000) for i in classification]

            # Ajout de la classification à la tuile
            tile.classification = classification

    def addMostLikelyClassToTile(self):
        for tile in self.listTile:
            classNamePrediction = [] # Liste qui va contenir (nom_class, single_prediction)
            meanPrediction = 1.0 / len(self.classNameList) # Moyenne de prédictions 1 = 100%
            threshold = meanPrediction * 2.0 # Seuil pour considérer que la classe est la plus probable

            for index in range(0, len(self.classNameList)):
                classNamePrediction.append((self.classNameList[index], tile.classification[index]))

            # Trie la liste en fonction des valeurs de prédiction
            classNamePrediction.sort(key = lambda tu:tu[1], reverse=True)

            # Calcul de la différence entre le score le plus haut et le second
            # Si plus grand que la valeur de seuil alors c'est la classe la plus probable
            if (classNamePrediction[0][1] - classNamePrediction[1][1]) > threshold:
                tile.mostLikelyClass = classNamePrediction[0][0]
            else:
                tile.mostLikelyClass = 'unknown'



    # Méthode pour ajouter les tuiles à la  base de données
    def addTileToDB(self, host, dbname, user, password):

        # Connection à la base de données
        # Define our connection string
        conn_string = "host=" + host + " dbname=" + dbname + " user=" + user + " password=" + password

        # get a connection, if a connect cannot be made an exception will be raised here
        conn = psycopg2.connect(conn_string)

        # conn.cursor will return a cursor object, you can use this cursor to perform queries
        cursor = conn.cursor()
        #conn.autocommit = True  # Sinon l'insert ne se fait pas


        for tile in self.listTile:
            print(1.0*(tile.tile_number+1) / (self.nbTiles*1.0))
            cursor.execute('INSERT INTO prediction(tile_number, mosaic_id, model_id, class, geom, most_likely_class) VALUES (%s, %s, %s, %s, ST_GeomFromText(%s, 4326), %s)',
                           (tile.tile_number,self.mosaic_id, self.model_id,tile.classification, tile.geom, tile.mostLikelyClass,))
            conn.commit()

        cursor.close()

    def deleteEntries(self, host, dbname, user, password):
        # Connection à la base de données
        # Define our connection string
        conn_string = "host=" + host + " dbname=" + dbname + " user=" + user + " password=" + password

        # get a connection, if a connect cannot be made an exception will be raised here
        conn = psycopg2.connect(conn_string)

        # conn.cursor will return a cursor object, you can use this cursor to perform queries
        cursor = conn.cursor()
        #conn.autocommit = True  # Sinon l'insert ne se fait pas

        #print 'Suppression de tuiles'
        cursor.execute('DELETE FROM prediction WHERE mosaic_id = %s and model_id = %s', (self.mosaic_id, self.model_id,))
        conn.commit()

        cursor.close()

    # Méthode pour chercher le nom des classes
    def getClassName(self, host, dbname, user, password):
        # Connection à la base de données
        # Define our connection string
        conn_string = "host=" + host + " dbname=" + dbname + " user=" + user + " password=" + password

        # get a connection, if a connect cannot be made an exception will be raised here
        conn = psycopg2.connect(conn_string)

        # conn.cursor will return a cursor object, you can use this cursor to perform queries
        cursor = conn.cursor()

        cursor.execute('SELECT class_name FROM model, dataset WHERE model.dataset_id = dataset.dataset_id AND model_id = %s',
                       (self.model_id,))

        # Affection du nom de classes
        classNameList = cursor.fetchone()[0]

        cursor.close()

        return classNameList


class Tile:
    def __init__(self, tile_number, left, top, right, bottom, imgProj):
        self.tile_number = tile_number
        self.polygonExtent = self.createPolygonExtent(left, top, right, bottom)
        self.geom = self.WTKExtent(imgProj) # Géométrie de la tuile en format WKT
        self.classification = [] # Liste qui contient les valeurs de la classification
        self.mostLikelyClass = ''

    # Retourne l'emprise de la tuile sous forme d'un polygone
    def createPolygonExtent(self, left, top, right, bottom):
        # Création d'un ring
        ring = ogr.Geometry(ogr.wkbLinearRing)
        ring.AddPoint(left, top)
        ring.AddPoint(right, top)
        ring.AddPoint(right, bottom)
        ring.AddPoint(left, bottom)
        ring.AddPoint(left, top)

        # Création d'un polygone
        polygon = ogr.Geometry(ogr.wkbPolygon)
        polygon.AddGeometry(ring)
        return polygon

    # Retourne l'emprise de la tuile sous forme WTK dans la projection WGS84
    def WTKExtent(self, imgProj):

        # Transformation la projection en objet SpatialReference
        imgSpatialReference = osr.SpatialReference(wkt=imgProj)

        # Définition d'un objet SpatialReference dans la projection cible
        targetProj = osr.SpatialReference()
        targetProj.ImportFromEPSG(4326)

        # Reprojection du polygone dans la projection cible
        transform = osr.CoordinateTransformation(imgSpatialReference, targetProj)
        self.polygonExtent.Transform(transform)

        # Exportation de la geom du polygone en WKT
        wkt = self.polygonExtent.ExportToWkt()

        return wkt



    
    
    
parser = optparse.OptionParser(description='Classify a mosaic.')
parser.add_option("--mosaic_id", type=int, help="ID of the mosaic")
parser.add_option("--model_id", type=int, help="ID of the model")

(options, args) = parser.parse_args()

mosaic_id = options.mosaic_id
model_id = options.model_id
    

# Création d'un objet mosaique
mosaic = Mosaic(mosaic_id, model_id, host, dbname, user, password)

# Création des tuiles
mosaic.createTile()

# Décommenter pour sauver les tuiles sous forme de matrice NumPy pour la classification avec Keras sur autre ordinateur
#np.save('sherbrooke_3bands.npy', mosaic.data)

# Création du chemin vers le fichier contenant la prédiction (pas besoin avec Keras)
if (model_id == 1):
    predictionPathModel = 'prediction_sat6_3bands.npy'
elif (model_id == 2):
    predictionPathModel = 'prediction_sat6_4bands.npy'
elif (model_id == 3):
    predictionPathModel = 'prediction_sat4_3bands.npy'
elif (model_id == 4):
    predictionPathModel = 'prediction_sat4_4bands.npy'

    
predictionFolder = '/home/paul/data/dl_prediction/' + mosaic.name.lower()
joinchar = '/'
seq = [predictionFolder, predictionPathModel]

# Chargement du tenseur qui contient les prédictions
predictionArray = np.load(joinchar.join(seq))

    
# Ajout des prédictions à la mosaique
mosaic.prediction = predictionArray
mosaic.addClassificationToTile()
mosaic.addMostLikelyClassToTile()


# Suppression des prédictions si jamais existe déjà
mosaic.deleteEntries(host, dbname, user, password)

# Ajout des tuiles dans la base de données
mosaic.addTileToDB(host, dbname, user, password)


# print mosaic.path
#
# for tile in mosaic.listTile:
#     print tile.classification, tile.mostLikelyClass