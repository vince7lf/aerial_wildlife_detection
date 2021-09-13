<?php
$q = intval($_GET['q']);


// attempt a connection
include "config.php";


// execute query
$sqlPrediction = "SELECT distinct(model_name), mod.model_id as model_id, mos.mosaic_id as mosaic_id
FROM prediction p, mosaic mos, model mod
WHERE p.mosaic_id = mos.mosaic_id 
AND
p.model_id = mod.model_id
ORDER BY model_name asc";

$resultPrediction = pg_query($dbh, $sqlPrediction) or die("Error in SQL query: " . pg_last_error());

//echo '<b>Modèle(s) :</b>';

        
while ($row = pg_fetch_array($resultPrediction)) {

    echo '<div class="listRadioPrediction" id ="' . $row["mosaic_id"] . '">';
   echo  '<label class="radio-inline"><input type="radio" name="namelistPrediction" id="listPrediction" value="'.$row["model_id"].'">'.$row["model_name"].'<br>';
    echo '</label></div>';

    //echo '<li><a del" id ="' . $row[0] . '"><li>' . $row[1] . '</li></div>';
	}

 //echo '<em>Passer la souris sur une tuile pour afficher le détail.</em>';

// free memory
pg_free_result($resultPrediction);


// close connection

pg_close($dbh);

?>