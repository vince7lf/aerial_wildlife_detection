'''
    AI prediction models and rankers (Active Learning criteria)
    are registered here.
    AIDE will look for the following two dicts for models available
    to projects.

    In order to register your own model, provide an entry in the
    appropriate dict with the name, description (optional), the accepted annotation type(s)
    and the prediction type the model yields.

    For example:

        'python.path.filename.MyGreatModel' : {
                            'name': 'My great model',
                            'description': 'This is my great deep detection model, based on <a href="https://www.cv-foundation.org/openaccess/content_cvpr_2016/papers/Redmon_You_Only_Look_CVPR_2016_paper.pdf" target="_blank">YOLO</a>',
                            'annotationType': [
                                'points',
                                'boundingBoxes'
                            ],
                            'predictionType': 'boundingBoxes',
                            'canAddLabelclasses': True,
                            'canRemoveLabelclasses': True,
                            'hidden': False
        }

    This model (named "My great model") is located in /python/pyth/filename.py,
    with "filename.py" having a class called "MyGreatModel".
    As can be seen, the description accepts a few HTML markup commands (scripts and
    other potentially malicious entries are strictly ignored).
    The model accepts *both* points and bounding boxes as annotations (ground truth,
    for training), and yields bounding boxes as predictions.

    Available keywords for 'annotationType' and 'predictionType':
    - labels
    - points
    - boundingBoxes
    - segmentationMasks

    If your model only accepts one annotation type (typical case: the same as the
    prediction type), you can also provide a string as a value for 'annotationType',
    instead of an array.


    Keywords 'canAddLabelclasses' and 'canRemoveLabelclasses' denote whether the model implements routines to handle
    the arrival of new, resp. the removal of obsolete label classes. This scenario may occur in two situations:
        1. A project administrator modifies the label class list in an existing project;
        2. The model is to be shared with other AIDE users and/or other projects through the Model Marketplace.

    In both scenarios, the result is that the model receives training data with label classes (resp. label class UUIDs)
    that are different from what it has originally been trained on. This means that the model will not be able to pre-
    dict the correct set of label classes, unless it is modified.
    If the keyword 'canAddLabelclasses' is set to False, or missing, AIDE prevents this model from being shared over the
    Model Marketplace. However, it does not suffice to simply provide value True for this keyword; the functionality
    also has to be implemented, or else the import of an existing model state from the Model Marketplace will result
    in erroneous behavior, and or confusion to the user.

    It is up to the model developer to decide how to modify the model to accept new and/or remove old label classes.
    The solution chosen for the built-in deep learning models is to copy the smallest weights of all existing label
    classes from the ultimate classification layer to the newly added ones, and to add a tiny bit of noise for diversi-
    ty. Obsolete class weights (and biases) are simply discarded.
    This may not be the best solution, so if you can find a better one, I would be happy to get to know it to improve
    the built-in models!

    If keyword 'hidden' is provided and set to True, the model won't be visible in the Model Marketplace. It will still
    be available for existing projects that make use of it, but new projects won't directly be able to use it anymore.
    This is used e.g. for legacy implementations that only remain to ensure compatibility with existing projects.

    Similarly, you can define your own AL criterion in the second dict below.
    For example:

        'python.path.myCriterion.MyALcriterion': {
            'name': 'My new Active Learning criterion',
            'description': 'Instead of focusing on the most difficult samples, we just chill and relax.'
        }


    2019-22 Benjamin Kellenberger
'''


