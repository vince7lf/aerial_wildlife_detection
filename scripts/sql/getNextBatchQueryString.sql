
 SELECT id, image, cType, viewcount, EXTRACT(epoch FROM last_checked) as last_checked, filename, isGoldenQuestion,
                    COALESCE(bookmark, false) AS isBookmarked, "meta", "priority", "unsure", "confidence", "label" FROM (
                    SELECT id AS image, filename, 0 AS viewcount, 0 AS annoCount, NULL AS last_checked, 1E9 AS score, NULL AS timeCreated, isGoldenQuestion FROM "testVLF3"."image" AS img
                    WHERE isGoldenQuestion = TRUE
                    AND id NOT IN (
                        SELECT image FROM "testVLF3"."image_user"
                        WHERE username = 'admin'
                    )
                    UNION ALL
                    SELECT id AS image, filename, viewcount, annoCount, last_checked, score, timeCreated, isGoldenQuestion FROM "testVLF3"."image" AS img
                    LEFT OUTER JOIN (
                        SELECT * FROM "testVLF3"."image_user"
                    ) AS iu ON img.id = iu.image
                    LEFT OUTER JOIN (
                        SELECT image, SUM(confidence)/COUNT(confidence) AS score, timeCreated
                        FROM "testVLF3"."prediction"
                        WHERE cnnstate = (
                            SELECT id FROM "testVLF3"."cnnstate"
                            ORDER BY timeCreated DESC
                            LIMIT 1
                        )
                        GROUP BY image, timeCreated
                    ) AS img_score ON img.id = img_score.image
                    LEFT OUTER JOIN (
                                        SELECT image, COUNT(*) AS annoCount
                                        FROM "testVLF3"."annotation"
                                        WHERE username = 'admin'
                                        GROUP BY image
                                ) AS anno_score ON img.id = anno_score.image
                    WHERE isGoldenQuestion = FALSE AND (NOW() - COALESCE(img.last_requested, to_timestamp(0))) > interval '900 second'
                    ORDER BY isgoldenquestion DESC NULLS LAST, viewcount ASC NULLS FIRST, annoCount ASC NULLS FIRST, score DESC NULLS LAST, timeCreated DESC
                    LIMIT 1
                    ) AS img_query
                    LEFT OUTER JOIN (
                        SELECT id, image AS imID, 'annotation' AS cType, "meta", NULL AS "priority", "unsure", NULL AS "confidence", "label" FROM "testVLF3"."annotation" AS anno
                        WHERE username = 'admin'
                        UNION ALL
                        SELECT id, image AS imID, 'prediction' AS cType, NULL AS "meta", "priority", NULL AS "unsure", "confidence", "label" FROM "testVLF3"."prediction" AS pred
                        WHERE cnnstate = (
                            SELECT id FROM "testVLF3"."cnnstate"
                            ORDER BY timeCreated DESC
                            LIMIT 1
                        )
                    ) AS contents ON img_query.image = contents.imID
                    LEFT OUTER JOIN (
                        SELECT image AS bmImg, true AS bookmark
                        FROM "testVLF3"."bookmark"
                    ) AS bm ON img_query.image = bm.bmImg

                    ORDER BY isgoldenquestion DESC NULLS LAST, viewcount ASC NULLS FIRST, annoCount ASC NULLS FIRST, score DESC NULLS LAST, timeCreated DESC;
