gdal_retile -levels 1 -tileIndex test_retile.shp -tileIndexField Location -ps 224 224 -targetDir c:\Users\vincent.le_falher\Downloads\AIDEMELCC\gdal_tile test_retile.jpg
ogr2ogr -f GeoJSON -s_srs crs:84 -t_srs crs:84 test_retile.geojson test_retile.shp
gdal_translate -of JPEG -scale -co worldfile=yes c:\Users\vincent.le_falher\Downloads\AIDEMELCC\gdal_tile\test_retile_14_15.tif c:\Users\vincent.le_falher\Downloads\AIDEMELCC\gdal_tile\test_retile_14_15.jpg
