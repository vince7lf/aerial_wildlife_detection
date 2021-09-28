<?php

    $mosaic_id = $_POST["inputMosaic"];
    $model_id = $_POST['model'];

	
    $cmd = "python";
	$script = "make_prediction_v2.py";
    $data_path = "/home/paul/data/dl_model/";

	$request = join( " ", array( $cmd, $script,'--mosaic_id', $mosaic_id,'--model_id', $model_id) );
    

    exec($request, $output);

    //echo $output;
    echo 'Succès! Rechargez la page et cliquez sur le panneau Résultats pour explorer les résultats.';

   ?>