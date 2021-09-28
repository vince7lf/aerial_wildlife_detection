<?php
    $class_id = intval($_POST['class_id']);
    $dataset_id = intval($_POST['dataset_id']);
	
    // attempt a connection
    include "config.php";


    // Query to select the names of the classes
    $sqlGetPath = "SELECT data.fname,fname_label, folder_name
    FROM dataset, data
    WHERE dataset.dataset_id = data.dataset_id
    AND
    data.type = 'train'
    AND
    dataset.dataset_id = '" .$dataset_id. "'";


    $resultGetPath = pg_query($dbh, $sqlGetPath) or die("Error in SQL query: " . pg_last_error());


    while ($row = pg_fetch_array($resultGetPath)) {
               
         $folder_name = $row['folder_name'];
         $fname = $row['fname'];
         $fname_label = $row['fname_label'];
    
	};

    pg_close($dbh);


    $cmd = "python";
	$script = "showClassSamples.py";
    $data_path = "/home/paul/data/dl_model/";
    $train_x_path = join("/", array($data_path, $folder_name, $fname));
    $train_y_path = join("/", array($data_path, $folder_name, $fname_label));


    $request = join( " ", array( $cmd, $script,'--train_x_path', $train_x_path,'--train_y_path', $train_y_path, '--class_id', $class_id) );
    

    echo exec($request, $output, $restcode);


    return $output;
    

?>