# AI prediction models
PREDICTION_MODELS = {

     # built-ins

     # Detectron2
     'ai.models.detectron2.AlexNet': {
                                             'name': 'AlexNet',
                                             'author': '(built-in)',
                                             'description': '<a href="https://github.com/facebookresearch/detectron2" target="_blank">Detectron2</a> implementation of <a href="https://arxiv.org/abs/1404.5997" target="_blank">AlexNet</a>.',
                                             'annotationType': 'labels',
                                             'predictionType': 'labels',
                                             'canAddLabelclasses': True,
                                             'canRemoveLabelclasses': True
                                        },
     'ai.models.detectron2.DenseNet161': {
                                             'name': 'DenseNet-161',
                                             'author': '(built-in)',
                                             'description': '<a href="https://github.com/facebookresearch/detectron2" target="_blank">Detectron2</a> implementation of <a href="https://arxiv.org/abs/1608.06993" target="_blank">DenseNet</a>-161.',
                                             'annotationType': 'labels',
                                             'predictionType': 'labels',
                                             'canAddLabelclasses': True,
                                             'canRemoveLabelclasses': True
                                        },
     'ai.models.detectron2.MnasNet': {
                                             'name': 'MnasNet',
                                             'author': '(built-in)',
                                             'description': '<a href="https://github.com/facebookresearch/detectron2" target="_blank">Detectron2</a> implementation of <a href="https://arxiv.org/abs/1807.11626" target="_blank">MnasNet</a>.',
                                             'annotationType': 'labels',
                                             'predictionType': 'labels',
                                             'canAddLabelclasses': True,
                                             'canRemoveLabelclasses': True
                                        },
     'ai.models.detectron2.MobileNetV2': {
                                             'name': 'MobileNetV2',
                                             'author': '(built-in)',
                                             'description': '<a href="https://github.com/facebookresearch/detectron2" target="_blank">Detectron2</a> implementation of <a href="https://arxiv.org/abs/1801.04381" target="_blank">MobileNetV2</a>.',
                                             'annotationType': 'labels',
                                             'predictionType': 'labels',
                                             'canAddLabelclasses': True,
                                             'canRemoveLabelclasses': True
                                        },
     'ai.models.detectron2.ResNet18': {
                                             'name': 'ResNet-18',
                                             'author': '(built-in)',
                                             'description': '<a href="https://github.com/facebookresearch/detectron2" target="_blank">Detectron2</a> implementation of <a href="http://openaccess.thecvf.com/content_cvpr_2016/papers/He_Deep_Residual_Learning_CVPR_2016_paper.pdf" target="_blank">ResNet</a>-18.',
                                             'annotationType': 'labels',
                                             'predictionType': 'labels',
                                             'canAddLabelclasses': True,
                                             'canRemoveLabelclasses': True
                                        },
     'ai.models.detectron2.ResNet34': {
                                             'name': 'ResNet-34',
                                             'author': '(built-in)',
                                             'description': '<a href="https://github.com/facebookresearch/detectron2" target="_blank">Detectron2</a> implementation of <a href="http://openaccess.thecvf.com/content_cvpr_2016/papers/He_Deep_Residual_Learning_CVPR_2016_paper.pdf" target="_blank">ResNet</a>-34.',
                                             'annotationType': 'labels',
                                             'predictionType': 'labels',
                                             'canAddLabelclasses': True,
                                             'canRemoveLabelclasses': True
                                        },
     'ai.models.detectron2.ResNet50': {
                                             'name': 'ResNet-50',
                                             'author': '(built-in)',
                                             'description': '<a href="https://github.com/facebookresearch/detectron2" target="_blank">Detectron2</a> implementation of <a href="http://openaccess.thecvf.com/content_cvpr_2016/papers/He_Deep_Residual_Learning_CVPR_2016_paper.pdf" target="_blank">ResNet</a>-50.',
                                             'annotationType': 'labels',
                                             'predictionType': 'labels',
                                             'canAddLabelclasses': True,
                                             'canRemoveLabelclasses': True
                                        },
     'ai.models.detectron2.ResNet101': {
                                             'name': 'ResNet-101',
                                             'author': '(built-in)',
                                             'description': '<a href="https://github.com/facebookresearch/detectron2" target="_blank">Detectron2</a> implementation of <a href="http://openaccess.thecvf.com/content_cvpr_2016/papers/He_Deep_Residual_Learning_CVPR_2016_paper.pdf" target="_blank">ResNet</a>-101.',
                                             'annotationType': 'labels',
                                             'predictionType': 'labels',
                                             'canAddLabelclasses': True,
                                             'canRemoveLabelclasses': True
                                        },
     'ai.models.detectron2.ResNet152': {
                                             'name': 'ResNet-152',
                                             'author': '(built-in)',
                                             'description': '<a href="https://github.com/facebookresearch/detectron2" target="_blank">Detectron2</a> implementation of <a href="http://openaccess.thecvf.com/content_cvpr_2016/papers/He_Deep_Residual_Learning_CVPR_2016_paper.pdf" target="_blank">ResNet</a>-152.',
                                             'annotationType': 'labels',
                                             'predictionType': 'labels',
                                             'canAddLabelclasses': True,
                                             'canRemoveLabelclasses': True
                                        },
     'ai.models.detectron2.ResNeXt50': {
                                             'name': 'ResNeXt-50',
                                             'author': '(built-in)',
                                             'description': '<a href="https://github.com/facebookresearch/detectron2" target="_blank">Detectron2</a> implementation of <a href="https://arxiv.org/abs/1611.05431" target="_blank">ResNeXt</a>-50.',
                                             'annotationType': 'labels',
                                             'predictionType': 'labels',
                                             'canAddLabelclasses': True,
                                             'canRemoveLabelclasses': True
                                        },
     'ai.models.detectron2.ResNeXt101': {
                                             'name': 'ResNeXt-101',
                                             'author': '(built-in)',
                                             'description': '<a href="https://github.com/facebookresearch/detectron2" target="_blank">Detectron2</a> implementation of <a href="https://arxiv.org/abs/1611.05431" target="_blank">ResNeXt</a>-101.',
                                             'annotationType': 'labels',
                                             'predictionType': 'labels',
                                             'canAddLabelclasses': True,
                                             'canRemoveLabelclasses': True
                                        },
     'ai.models.detectron2.ShuffleNetV2': {
                                             'name': 'ShuffleNet V2',
                                             'author': '(built-in)',
                                             'description': '<a href="https://github.com/facebookresearch/detectron2" target="_blank">Detectron2</a> implementation of <a href="https://arxiv.org/abs/1807.11164" target="_blank">ShuffleNet V2</a>.',
                                             'annotationType': 'labels',
                                             'predictionType': 'labels',
                                             'canAddLabelclasses': True,
                                             'canRemoveLabelclasses': True
                                        },
     'ai.models.detectron2.SqueezeNet': {
                                             'name': 'SqueezeNet',
                                             'author': '(built-in)',
                                             'description': '<a href="https://github.com/facebookresearch/detectron2" target="_blank">Detectron2</a> implementation of <a href="https://arxiv.org/abs/1602.07360" target="_blank">SqueezeNet</a>.',
                                             'annotationType': 'labels',
                                             'predictionType': 'labels',
                                             'canAddLabelclasses': True,
                                             'canRemoveLabelclasses': True
                                        },
     'ai.models.detectron2.VGG16': {
                                             'name': 'VGG16',
                                             'author': '(built-in)',
                                             'description': '<a href="https://github.com/facebookresearch/detectron2" target="_blank">Detectron2</a> implementation of <a href="https://arxiv.org/abs/1409.1556" target="_blank">VGG</a>-16.',
                                             'annotationType': 'labels',
                                             'predictionType': 'labels',
                                             'canAddLabelclasses': True,
                                             'canRemoveLabelclasses': True
                                        },
     'ai.models.detectron2.VGG19_bn': {
                                             'name': 'VGG19_bn',
                                             'author': '(built-in)',
                                             'description': '<a href="https://github.com/facebookresearch/detectron2" target="_blank">Detectron2</a> implementation of <a href="https://arxiv.org/abs/1409.1556" target="_blank">VGG</a>-19_bn.',
                                             'annotationType': 'labels',
                                             'predictionType': 'labels',
                                             'canAddLabelclasses': True,
                                             'canRemoveLabelclasses': True
                                        },
     'ai.models.detectron2.WideResNet50': {
                                             'name': 'Wide ResNet-50',
                                             'author': '(built-in)',
                                             'description': '<a href="https://github.com/facebookresearch/detectron2" target="_blank">Detectron2</a> implementation of <a href="https://arxiv.org/pdf/1605.07146.pdf" target="_blank">Wide ResNet</a>-50.',
                                             'annotationType': 'labels',
                                             'predictionType': 'labels',
                                             'canAddLabelclasses': True,
                                             'canRemoveLabelclasses': True
                                        },
     'ai.models.detectron2.WideResNet101': {
                                             'name': 'Wide ResNet-101',
                                             'author': '(built-in)',
                                             'description': '<a href="https://github.com/facebookresearch/detectron2" target="_blank">Detectron2</a> implementation of <a href="https://arxiv.org/pdf/1605.07146.pdf" target="_blank">Wide ResNet</a>-101.',
                                             'annotationType': 'labels',
                                             'predictionType': 'labels',
                                             'canAddLabelclasses': True,
                                             'canRemoveLabelclasses': True
                                        },

     'ai.models.detectron2.FasterRCNN': {
                                             'name': 'Faster R-CNN',
                                             'author': '(built-in)',
                                             'description': '<a href="https://github.com/facebookresearch/detectron2" target="_blank">Detectron2</a> implementation of the <a href="https://doi.org/10.1109/TPAMI.2016.2577031" target="_blank">Faster R-CNN</a> object detector.',
                                             'annotationType': ['boundingBoxes', 'polygons'],
                                             'predictionType': 'boundingBoxes',
                                             'canAddLabelclasses': True,
                                             'canRemoveLabelclasses': False
                                        },
     'ai.models.detectron2.RetinaNet': {
                                             'name': 'RetinaNet',
                                             'author': '(built-in)',
                                             'description': '<a href="https://github.com/facebookresearch/detectron2" target="_blank">Detectron2</a> implementation of the <a href="http://openaccess.thecvf.com/content_ICCV_2017/papers/Lin_Focal_Loss_for_ICCV_2017_paper.pdf" target="_blank">RetinaNet</a> object detector.',
                                             'annotationType': ['boundingBoxes', 'polygons'],
                                             'predictionType': 'boundingBoxes',
                                             'canAddLabelclasses': True,
                                             'canRemoveLabelclasses': True
                                        },
     'ai.models.detectron2.TridentNet': {
                                             'name': 'TridentNet',
                                             'author': '(built-in)',
                                             'description': '<a href="https://github.com/facebookresearch/detectron2" target="_blank">Detectron2</a> implementation of the <a href="https://github.com/facebookresearch/detectron2/tree/master/projects/TridentNet" target="_blank">TridentNet</a> object detector.',
                                             'annotationType': ['boundingBoxes', 'polygons'],
                                             'predictionType': 'boundingBoxes',
                                             'canAddLabelclasses': True,
                                             'canRemoveLabelclasses': False
                                        },
     'ai.models.detectron2.YOLOv5': {
                                             'name': 'YOLOv5 (beta)',
                                             'author': '(built-in)',
                                             'description': '<a href="https://github.com/facebookresearch/detectron2" target="_blank">Detectron2</a> implementation of the <a href="https://github.com/ultralytics/yolov5" target="_blank">YOLOv5</a> object detector family.',
                                             'annotationType': ['boundingBoxes', 'polygons'],
                                             'predictionType': 'boundingBoxes',
                                             'canAddLabelclasses': True,
                                             'canRemoveLabelclasses': False
                                        },
     'ai.models.detectron2.DeepForest': {
                                             'name': 'DeepForest (beta)',
                                             'author': '(built-in)',
                                             'description': '<a href="https://github.com/facebookresearch/detectron2" target="_blank">Detectron2</a> implementation of the <a href="https://github.com/weecology/DeepForest" target="_blank">DeepForest</a> model family.',
                                             'annotationType': ['boundingBoxes', 'polygons'],
                                             'predictionType': 'boundingBoxes',
                                             'canAddLabelclasses': True,
                                             'canRemoveLabelclasses': False
                                        },
     'ai.models.detectron2.DeepLabV3Plus': {
                                             'name': 'DeepLabV3+',
                                             'author': '(built-in)',
                                             'description': '<a href="https://github.com/facebookresearch/detectron2" target="_blank">Detectron2</a> implementation of the <a href="https://openaccess.thecvf.com/content_ECCV_2018/papers/Liang-Chieh_Chen_Encoder-Decoder_with_Atrous_ECCV_2018_paper.pdf" target="_blank">DeepLabV3+</a> semantic segmentation network.',
                                             'annotationType': 'segmentationMasks',
                                             'predictionType': 'segmentationMasks',
                                             'canAddLabelclasses': True,
                                             'canRemoveLabelclasses': True
                                        },
     'ai.models.detectron2.Unet': {
                                             'name': 'U-net (beta)',
                                             'author': '(built-in)',
                                             'description': '<a href="https://github.com/facebookresearch/detectron2" target="_blank">Detectron2</a> implementation of the <a href="https://link.springer.com/content/pdf/10.1007/978-3-319-24574-4_28.pdf" target="_blank">U-net</a> semantic segmentation network.',
                                             'annotationType': 'segmentationMasks',
                                             'predictionType': 'segmentationMasks',
                                             'canAddLabelclasses': True,
                                             'canRemoveLabelclasses': True
                                        },
     # 'ai.models.detectron2.MaskRCNN': {
     #                                         'name': 'Mask R-CNN (beta)',
     #                                         'author': '(built-in)',
     #                                         'description': '<a href="https://github.com/facebookresearch/detectron2" target="_blank">Detectron2</a> implementation of the <a href="http://openaccess.thecvf.com/content_ICCV_2017/papers/He_Mask_R-CNN_ICCV_2017_paper.pdf" target="_blank">Mask R-CNN</a> instance segmentation model.',
     #                                         'annotationType': ['polygons'],
     #                                         'predictionType': 'polygons',
     #                                         'canAddLabelclasses': False,
     #                                         'canRemoveLabelclasses': False
     #                                    },

     # # PyTorch: now disabled, since they cannot handle virtual views or multispectral data
     # 'ai.models.pytorch.labels.ResNet': {
     #                                         'name': 'ResNet (legacy)',
     #                                         'author': '(built-in)',
     #                                         'description': 'Deep classification model based on <a href="http://openaccess.thecvf.com/content_cvpr_2016/papers/He_Deep_Residual_Learning_CVPR_2016_paper.pdf" target="_blank">ResNet</a>.<br /><span style="color:red">NOTE: this model is deprecated and will be removed in the future; use the Detectron2 alternative for new projects instead.</span>',
     #                                         'annotationType': 'labels',
     #                                         'predictionType': 'labels',
     #                                         'canAddLabelclasses': True,
     #                                         'canRemoveLabelclasses': True,
     #                                         'hidden': True
     #                                     },
     # 'ai.models.pytorch.points.WSODPointModel': {
     #                                         'name': 'Weakly-supervised point detector',
     #                                         'author': '(built-in)',
     #                                         'description': '<a href="http://openaccess.thecvf.com/content_cvpr_2016/papers/He_Deep_Residual_Learning_CVPR_2016_paper.pdf" target="_blank">ResNet</a>-based point predictor also working on image-wide labels (presence/absence of classes) by weak supervision. Predicts a grid and extracts points from the grid cell centers. Weak supervision requires a fair mix of images with and without objects of the respective classes. See <a href="http://openaccess.thecvf.com/content_CVPRW_2019/papers/EarthVision/Kellenberger_When_a_Few_Clicks_Make_All_the_Difference_Improving_Weakly-Supervised_CVPRW_2019_paper.pdf">Kellenberger et al., 2019</a> for details.<br /><span style="color:red">NOTE: this model is deprecated and will be removed in the future.</span>',
     #                                         'annotationType': ['labels', 'points'],
     #                                         'predictionType': 'points',
     #                                         'canAddLabelclasses': True,
     #                                         'canRemoveLabelclasses': True,
     #                                         'hidden': True
     #                                     },
     # 'ai.models.pytorch.boundingBoxes.RetinaNet': {
     #                                         'name': 'RetinaNet (legacy)',
     #                                         'author': '(built-in)',
     #                                         'description': 'Implementation of the <a href="http://openaccess.thecvf.com/content_ICCV_2017/papers/Lin_Focal_Loss_for_ICCV_2017_paper.pdf" target="_blank">RetinaNet</a> object detector.<br /><span style="color:red">NOTE: this model is deprecated and will be removed in the future; use the Detectron2 alternative for new projects instead.</span>',
     #                                         'annotationType': 'boundingBoxes',
     #                                         'predictionType': 'boundingBoxes',
     #                                         'canAddLabelclasses': True,
     #                                         'canRemoveLabelclasses': True,
     #                                         'hidden': True
     #                                     },
     # 'ai.models.pytorch.segmentationMasks.UNet': {
     #                                         'name': 'U-Net',
     #                                         'author': '(built-in)',
     #                                         'description': '<div>Implementation of the <a href="https://arxiv.org/pdf/1505.04597.pdf" target="_blank">U-Net</a> model for semantic image segmentation.<br /><span style="color:red">NOTE: this model is deprecated and will be removed in the future.</span></div><img src="https://lmb.informatik.uni-freiburg.de/people/ronneber/u-net/u-net-architecture.png" height="400px" />',
     #                                         'annotationType': 'segmentationMasks',
     #                                         'predictionType': 'segmentationMasks',
     #                                         'canAddLabelclasses': True,
     #                                         'canRemoveLabelclasses': True,
     #                                         'hidden': True
     #                                     }

     # define your own here
}



# Active Learning models
ALCRITERION_MODELS = {

    # built-ins
    'ai.al.builtins.maxconfidence.MaxConfidence': {
                                            'name': 'Max Confidence',
                                            'author': '(built-in)',
                                            'description': 'Prioritizes predictions based on the confidence value of the highest-scoring class.',
                                            'predictionType': ['labels', 'points', 'boundingBoxes', 'segmentationMasks']
                                        },
    'ai.al.builtins.breakingties.BreakingTies': {
                                            'name': 'Breaking Ties',
                                            'author': '(built-in)',
                                            'description': 'Implementation of the <a href="http://www.jmlr.org/papers/volume6/luo05a/luo05a.pdf" target="_blank">Breaking Ties</a> heuristic (difference of confidence values of highest and second-highest scoring classes).',
                                            'predictionType': ['labels', 'points', 'boundingBoxes', 'segmentationMasks']
                                        }
}