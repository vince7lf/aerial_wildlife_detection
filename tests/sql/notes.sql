-- clean images
delete FROM "testTuile4x4".image_user where image in (select id FROM "testTuile4x4".image where filename LIKE '/app/images/testTuile4x4/test_266_tile/test_266_tile/%')
delete FROM "testTuile4x4".image where filename LIKE '/app/images/testTuile4x4/test_266_tile/test_266_tile/%'