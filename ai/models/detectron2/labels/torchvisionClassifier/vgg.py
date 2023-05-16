'''
    2021 Benjamin Kellenberger
'''

from ai.models.detectron2.genericDetectronModel import GenericDetectron2Model
from ai.models.detectron2.labels.torchvisionClassifier import GeneralizedTorchvisionClassifier, DEFAULT_OPTIONS


class VGG16(GeneralizedTorchvisionClassifier):

    def __init__(self, project, config, dbConnector, fileServer, options):
        super().__init__(project, config, dbConnector, fileServer, options)
        assert self.detectron2cfg.MODEL.TVCLASSIFIER.FLAVOR == 'vgg16', \
            f'{self.detectron2cfg.MODEL.TVCLASSIFIER.FLAVOR} != "vgg16"'

    @classmethod
    def getDefaultOptions(cls):
        opts = GenericDetectron2Model._load_default_options(
            'config/ai/model/detectron2/labels/vgg16.json',
            DEFAULT_OPTIONS
        )
        opts['defs']['model'] = 'labels/vgg16_ImageNet.yaml'
        return opts

class VGG19_bn(GeneralizedTorchvisionClassifier):

    def __init__(self, project, config, dbConnector, fileServer, options):
        super().__init__(project, config, dbConnector, fileServer, options)
        assert self.detectron2cfg.MODEL.TVCLASSIFIER.FLAVOR == 'vgg19_bn', \
            f'{self.detectron2cfg.MODEL.TVCLASSIFIER.FLAVOR} != "vgg19_bn"'

    @classmethod
    def getDefaultOptions(cls):
        opts = GenericDetectron2Model._load_default_options(
            'config/ai/model/detectron2/labels/vgg19_bn.json',
            DEFAULT_OPTIONS
        )
        opts['defs']['model'] = 'labels/vgg19_bn_ImageNet.yaml'
        return opts