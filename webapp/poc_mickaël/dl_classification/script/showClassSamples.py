# -*- coding: utf-8 -*-


outImg_path = "/home/paul/public_html/dl_classification/images"

#Importation des libraries
import os
os.environ['MPLCONFIGDIR'] = outImg_path
import numpy as np # linear algebra
import matplotlib
matplotlib.use('Agg')

import matplotlib.pyplot as plt # pour faire des graphes
import optparse # for older version of python 2.7
#import argparse # for command line arguments for python 2.7


def showClassSamples(train_x_path, train_y_path, class_id, outImg_path):
    # Chargement des images
    train_x = np.load(train_x_path)

    # Chargement des labels
    train_y = np.load(train_y_path)

    # Garde seulement les bandes 1 a 3 (RGB)
    train_x = train_x[:,:,:,:3]

    b = (train_y[:,class_id] == 1)
    label = train_x[b]

    nbImg = label.shape[0] # Nombre images dans cette classe


    # Melange les images pour afficher des images aleatoires
    np.random.shuffle(label)



    count = 0
    for i in range(0,3):
        for j in range(0,3):
            fig = plt.subplot(3, 3, count+1)

            img = label[count,:,:,:3] # Remove NIR band if any
            fig.imshow(img)
            fig.axis('off')
            count += 1

    plt.savefig(r''+outImg_path+'/sample_class.png')
    
    return nbImg


parser = optparse.OptionParser(description='Create 3 by 3 image samples of a class.')
parser.add_option("--train_x_path", help="Path to the image")
parser.add_option("--train_y_path", help="Path to the labels")
#parser.add_option("--outImg_path", help="Path write the image file")
parser.add_option("--class_id", type=int, help="ID of the class to show")

(options, args) = parser.parse_args()

train_x_path = options.train_x_path
train_y_path = options.train_y_path
class_id = options.class_id
#outImg_path = options.outImg_path

# Uncomment lines below and modify for Python > 2.7
#parser = argparse.ArgumentParser(description='Create 3 by 3 image samples of a class.')
#parser.add_argument("train_x_path", help="Path to the image")
#parser.add_argument("train_y_path", help="Path to the labels")
#parser.add_argument("outImg_path", help="Path write the image file")
#parser.add_argument("class_id", type=int, help="ID of the class to show")

#args = parser.parse_args()

nbImg = showClassSamples(train_x_path, train_y_path, class_id, outImg_path)


print nbImg

