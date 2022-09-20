# Littérature et code au sujet du multilabel

## Recherche Scopus au sujet du multilabel (voir fichier .txt joint pour la liste complète): 

### Critères: 

+ Source: Pattern Recognition 
+ keywords : multilabel 
+ Toutes les années 
+ Articles seulement

### Résultat : 

117 documents
query string : SOURCE-ID ( 24823 )  AND  multilabel  AND  ( LIMIT-TO ( DOCTYPE ,  "ar" ) )
 
Je vais commencer par feuilleter la base :

- Learning multi-label scene classification

Semble qu'il y a des pbs de "débalancement". Il y a plusieurs articles à ce sujet (4), et une review: 

- A review of methods for imbalanced multi-label classification

Je vais regarder aussi les problèmes avec le multi-label. 

- A generalized weighted distance k-Nearest Neighbor for multi-label problems
 
## projets

J'ai trouvé rapidement des projets avec du code et les datasets pour essayer: 

- Multi-Label Image Classification with PyTorch: Image Tagging | LearnOpenCV # 

<https://can01.safelinks.protection.outlook.com/?url=https%3A%2F%2Flearnopencv.com%2Fmulti-label-image-classification-with-pytorch-image-tagging%2F&data=04%7C01%7CVincent.Le.Falher%40USherbrooke.ca%7C593dededb594476974ce08d9b34665fb%7C3a5a8744593545f99423b32c3a5de082%7C0%7C0%7C637737937199124501%7CUnknown%7CTWFpbGZsb3d8eyJWIjoiMC4wLjAwMDAiLCJQIjoiV2luMzIiLCJBTiI6Ik1haWwiLCJXVCI6Mn0%3D%7C3000&sdata=9r4I0fn6WhcbChRKdMRp7%2F1FnUNrmbF5f31LE120LGg%3D&reserved=0>

- General Multi-label Image Classification with Transformers | Papers With Code

<https://can01.safelinks.protection.outlook.com/?url=https%3A%2F%2Fpaperswithcode.com%2Fpaper%2Fgeneral-multi-label-image-classification-with&data=04%7C01%7CVincent.Le.Falher%40USherbrooke.ca%7C593dededb594476974ce08d9b34665fb%7C3a5a8744593545f99423b32c3a5de082%7C0%7C0%7C637737937199134459%7CUnknown%7CTWFpbGZsb3d8eyJWIjoiMC4wLjAwMDAiLCJQIjoiV2luMzIiLCJBTiI6Ik1haWwiLCJXVCI6Mn0%3D%7C3000&sdata=2E9P4bMzCQH%2BInUCVlt5G4VBZ5iv4mjX1Jsy%2FY6E4kI%3D&reserved=0>

- Build Multi Label Image Classification Model in Python (analyticsvidhya.com)

<https://can01.safelinks.protection.outlook.com/?url=https%3A%2F%2Fwww.analyticsvidhya.com%2Fblog%2F2019%2F04%2Fbuild-first-multi-label-image-classification-model-python%2F&data=04%7C01%7CVincent.Le.Falher%40USherbrooke.ca%7C593dededb594476974ce08d9b34665fb%7C3a5a8744593545f99423b32c3a5de082%7C0%7C0%7C637737937199144413%7CUnknown%7CTWFpbGZsb3d8eyJWIjoiMC4wLjAwMDAiLCJQIjoiV2luMzIiLCJBTiI6Ik1haWwiLCJXVCI6Mn0%3D%7C3000&sdata=IBO6wXh%2BOQ65AZERDC%2Fb7xTv7r9Wt5KIu%2BmWzvtNJyY%3D&reserved=0>

Pour le multi-label, il y a un test rapide avec fastai que je présente pour démarrer : <https://docs.fast.ai/tutorial.vision.html>

