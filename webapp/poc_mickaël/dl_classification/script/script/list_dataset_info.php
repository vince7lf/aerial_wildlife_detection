<?php

// attempt a connection

include "config.php";


// execute query (note St_GeometryN to use the 1st point of the multipoint geom)
$sql = "SELECT dataset_id, dataset_name
FROM dataset
ORDER BY dataset_name asc";

$result = pg_query($dbh, $sql) or die("Error in SQL query: " . pg_last_error());



// iterate over result set


// print each row in list

while ($row = pg_fetch_array($result)) {
    
   echo '<option value="'.$row['dataset_id'].'">'.$row['dataset_name'].'</option>';

	};



 

// free memory

pg_free_result($result);



// close connection

pg_close($dbh);

?>