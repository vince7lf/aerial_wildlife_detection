<?php
    $model_id = intval($_POST['model_id']);
	
    // attempt a connection
    include "config.php";


    // Query to select the names of the classes
    $sqlGetPath = "SELECT *
    FROM model
    WHERE model_id = '" .$model_id. "'";


    $resultGetPath = pg_query($dbh, $sqlGetPath) or die("Error in SQL query: " . pg_last_error());


    while ($row = pg_fetch_array($resultGetPath)) {
               
        echo "<p>Précision : " .$row['accuracy']."</p>";
        echo "<p>Perte : " .$row['accuracy_loss']."</p>";
        echo "<p>Nom des bandes : " .$row['band_name']."</p>";


    
	};

    pg_close($dbh);



    return $output;
    

?>

