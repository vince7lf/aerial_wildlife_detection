'''
    Class handling long-running data management-
    related tasks, such as preparing annotations
    for downloading, or scanning directories for
    untracked images.

    2020-21 Benjamin Kellenberger
'''

import io
import math
import os
import re
import shutil
import subprocess
import tempfile
import zipfile
from datetime import datetime
from uuid import UUID
import time

import pytz
from PIL import Image
from psycopg2 import sql

from modules.LabelUI.backend.annotation_sql_tokens import QueryStrings_annotation, QueryStrings_prediction
from util.helpers import VALID_IMAGE_EXTENSIONS, FILENAMES_PROHIBITED_CHARS, listDirectory, base64ToImage, hexToRGB
from util.imageSharding import split_image


class DataWorker:
    NUM_IMAGES_LIMIT = 4096  # maximum number of images that can be queried at once (to avoid bottlenecks)

    def __init__(self, config, dbConnector, passiveMode=False):
        self.config = config
        self.dbConnector = dbConnector
        self.countPattern = re.compile('\_[0-9]+$')
        self.passiveMode = passiveMode

        self.tempDir = self.config.getProperty('FileServer', 'tempfiles_dir', type=str, fallback=tempfile.gettempdir())

    def aide_internal_notify(self, message):
        '''
            Used for AIDE administrative communication,
            e.g. for setting up queues.
        '''
        if self.passiveMode:
            return
        if 'task' in message:
            if message['task'] == 'create_project_folders':
                if 'fileserver' not in os.environ['AIDE_MODULES'].lower():
                    # required due to Celery interface import
                    return

                # set up folders for a newly created project
                if 'projectName' in message:
                    destPath = os.path.join(self.config.getProperty('FileServer', 'staticfiles_dir'),
                                            message['projectName'])
                    os.makedirs(destPath, exist_ok=True)

    ''' Image administration functionalities '''

    def listImages(self, project, folder=None, imageAddedRange=None, lastViewedRange=None,
                   viewcountRange=None, numAnnoRange=None, numPredRange=None,
                   orderBy=None, order='desc', startFrom=None, limit=None):
        '''
            Returns a list of images, with ID, filename,
            date image was added, viewcount, number of annotations,
            number of predictions, and last time viewed, for a given
            project.
            The list can be filtered by all those properties (e.g. 
            date and time image was added, last checked; number of
            annotations, etc.), as well as limited in length (images
            are sorted by date_added).
        '''
        queryArgs = []

        filterStr = ''
        if folder is not None and isinstance(folder, str):
            filterStr += ' filename LIKE %s '
            queryArgs.append(folder + '%')
        if imageAddedRange is not None:  # TODO
            filterStr += 'AND date_added >= to_timestamp(%s) AND date_added <= to_timestamp(%s) '
            queryArgs.append(imageAddedRange[0])
            queryArgs.append(imageAddedRange[1])
        if lastViewedRange is not None:  # TODO
            filterStr += 'AND last_viewed >= to_timestamp(%s) AND last_viewed <= to_timestamp(%s) '
            queryArgs.append(lastViewedRange[0])
            queryArgs.append(lastViewedRange[1])
        if viewcountRange is not None:
            filterStr += 'AND viewcount >= %s AND viewcount <= %s '
            queryArgs.append(viewcountRange[0])
            queryArgs.append(viewcountRange[1])
        if numAnnoRange is not None:
            filterStr += 'AND num_anno >= %s AND numAnno <= %s '
            queryArgs.append(numAnnoRange[0])
            queryArgs.append(numAnnoRange[1])
        if numPredRange is not None:
            filterStr += 'AND num_pred >= %s AND num_pred <= %s '
            queryArgs.append(numPredRange[0])
            queryArgs.append(numPredRange[1])
        if startFrom is not None:
            if not isinstance(startFrom, UUID):
                try:
                    startFrom = UUID(startFrom)
                except:
                    startFrom = None
            if startFrom is not None:
                filterStr += ' AND img.id > %s '
                queryArgs.append(startFrom)
        filterStr = filterStr.strip()
        if filterStr.startswith('AND'):
            filterStr = filterStr[3:]
        if len(filterStr.strip()):
            filterStr = 'WHERE ' + filterStr
        filterStr = sql.SQL(filterStr)

        orderStr = sql.SQL('ORDER BY img.id ASC')
        if orderBy is not None:
            orderStr = sql.SQL('ORDER BY {} {}, img.id ASC').format(
                sql.SQL(orderBy),
                sql.SQL(order)
            )

        limitStr = sql.SQL('')
        if isinstance(limit, float):
            if not math.isnan(limit):
                limit = int(limit)
            else:
                limit = self.NUM_IMAGES_LIMIT
        elif isinstance(limit, str):
            try:
                limit = int(limit)
            except:
                limit = self.NUM_IMAGES_LIMIT
        elif not isinstance(limit, int):
            limit = self.NUM_IMAGES_LIMIT
        limit = max(min(limit, self.NUM_IMAGES_LIMIT), 1)
        limitStr = sql.SQL('LIMIT %s')
        queryArgs.append(limit)

        queryStr = sql.SQL('''
            SELECT img.id, filename, EXTRACT(epoch FROM date_added) AS date_added,
                COALESCE(viewcount, 0) AS viewcount,
                EXTRACT(epoch FROM last_viewed) AS last_viewed,
                COALESCE(num_anno, 0) AS num_anno,
                COALESCE(num_pred, 0) AS num_pred,
                img.isGoldenQuestion
            FROM {id_img} AS img
            FULL OUTER JOIN (
                SELECT image, COUNT(*) AS viewcount, MAX(last_checked) AS last_viewed
                FROM {id_iu}
                GROUP BY image
            ) AS iu
            ON img.id = iu.image
            FULL OUTER JOIN (
                SELECT image, COUNT(*) AS num_anno
                FROM {id_anno}
                GROUP BY image
            ) AS anno
            ON img.id = anno.image
            FULL OUTER JOIN (
                SELECT image, COUNT(*) AS num_pred
                FROM {id_pred}
                GROUP BY image
            ) AS pred
            ON img.id = pred.image
            {filter}
            {order}
            {limit}
        ''').format(
            id_img=sql.Identifier(project, 'image'),
            id_iu=sql.Identifier(project, 'image_user'),
            id_anno=sql.Identifier(project, 'annotation'),
            id_pred=sql.Identifier(project, 'prediction'),
            filter=filterStr,
            order=orderStr,
            limit=limitStr
        )

        result = self.dbConnector.execute(queryStr, tuple(queryArgs), 'all')
        for idx in range(len(result)):
            result[idx]['id'] = str(result[idx]['id'])
        return result

    def uploadImages(self, project, images, existingFiles='keepExisting',
                     splitImages=False, splitProperties=None):
        '''
            Receives a dict of files (bottle.py file format),
            verifies their file extension and checks if they
            are loadable by PIL.
            If they are, they are saved to disk in the project's
            image folder, and registered in the database.
            Parameter "existingFiles" can be set as follows:
            - "keepExisting" (default): if an image already exists on
              disk with the same path/file name, the new image will be
              renamed with an underscore and trailing number.
            - "skipExisting": do not save images that already exist on
              disk under the same path/file name.
            - "replaceExisting": overwrite images that exist with the
              same path/file name. Note: in this case all existing anno-
              tations, predictions, and other metadata about those images,
              will be removed from the database.
            
            If "splitImages" is True, the uploaded images will be automati-
            cally divided into patches on a regular grid according to what
            is defined in "splitProperties". For example, the following
            definition:

                splitProperties = {
                    'patchSize': (800, 600),
                    'stride': (400, 300),
                    'tight': True
                }

            would divide the images into patches of size 800x600, with over-
            lap of 50% (denoted by the "stride" being half the "patchSize"),
            and with all patches completely inside the original image (para-
            meter "tight" makes the last patches to the far left and bottom
            of the image being fully inside the original image; they are shif-
            ted if needed).
            Instead of the full images, the patches are stored on disk and re-
            ferenced through the database. The name format for patches is
            "imageName_x_y.jpg", with "imageName" denoting the name of the ori-
            ginal image, and "x" and "y" the left and top position of the patch
            inside the original image.

            Returns image keys for images that were successfully
            saved, and keys and error messages for those that
            were not.
        '''
        imgPaths_valid = []
        imgs_valid = []
        imgs_warn = {}
        imgs_error = {}
        for key in images.keys():
            try:
                nextUpload = images[key]
                nextFileName = nextUpload.raw_filename
                # TODO: check if raw_filename is compatible with uploads made from Windows

                # check if correct file suffix
                _, ext = os.path.splitext(nextFileName)
                if not ext.lower() in VALID_IMAGE_EXTENSIONS:
                    raise Exception(f'Invalid file type (*{ext})')

                # check if loadable as image
                # cache = io.BytesIO()
                # nextUpload.save(cache)
                try:
                    image = images.get(key)
                    # image = Image.open(cache)
                except Exception as e:
                    raise Exception('File is not a valid image. ')

                # prepare image(s) to save to disk
                parent, filename = os.path.split(nextFileName)
                destFolder = os.path.join(self.config.getProperty('FileServer', 'staticfiles_dir'), project, parent)
                os.makedirs(destFolder, exist_ok=True)

                images = []
                filenames = []

                if not splitImages:
                    # upload the single image directly
                    images.append(image)
                    filenames.append(filename)

                    if (filename.find('_tile.') > -1):
                        existingFiles = 'replaceExisting'

                else:
                    # split image into patches instead
                    images, coords = split_image(image,
                                                 splitProperties['patchSize'],
                                                 splitProperties['stride'],
                                                 splitProperties['tight'])
                    bareFileName, ext = os.path.splitext(filename)
                    filenames = [f'{bareFileName}_{c[0]}_{c[1]}{ext}' for c in coords]

                # register and save all the images
                for i in range(len(images)):
                    subImage = images[i]
                    subFilename = filenames[i]

                    absFilePath = os.path.join(destFolder, subFilename)

                    # check if an image with the same name does not already exist
                    newFileName = subFilename
                    fileExists = os.path.exists(absFilePath)
                    if fileExists:
                        if existingFiles == 'keepExisting':
                            # rename new file
                            while (os.path.exists(absFilePath)):
                                # rename file
                                fn, ext = os.path.splitext(newFileName)
                                match = self.countPattern.search(fn)
                                if match is None:
                                    newFileName = fn + '_1' + ext
                                else:
                                    # parse number
                                    number = int(fn[match.span()[0] + 1:match.span()[1]])
                                    newFileName = fn[:match.span()[0]] + '_' + str(number + 1) + ext

                                absFilePath = os.path.join(destFolder, newFileName)
                                if not os.path.exists(absFilePath):
                                    imgs_warn[
                                        key] = 'An image with name "{}" already exists under given path on disk. Image has been renamed to "{}".'.format(
                                        subFilename, newFileName
                                    )

                        elif existingFiles == 'skipExisting':
                            # ignore new file
                            imgs_warn[key] = f'Image "{newFileName}" already exists on disk and has been skipped.'
                            imgs_valid.append(key)
                            imgPaths_valid.append(os.path.join(parent, newFileName))
                            continue

                        elif existingFiles == 'replaceExisting':
                            # overwrite new file; first remove metadata
                            queryStr = sql.SQL('''
                                DELETE FROM {id_iu}
                                WHERE image = (
                                    SELECT id FROM {id_img}
                                    WHERE filename = %s
                                );
                                DELETE FROM {id_anno}
                                WHERE image = (
                                    SELECT id FROM {id_img}
                                    WHERE filename = %s
                                );
                                DELETE FROM {id_pred}
                                WHERE image = (
                                    SELECT id FROM {id_img}
                                    WHERE filename = %s
                                );
                                DELETE FROM {id_img}
                                WHERE filename = %s;
                            ''').format(
                                id_iu=sql.Identifier(project, 'image_user'),
                                id_anno=sql.Identifier(project, 'annotation'),
                                id_pred=sql.Identifier(project, 'prediction'),
                                id_img=sql.Identifier(project, 'image')
                            )
                            self.dbConnector.execute(queryStr,
                                                     tuple([nextFileName] * 4), None)

                            # remove file
                            try:
                                os.remove(absFilePath)
                                imgs_warn[
                                    key] = 'Image "{}" already existed on disk and has been overwritten.\n'.format(
                                    newFileName) + \
                                           'All metadata (views, annotations, predictions) have been removed from the database.'
                            except:
                                imgs_warn[
                                    key] = 'Image "{}" already existed on disk but could not be overwritten.\n'.format(
                                    newFileName) + \
                                           'All metadata (views, annotations, predictions) have been removed from the database.'

                    # write to disk
                    fileParent, _ = os.path.split(absFilePath)
                    if len(fileParent):
                        os.makedirs(fileParent, exist_ok=True)
                    subImage.save(absFilePath)

                    imgs_valid.append(key)

                    # test if image is a tiff; because tiff are not built-in/supported by browser, it will be converted to a JPEG image by the script
                    # tiff image is saved to the disk but in the database it is refered as a jpg as browser do not support tif; the jpg image is saved to disk from the script gdalogr_createtiles_geotiff
                    # change the extension
                    tifMatches = ["tiff", "tif", "TIFF", "TIF"]
                    if any(x in newFileName for x in tifMatches):
                        newFileName = re.sub(r"_tile\.(?:tiff|tif|TIFF|TIF)", "_tile.jpg", newFileName)

                    jpgMatches = ["JPEG", "JPG"]
                    if any(x in newFileName for x in jpgMatches):
                        newFileName = re.sub(r"_tile\.(?:JPEG|JPG)", "_tile.jpg", newFileName)

                    imgPaths_valid.append(os.path.join(parent, newFileName))

                    # VLF is this image need to be split into tiles ?
                    self.uploadImagesEx(project, subFilename, destFolder, parent)

            except Exception as e:
                imgs_error[key] = str(e)

        # register valid images in database
        if len(imgPaths_valid):
            queryStr = sql.SQL('''
                INSERT INTO {id_img} (filename)
                VALUES %s
                ON CONFLICT (filename) DO NOTHING;
            ''').format(
                id_img=sql.Identifier(project, 'image')
            )
            self.dbConnector.insert(queryStr, [(i,) for i in imgPaths_valid])

        result = {
            'imgs_valid': imgs_valid,
            'imgPaths_valid': imgPaths_valid,
            'imgs_warn': imgs_warn,
            'imgs_error': imgs_error
        }

        # VLF update map file
        self.updateAideMapFile()

        return result

    def gdalogr_createtiles(self, project, image, destFolder, parent):
        # trigger script
        # retrieve the images generated and adds them to the image array to be added to the database, as if they were added manually

        tilenames = []
        # IN DEBUG MODE ENABLE THAT LINE
        # with open("/tmp/gdalogr_createtiles.log", "w") as f:
        # IN DEBUG MODE TAB 4 CHAR THAT LINE AND CHANGER FLAG "false" TO "true"
        #     proc = subprocess.run(["gdalogr_createtiles.sh", image, destFolder, parent, project, "true"],
        proc = subprocess.run(["gdalogr_createtiles.sh", image, destFolder, parent, project, "false"],
                          stdin=subprocess.DEVNULL,
                          # IN DEBUG MODE ENABLE THAT LINE
                          # stdout=f,
                          # IN DEBUG MODE DISABLE THAT LINE
                          stdout=subprocess.PIPE,
                          # IN DEBUG MODE ENABLE THAT LINE
                          # stderr=f,
                          # IN DEBUG MODE DISABLE THAT LINE
                          stderr=subprocess.DEVNULL,
                          universal_newlines=True,
                          bufsize=0)

        # IN DEBUG MODE TAB 4 CHAR THAT LINE
        if proc.returncode == 0: return None

        # IN DEBUG MODE TAB 4 CHAR THAT LINE
        # no output to fetch, assume no error; proof of concept mode
        for line in proc.stdout.splitlines():
            # filter only lines containing '.jpg' at the end
            if ".jpg" in line.lower():
                tilenames.append(line)

        # IN DEBUG MODE DO NOT DO ANYTHING
        return tilenames

    def updateAideMapFile(self):
        # trigger script
        # update file /home/aide/app/mapserv/aide.map

        proc = subprocess.run(["update_aide_map.sh", "false"],
                          stdin=subprocess.DEVNULL,
                          # IN DEBUG MODE ENABLE THAT LINE
                          # stdout=f,
                          # IN DEBUG MODE DISABLE THAT LINE
                          stdout=subprocess.PIPE,
                          # IN DEBUG MODE ENABLE THAT LINE
                          # stderr=f,
                          # IN DEBUG MODE DISABLE THAT LINE
                          stderr=subprocess.DEVNULL,
                          universal_newlines=True,
                          bufsize=0)

        return None

    def uploadImagesEx(self, project, filename, destFolder, parent):

        if (filename.find('_tile.') == -1): return None

        # if image is a _tile.jpg
        # trigger script
        # retrieve the images generated and adds them to the image array to be added to the database, as if they were added manually
        filenames = self.gdalogr_createtiles(project, filename, destFolder, parent)

        if filenames == None: return

        # register and save all the images
        for i in range(len(filenames)):
            subFilename = filenames[i]

            # check if an image with the same name does not already exist
            queryStr = sql.SQL('''
                        DELETE FROM {id_iu}
                        WHERE image = (
                            SELECT id FROM {id_img}
                            WHERE filename = %s
                        );
                        DELETE FROM {id_anno}
                        WHERE image = (
                            SELECT id FROM {id_img}
                            WHERE filename = %s
                        );
                        DELETE FROM {id_pred}
                        WHERE image = (
                            SELECT id FROM {id_img}
                            WHERE filename = %s
                        );
                        DELETE FROM {id_img}
                        WHERE filename = %s;
                    ''').format(
                id_iu=sql.Identifier(project, 'image_user'),
                id_anno=sql.Identifier(project, 'annotation'),
                id_pred=sql.Identifier(project, 'prediction'),
                id_img=sql.Identifier(project, 'image')
            )
            self.dbConnector.execute(queryStr,
                                     tuple([subFilename] * 4), None)

        queryStr = sql.SQL('''
                    INSERT INTO {id_img} (filename)
                    VALUES %s
                    ON CONFLICT (filename) DO NOTHING;
                ''').format(
            id_img=sql.Identifier(project, 'image')
        )
        self.dbConnector.insert(queryStr, [(i,) for i in filenames])

        return None

    def scanForImages(self, project):
        '''
            Searches the project image folder on disk for
            files that are valid, but have not (yet) been added
            to the database.
            Returns a list of paths with files.
        '''

        # scan disk for files
        projectFolder = os.path.join(self.config.getProperty('FileServer', 'staticfiles_dir'), project)
        if (not os.path.isdir(projectFolder)) and (not os.path.islink(projectFolder)):
            # no folder exists for the project (should not happen due to broadcast at project creation)
            return []
        imgs_disk = listDirectory(projectFolder, recursive=True)

        # get all existing file paths from database
        imgs_database = set()
        queryStr = sql.SQL('''
                SELECT filename FROM {id_img};
            ''').format(
            id_img=sql.Identifier(project, 'image')
        )
        result = self.dbConnector.execute(queryStr, None, 'all')
        for r in range(len(result)):
            imgs_database.add(result[r]['filename'])

        # filter
        imgs_candidates = imgs_disk.difference(imgs_database)
        imgs_candidates = list(imgs_candidates)
        for i in range(len(imgs_candidates)):
            if imgs_candidates[i].startswith('/'):
                imgs_candidates[i] = imgs_candidates[i][1:]
        return imgs_candidates

    def addExistingImages(self, project, imageList=None):
        '''
            Scans the project folder on the file system
            for images that are physically saved, but not
            (yet) added to the database.
            Adds them to the project's database schema.
            If an imageList iterable is provided, only
            the intersection between identified images on
            disk and in the iterable are added.

            If 'imageList' is a string with contents 'all',
            all untracked images will be added.

            Returns a list of image IDs and file names that
            were eventually added to the project database schema.
        '''
        # get all images on disk that are not in database
        imgs_candidates = self.scanForImages(project)

        if imageList is None or (isinstance(imageList, str) and imageList.lower() == 'all'):
            imgs_add = imgs_candidates
        else:
            if isinstance(imageList, dict):
                imageList = list(imageList.keys())
            for i in range(len(imageList)):
                if imageList[i].startswith('/'):
                    imageList[i] = imageList[i][1:]
            imgs_add = list(set(imgs_candidates).intersection(set(imageList)))

        if not len(imgs_add):
            return 0, []

        # add to database
        queryStr = sql.SQL('''
                INSERT INTO {id_img} (filename)
                VALUES %s;
            ''').format(
            id_img=sql.Identifier(project, 'image')
        )
        self.dbConnector.insert(queryStr, tuple([(i,) for i in imgs_add]))

        # get IDs of newly added images
        queryStr = sql.SQL('''
                SELECT id, filename FROM {id_img}
                WHERE filename IN %s;
            ''').format(
            id_img=sql.Identifier(project, 'image')
        )
        result = self.dbConnector.execute(queryStr, (tuple(imgs_add),), 'all')

        status = (0 if result is not None and len(result) else 1)  # TODO
        return status, result

    def removeImages(self, project, imageList, forceRemove=False, deleteFromDisk=False):
        '''
            Receives an iterable of image IDs and removes them
            from the project database schema, including associated
            user views, annotations, and predictions made.
            Only removes entries if no user views, annotations, and
            predictions exist, or else if "forceRemove" is True.
            If "deleteFromDisk" is True, the image files are also
            deleted from the project directory on the file system.

            Returns a list of images that were deleted.
        '''

        imageList = tuple([(UUID(i),) for i in imageList])

        queryArgs = []
        deleteArgs = []
        if forceRemove:
            queryStr = sql.SQL('''
                    SELECT id, filename
                    FROM {id_img}
                    WHERE id IN %s;
                ''').format(
                id_img=sql.Identifier(project, 'image')
            )
            queryArgs = tuple([imageList])

            deleteStr = sql.SQL('''
                    DELETE FROM {id_iu} WHERE image IN %s;
                    DELETE FROM {id_anno} WHERE image IN %s;
                    DELETE FROM {id_pred} WHERE image IN %s;
                    DELETE FROM {id_img} WHERE id IN %s;
                ''').format(
                id_iu=sql.Identifier(project, 'image_user'),
                id_anno=sql.Identifier(project, 'annotation'),
                id_pred=sql.Identifier(project, 'prediction'),
                id_img=sql.Identifier(project, 'image')
            )
            deleteArgs = tuple([imageList] * 4)

        else:
            queryStr = sql.SQL('''
                    SELECT id, filename
                    FROM {id_img}
                    WHERE id IN %s
                    AND id NOT IN (
                        SELECT image FROM {id_iu}
                        WHERE image IN %s
                        UNION ALL
                        SELECT image FROM {id_anno}
                        WHERE image IN %s
                        UNION ALL
                        SELECT image FROM {id_pred}
                        WHERE image IN %s
                    );
                ''').format(
                id_img=sql.Identifier(project, 'image'),
                id_iu=sql.Identifier(project, 'image_user'),
                id_anno=sql.Identifier(project, 'annotation'),
                id_pred=sql.Identifier(project, 'prediction')
            )
            queryArgs = tuple([imageList] * 4)

            deleteStr = sql.SQL('''
                    DELETE FROM {id_img}
                    WHERE id IN %s
                    AND id NOT IN (
                        SELECT image FROM {id_iu}
                        WHERE image IN %s
                        UNION ALL
                        SELECT image FROM {id_anno}
                        WHERE image IN %s
                        UNION ALL
                        SELECT image FROM {id_pred}
                        WHERE image IN %s
                    );
                ''').format(
                id_img=sql.Identifier(project, 'image'),
                id_iu=sql.Identifier(project, 'image_user'),
                id_anno=sql.Identifier(project, 'annotation'),
                id_pred=sql.Identifier(project, 'prediction')
            )
            deleteArgs = tuple([imageList] * 4)

        # retrieve images to be deleted
        imgs_del = self.dbConnector.execute(queryStr, queryArgs, 'all')

        if imgs_del is None:
            imgs_del = []

        if len(imgs_del):
            # delete images
            self.dbConnector.execute(deleteStr, deleteArgs, None)

            if deleteFromDisk:
                projectFolder = os.path.join(self.config.getProperty('FileServer', 'staticfiles_dir'), project)
                if os.path.isdir(projectFolder) or os.path.islink(projectFolder):
                    for i in imgs_del:
                        filePath = os.path.join(projectFolder, i['filename'])
                        if os.path.isfile(filePath):
                            os.remove(filePath)

            # convert UUID
            for idx in range(len(imgs_del)):
                imgs_del[idx]['id'] = str(imgs_del[idx]['id'])

        return imgs_del

    def removeOrphanedImages(self, project):
        '''
            Queries the project's image entries in the database and retrieves
            entries for which no image can be found on disk anymore. Removes
            and returns those entries and all associated (meta-) data from the
            database.
        '''
        imgs_DB = self.dbConnector.execute(sql.SQL('''
                SELECT id, filename FROM {id_img};
            ''').format(
            id_img=sql.Identifier(project, 'image')
        ), None, 'all')

        projectFolder = os.path.join(self.config.getProperty('FileServer', 'staticfiles_dir'), project)
        if (not os.path.isdir(projectFolder)) and (not os.path.islink(projectFolder)):
            return []
        imgs_disk = listDirectory(projectFolder, recursive=True)
        imgs_disk = set(imgs_disk)

        # get orphaned images
        imgs_orphaned = []
        for i in imgs_DB:
            if i['filename'] not in imgs_disk:
                imgs_orphaned.append(i['id'])
        # imgs_orphaned = list(set(imgs_DB).difference(imgs_disk))
        if not len(imgs_orphaned):
            return []

        # remove
        self.dbConnector.execute(sql.SQL('''
                DELETE FROM {id_iu} WHERE image IN %s;
                DELETE FROM {id_anno} WHERE image IN %s;
                DELETE FROM {id_pred} WHERE image IN %s;
                DELETE FROM {id_img} WHERE id IN %s;
            ''').format(
            id_iu=sql.Identifier(project, 'image_user'),
            id_anno=sql.Identifier(project, 'annotation'),
            id_pred=sql.Identifier(project, 'prediction'),
            id_img=sql.Identifier(project, 'image')
        ), tuple([tuple(imgs_orphaned)] * 4), None)

        return imgs_orphaned

    def prepareDataDownload(self, project, dataType='annotation', userList=None, dateRange=None, extraFields=None,
                            segmaskFilenameOptions=None, segmaskEncoding='rgb'):
        '''
            Polls the database for project data according to the
            specified restrictions:
            - dataType: "annotation" or "prediction"
            - userList: for type "annotation": None (all users) or
                        an iterable of user names
            - dateRange: None (all dates) or two values for a mini-
                         mum and maximum timestamp
            - extraFields: None (no field) or dict of keywords and bools for
                           additional fields (e.g. browser meta) to be queried.
            - segmaskFilenameOptions: customization parameters for segmentation
                                      mask images' file names.
            - segmaskEncoding: encoding of the segmentation mask pixel
                               values ("rgb" or "indexed")

            Creates a file in this machine's temporary directory
            and returns the file name to it.
            Note that in some cases (esp. for semantic segmentation),
            the number of queryable entries may be limited due to
            file size and free disk space restrictions. An upper cei-
            ling is specified in the configuration *.ini file ('TODO')
        '''

        now = datetime.now(tz=pytz.utc)

        # argument check
        if userList is None:
            userList = []
        elif isinstance(userList, str):
            userList = [userList]
        if dateRange is None:
            dateRange = []
        elif len(dateRange) == 1:
            dateRange = [dateRange, now]

        if extraFields is None or not isinstance(extraFields, dict):
            extraFields = {
                'meta': False
            }
        else:
            if not 'meta' in extraFields or not isinstance(extraFields['meta'], bool):
                extraFields['meta'] = False

        if segmaskFilenameOptions is None:
            segmaskFilenameOptions = {
                'baseName': 'filename',
                'prefix': '',
                'suffix': ''
            }
        else:
            if not 'baseName' in segmaskFilenameOptions or \
                    segmaskFilenameOptions['baseName'] not in ('filename', 'id'):
                segmaskFilenameOptions['baseName'] = 'filename'
            try:
                segmaskFilenameOptions['prefix'] = str(segmaskFilenameOptions['prefix'])
            except:
                segmaskFilenameOptions['prefix'] = ''
            try:
                segmaskFilenameOptions['suffix'] = str(segmaskFilenameOptions['suffix'])
            except:
                segmaskFilenameOptions['suffix'] = ''

            for char in FILENAMES_PROHIBITED_CHARS:
                segmaskFilenameOptions['prefix'] = segmaskFilenameOptions['prefix'].replace(char, '_')
                segmaskFilenameOptions['suffix'] = segmaskFilenameOptions['suffix'].replace(char, '_')

        # check metadata type: need to deal with segmentation masks separately
        if dataType == 'annotation':
            metaField = 'annotationtype'
        elif dataType == 'prediction':
            metaField = 'predictiontype'
        else:
            raise Exception('Invalid dataType specified ({})'.format(dataType))
        metaType = self.dbConnector.execute('''
                    SELECT {} FROM aide_admin.project
                    WHERE shortname = %s;
                '''.format(metaField),
                                            (project,),
                                            1
                                            )[0][metaField]

        if metaType.lower() == 'segmentationmasks':
            is_segmentation = True
            fileExtension = '.zip'

            # create indexed color palette for segmentation masks
            if segmaskEncoding == 'indexed':
                try:
                    indexedColors = []
                    labelClasses = self.dbConnector.execute(sql.SQL('''
                                SELECT idx, color FROM {id_lc} ORDER BY idx ASC;
                            ''').format(id_lc=sql.Identifier(project, 'labelclass')),
                                                            None, 'all')
                    currentIndex = 1
                    for lc in labelClasses:
                        if lc['idx'] == 0:
                            # background class
                            continue
                        while currentIndex < lc['idx']:
                            # gaps in label classes; fill with zeros
                            indexedColors.extend([0, 0, 0])
                            currentIndex += 1
                        color = lc['color']
                        if color is None:
                            # no color specified; add from defaults
                            # TODO
                            indexedColors.extend([0, 0, 0])
                        else:
                            # convert to RGB format
                            indexedColors.extend(hexToRGB(color))

                except:
                    # an error occurred; don't convert segmentation mask to indexed colors
                    indexedColors = None
            else:
                indexedColors = None

        else:
            is_segmentation = False
            fileExtension = '.txt'  # TODO: support JSON?

        # prepare output file
        filename = 'aide_query_{}'.format(now.strftime('%Y-%m-%d_%H-%M-%S')) + fileExtension
        destPath = os.path.join(self.tempDir, 'aide/downloadRequests', project)
        os.makedirs(destPath, exist_ok=True)
        destPath = os.path.join(destPath, filename)
        filename_shared = project + fileExtension
        projectFolder = os.path.join(self.config.getProperty('FileServer', 'staticfiles_dir'), project)
        destPath_shared = os.path.join(projectFolder, filename_shared)

        # generate query
        queryArgs = []
        tableID = sql.Identifier(project, dataType)
        userStr = sql.SQL('')
        iuStr = sql.SQL('')
        dateStr = sql.SQL('')
        queryFields = [
            'filename', 'isGoldenQuestion', 'date_image_added', 'last_requested_image', 'image_corrupt'
            # default image fields
        ]
        if dataType == 'annotation':
            iuStr = sql.SQL('''
                    JOIN (SELECT image AS iu_image, username AS iu_username, viewcount, last_checked, last_time_required FROM {id_iu}) AS iu
                    ON t.image = iu.iu_image
                    AND t.username = iu.iu_username
                ''').format(
                id_iu=sql.Identifier(project, 'image_user')
            )
            if len(userList):
                userStr = sql.SQL('WHERE username IN %s')
                queryArgs.append(tuple(userList))

            queryFields.extend(getattr(QueryStrings_annotation, metaType).value)
            queryFields.extend(
                ['username', 'viewcount', 'last_checked', 'last_time_required'])  # TODO: make customizable

        else:
            queryFields.extend(getattr(QueryStrings_prediction, metaType).value)

        if len(dateRange):
            if len(userStr.string):
                dateStr = sql.SQL(' AND timecreated >= to_timestamp(%s) AND timecreated <= to_timestamp(%s)')
            else:
                dateStr = sql.SQL('WHERE timecreated >= to_timestamp(%s) AND timecreated <= to_timestamp(%s)')
            queryArgs.extend(dateRange)

        if not is_segmentation:
            # join label classes
            lcStr = sql.SQL('''
                    JOIN (SELECT id AS lcID, name AS labelclass_name, idx AS labelclass_index, vascan_id, bryoquel_id, coleo_vernacular_fr, coleo_vernacular_en, vascan_region, vascan_province, vascan_port, vascan_statut_repartition, tsn, coleo_category
                        FROM {id_lc}
                    ) AS lc
                    ON al.label = lc.lcID
                ''').format(
                id_lc=sql.Identifier(project, 'labelclass')
            )
            queryFields.extend(
                ['labelclass_name', 'labelclass_index', 'vascan_id', 'bryoquel_id', 'coleo_vernacular_fr',
                 'coleo_vernacular_en', 'vascan_region', 'vascan_province', 'vascan_port', 'vascan_statut_repartition',
                 'tsn', 'coleo_category'])
        else:
            lcStr = sql.SQL('')

        # remove redundant query fields
        queryFields = set(queryFields)
        for key in extraFields.keys():
            if key in queryFields and not extraFields[key]:
                queryFields.remove(key)
        queryFields = list(queryFields);

        queryStr = sql.SQL('''
            SELECT t.id, 
                t.username, 
                t.image, 
                t.meta, 
                t.autoconverted, 
                t.timecreated, 
                t.timerequired, 
                t.unsure, 
                al.label, img.*, lc.*, iu.*
            FROM {tableID} AS t
            
            JOIN (SELECT annotation, label
                FROM {annotation_label}
            ) AS al
            ON t.id = al.annotation
            
            JOIN (
                SELECT id AS imgID, filename, isGoldenQuestion, date_added AS date_image_added, last_requested AS last_requested_image, corrupt AS image_corrupt
                FROM {id_img}
            ) AS img 
            ON t.image = img.imgID
            
                {lcStr}
                {iuStr}
                {userStr}
                {dateStr}
            ''').format(
            tableID=tableID,
            annotation_label=sql.Identifier(project, 'annotation_label'),
            id_img=sql.Identifier(project, 'image'),
            lcStr=lcStr,
            iuStr=iuStr,
            userStr=userStr,
            dateStr=dateStr
        )

        # query and process data
        if is_segmentation:
            mainFile = zipfile.ZipFile(destPath, 'w', zipfile.ZIP_DEFLATED)
        else:
            mainFile = open(destPath, 'w')
        metaStr = '; '.join(queryFields) + '\n'

        allData = self.dbConnector.execute(queryStr, tuple(queryArgs), 'all')
        if allData is not None and len(allData):
            for b in allData:
                if is_segmentation:
                    # convert and store segmentation mask separately
                    segmask_filename = 'segmentation_masks/'

                    if segmaskFilenameOptions['baseName'] == 'id':
                        innerFilename = b['image']
                        parent = ''
                    else:
                        innerFilename = b['filename']
                        parent, innerFilename = os.path.split(innerFilename)
                    finalFilename = os.path.join(parent, segmaskFilenameOptions['prefix'] + innerFilename +
                                                 segmaskFilenameOptions['suffix'] + '.tif')
                    segmask_filename += finalFilename

                    segmask = base64ToImage(b['segmentationmask'], b['width'], b['height'])

                    if indexedColors is not None and len(indexedColors) > 0:
                        # convert to indexed color and add color palette from label classes
                        segmask = segmask.convert('RGB').convert('P', palette=Image.ADAPTIVE, colors=3)
                        segmask.putpalette(indexedColors)

                    # save
                    bio = io.BytesIO()
                    segmask.save(bio, 'TIFF')
                    mainFile.writestr(segmask_filename, bio.getvalue())

                # store metadata
                metaLine = ''
                for field in queryFields:
                    if field.lower() == 'segmentationmask':
                        continue
                    metaLine += '{}; '.format(b[field.lower()])
                metaStr += metaLine + '\n'

        if is_segmentation:
            mainFile.writestr('query.txt', metaStr)
        else:
            mainFile.write(metaStr)

        if is_segmentation:
            # append separate text file for label classes
            labelclassQuery = sql.SQL('''
                    SELECT id, name, color, labelclassgroup, idx AS labelclass_index
                    FROM {id_lc};
                ''').format(
                id_lc=sql.Identifier(project, 'labelclass')
            )
            result = self.dbConnector.execute(labelclassQuery, None, 'all')
            lcStr = 'id,name,color,labelclassgroup,labelclass_index\n'
            for r in result:
                lcStr += '{},{},{},{},{}\n'.format(
                    r['id'],
                    r['name'],
                    r['color'],
                    r['labelclassgroup'],
                    r['labelclass_index']
                )
            mainFile.writestr('labelclasses.csv', lcStr)

        mainFile.close()

         # Copy the file to the public project folder, with the name of the project. Overwrite it if exists with latest
        shutil.copyfile(destPath, destPath_shared)

        return filename

    def watchImageFolders(self):
        '''
            Queries all projects that have the image folder watch functionality
            enabled and updates the projects, one by one, with the latest image
            changes.
        '''
        projects = self.dbConnector.execute('''
                    SELECT shortname, watch_folder_remove_missing_enabled
                    FROM aide_admin.project
                    WHERE watch_folder_enabled IS TRUE;
                ''', None, 'all')

        if projects is not None and len(projects):
            for p in projects:
                pName = p['shortname']

                # add new images
                _, imgs_added = self.addExistingImages(pName, None)

                # remove orphaned images (if enabled)
                if p['watch_folder_remove_missing_enabled']:
                    imgs_orphaned = self.removeOrphanedImages(pName)
                    if len(imgs_added) or len(imgs_orphaned):
                        print(
                            f'[Project {pName}] {len(imgs_added)} new images found and added, {len(imgs_orphaned)} orphaned images removed from database.')

                elif len(imgs_added):
                    print(f'[Project {pName}] {len(imgs_added)} new images found and added.')

    def deleteProject(self, project, deleteFiles=False):
        '''
            Irreproducibly deletes a project, including all data and metadata, from the database.
            If "deleteFiles" is True, then any data on disk (images, etc.) are also deleted.

            This cannot be undone.
        '''
        print(f'Deleting project with shortname "{project}"...')

        # remove database entries
        print('\tRemoving database entries...')
        self.dbConnector.execute('''
                DELETE FROM aide_admin.authentication
                WHERE project = %s;
                DELETE FROM aide_admin.project
                WHERE shortname = %s;
            ''', (project, project,),
                                 None)  # already done by DataAdministration.middleware, but we do it again to be sure

        self.dbConnector.execute('''
                DROP SCHEMA IF EXISTS "{}" CASCADE;
            '''.format(project), None, None)  # TODO: Identifier?

        if deleteFiles:
            print('\tRemoving files...')

            messages = []

            projectPath = os.path.join(self.config.getProperty('FileServer', 'staticfiles_dir'), project)

            if os.path.isdir(projectPath) or os.path.islink(projectPath):
                def _onError(function, path, excinfo):
                    # TODO
                    from celery.contrib import rdb
                    rdb.set_trace()
                    messages.append(str(excinfo))

                try:
                    shutil.rmtree(os.path.join(self.config.getProperty('FileServer', 'staticfiles_dir'), project),
                                  onerror=_onError)
                except Exception as e:
                    messages.append(str(e))

            return messages

        return 0
