# Launching AIDE

The instructions below manually launch AIDE using the [Gunicorn server](https://gunicorn.org/).



## Environment variables
Machines running an AIDE service need to have two environment variables set:
* `AIDE_CONFIG_PATH`: location (relative or absolute path) to the [configuration *.ini file](configure_settings.md) on the current machine.
* `AIDE_MODULES`: comma-separated string defining the type(s) of module(s) to be launched on the current machine. The following keywords (case-insensitive) are supported:
    - `LabelUI`: launches all the front-end, resp. user interface functionality
    - `AIController`: makes this machine the central coordinator of AI model training and inference tasks
    - `AIWorker`: makes this machine a model trainer / predictor that receives tasks from the `AIController`
    - `FileServer`: launches the image file server for all projects on this machine
    
    Notes:
    * In standard setups, only the `AIWorker` can be launched on multiple machines natively. However, AIDE should support third-party solutions, such as load balancers, that provide a single access point / URL for multiple machines, which is crucial for all the other services. This has not (yet) been tested, though.
    * The `LabelUI`, `AIController`, and `FileServer` instances' URLs should correspond to the settings provided in the configuration .ini file.
    * Multiple modules can be run on one machine. To do so, just concatenate the module names in a comma-separated list (without white spaces) as an argument for the environment variable.
    * The database is launched separately as a PostGres service.


Setting these environment variables can be done temporarily (example):
```bash
    export AIDE_CONFIG_PATH=config/settings.ini
    export AIDE_MODULES=LabelUI,AIController,FileServer,AIWorker
```

Or permanently (requires re-login):
```bash
    echo "export AIDE_CONFIG_PATH=config/settings.ini" | tee ~/.profile
    echo "export AIDE_MODULES=LabelUI,AIController,FileServer,AIWorker" | tee ~/.profile
```



## Launching AIDE
To launch AIDE (or parts of it, depending on the environment variables set) on the current machine:
```bash
    cd /path/to/your/AIDE/installation
    conda activate aide
    export AIDE_CONFIG_PATH=config/settings.ini
    export AIDE_MODULES=LabelUI
    export PYTHONPATH=.     # might be required depending on your Python setup

    ./AIDE.sh start
    
    suro
    . .bashrc
    conda info
    cd /app/aerial_wildlife_detection
    conda activate aide
    export AIDE_CONFIG_PATH=/app/aerial_wildlife_detection/config/settings.ini
    export AIDE_MODULES=LabelUI,AIController,FileServer,AIWorker
    export PYTHONPATH=.
    ./AIDE.sh start
```
This launches the Gunicorn HTTP web server, and/or a Celery message broker consumer, depending on the `AIDE_MODULES` environment variable set:

| Module | HTTP web server | Celery |
|--------------|-----------------|--------|
| LabelUI | ✓ | ✓ |
| AIController | ✓ | ✓ |
| AIWorker |  | ✓ |
| FileServer | ✓ | ✓ |


To stop AIDE, simply press Ctrl+C in the running shell. From another shell, you may instead also execute the following command from the root of AIDE, with the correct environment variables set (see above):
```
    ./AIDE.sh stop
```

Note that this stops any Gunicorn process, even if not related to AIDE.
If, for some reason, this fails, the processes can be forcefully stopped manually:
```
    pkill -f celery;
    pkill -f gunicorn;
```

## Launching AIDE from PyCharm

Launch launch_celery.sh first, and then from Pycharm launch assemble_server.py: 
```
# On the remote server host, as normal user, not as root
    cd /app/aerial_wildlife_detection
    conda activate aide
    export AIDE_CONFIG_PATH=/app/aerial_wildlife_detection/config/settings.ini
    export AIDE_MODULES=LabelUI,AIController,FileServer,AIWorker
    export PYTHONPATH=.
# make sure group and user is ubuntu, and file executable 
    sudo chown -R ubuntu .
    sudo chgrp -R ubuntu .
    chmod +x launch_celery.sh
    ./launch_celery.sh &
    ## be a bit patient, it can take more than 30 sec to launch and some output to appear
    
(aide) ubuntu@tes2:/app/aerial_wildlife_detection$ ./launch_celery.sh &
[1] 11411
(aide) ubuntu@tes2:/app/aerial_wildlife_detection$
 -------------- aide@tes2 v5.1.1 (sun-harmonics)
--- ***** -----
-- ******* ---- Linux-4.15.0-144-generic-x86_64-with-debian-buster-sid 2022-02-08 20:20:03
- *** --- * ---
- ** ---------- [config]
- ** ---------- .> app:         AIDE:0x7f10711c2310
- ** ---------- .> transport:   amqp://aide:**@localhost:5672/aide_vhost
- ** ---------- .> results:     redis://localhost:6379/0
- *** --- * --- .> concurrency: 2 (prefork)
-- ******* ---- .> task events: OFF (enable -E to monitor tasks in this worker)
--- ***** -----
 -------------- [queues]
                .> AIController     exchange=celery(direct) key=celery
                .> AIWorker         exchange=celery(direct) key=celery
                .> FileServer       exchange=celery(direct) key=celery
                .> ModelMarketplace exchange=celery(direct) key=celery
                .> aide@tes2        exchange=celery(direct) key=celery
                .> bcast.2e5eaa8a-c2d0-461e-8690-1b75e842b182 exchange=aide_broadcast(fanout) key=celery

[tasks]
  . AIController.delete_model_states
  . AIController.duplicate_model_state
  . AIController.get_inference_images
  . AIController.get_model_training_statistics
  . AIController.get_training_images
  . AIWorker.aide_internal_notify
  . AIWorker.call_average_model_states
  . AIWorker.call_inference
  . AIWorker.call_train
  . AIWorker.call_update_model
  . AIWorker.verify_model_state
  . DataAdministration.add_existing_images
  . DataAdministration.delete_project
  . DataAdministration.list_images
  . DataAdministration.prepare_data_download
  . DataAdministration.remove_images
  . DataAdministration.scan_for_images
  . DataAdministration.watch_image_folders
  . ModelMarketplace.importModelDatabase
  . ModelMarketplace.importModelURI
  . ModelMarketplace.requestModelDownload
  . ModelMarketplace.shareModel
  . general.get_worker_details
  . modules.DataAdministration.backend.celery_interface.aide_internal_notify

# Now launch assemble_server.py from PyCharm on your laptop. Make sure the last code has been copied/deployed
script path: setup\assemble_server.py
parameters: --launch=1 --check_v1=0 --migrate_db=0 --force_migrate=0 --verbose=1
Environment variables: PYTHONUNBUFFERED=1;AIDE_CONFIG_PATH=/tmp/pycharm_remote_debug_vlf/aerial_wildlife_detection/config/settings.ini;AIDE_MODULES=LabelUI,FileServer,AIController,AIWorker
Python interpreter: sftp://user@host:22/app/anaconda3//envs/aide/bin/python3.7
Working directory: \tmp\pycharm_remote_debug_vlf\aerial_wildlife_detection
```

## Stopping AIDE manually

- stop setup\assemble_server.py debugger session from PyCharm, on your local host
- login to the remote host server and kill all celery processes
```
sudo pkill -9 celery
```
- makle sure all gunicorn server are gone also
```
sudo pkill -9 gunicorn
```

## Query celery status
- launch celery 
- be in the same Python venv/conda env
```
(aide) ubuntu@tes2:/app/aerial_wildlife_detection$ celery -A celery_worker status
->  aide@tes2: OK

1 node online.

```

Refer to <https://docs.celeryproject.org/en/stable/userguide/monitoring.html> for more commands to inspect the queues.

## Debug postgreSQL log
PosgresSQL logs can be found in :   
```
sudo less /var/lib/postgresql/10/main/pg_log/postgresql-2022-02-09_143712.log
```