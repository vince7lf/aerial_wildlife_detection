# Installation

## Requirements

* Python = 3.7 (specified in the command line below `conda create -y -n aide python=3.7`)
* conda ? miniconda ?

The AIDE label interface requires the following libraries:

* bottle>=0.12
* psycopg2>=2.8.2
* tqdm>=4.32.1
* bcrypt>=3.1.6
* netifaces>=0.10.9
* gunicorn>=19.9.0
* Pillow>=2.2.1
* numpy>=1.16.4
* requests>=2.22.0
* celery[librabbitmq,redis,auth,msgpack]>=4.3.0


Finally, the [built-in models](builtin_models.md) require:

* pytorch>=1.5.0
* torchvision>=0.6.0
* detectron2>=0.3.0
* opencv-python

If you have a CUDA-capable GPU it is highly recommended to install PyTorch with GPU support (see the [official website](https://pytorch.org/get-started/locally/)).


## Step-by-step installation

The following installation routine had been tested on Ubuntu >= 16.04. AIDE will likely run on different OS as well, with instructions requiring corresponding adaptations.

### Prepare environment

Update the system 
```bash
# Welcome to Ubuntu 18.04.5 LTS (GNU/Linux 4.15.0-144-generic x86_64)
sudo apt-get update
sudo apt-get upgrade -y
sudo apt-get dist-upgrade
# sudo do-release-upgrade  not done as there is a scary warning message "This session appears to be running under ssh. It is not recommended
to perform a upgrade over ssh currently because in case of failure it is harder to recover."
```
update vim to have the system clipboard enabled
```
sudo apt-get install -y vim-gtk3
# check if clipboard enabled in vim
:echo has('clipboard') # returns 0 or 1

to use clipboard directly in vim
* v mode
* "*y to put the block into the system clipboard

```

Install Python 3.7
```bash
# ref : https://linuxize.com/post/how-to-install-python-3-7-on-ubuntu-18-04/
sudo apt update
sudo apt install software-properties-common
sudo add-apt-repository ppa:deadsnakes/ppa
sudo apt-get install curl
sudo apt install python3.7
Install Python 3.7
```

Install anaconda
```bash
# as user, not as root 
# create /app as root
sudo mkdir /app
mkdir repo
cd repo
# anaconda requires +3Gb; makes sure mount drive disk space free > 10Gb (df -lh)
# reference: https://docs.anaconda.com/anaconda/install/linux/
wget https://repo.anaconda.com/archive/Anaconda3-2021.05-Linux-x86_64.sh
sudo bash Anaconda3-2021.05-Linux-x86_64.sh
# installed in /home/vince, not in a root folder
# Do you wish the installer to initialize Anaconda3
# by running conda init? [yes|no]
# [no] >>> yes

# to avoid conda venv starts when shell starts
conda config --set auto_activate_base false

# troubleshoot error Conda: command not found
# https://docs.anaconda.com/anaconda/user-guide/troubleshooting/#conda-command-not-found-on-macos-or-linux
```

Run the following code snippets on all machines that run one of the services for AIDE (_LabelUI_, _AIController_, _AIWorker_, etc.).
It is strongly recommended to run AIDE in a self-contained Python environment, such as [Conda](https://conda.io/) (recommended and used below) or [Virtualenv](https://virtualenv.pypa.io).

```bash
    # specify the root folder where you wish to install AIDE
    # targetDir=/path/to/desired/source/folder
    targetDir=/app
    
    # create environment (requires conda or miniconda)
    conda create -y -n aide python=3.7 (with 3.8.8 does not work)
    conda activate aide

    # download AIDE source code
    sudo apt-get update && sudo apt-get install -y git
    cd $targetDir
    # git clone -b multiProject https://github.com/microsoft/aerial_wildlife_detection.git
    git clone -b AIDE+MELCC https://github.com/vince7lf/aerial_wildlife_detection.git

    # install required libraries
    sudo apt-get install -y build-essential libpq-dev python-dev ffmpeg libsm6 libxext6 python3-opencv
    cd aerial_wildlife_detection
    pip install -U -r requirements.txt
```


### Create the settings.ini file

Every instance running one of the services for AIDE gets its general required properties from a *.ini file.
It is highly recommended to prepare a .ini file at the start of the installation of AIDE and to have a copy of the same file on all machines.
Note that in the latest version of AIDE, the .ini file does not contain any project-specific parameters anymore.
**Important: NEVER, EVER make the configuration file accessible to the outside web.**

1. Create a *.ini file for your general AIDE setup. See the provided file under `config/settings.ini` for an example. To view all possible parameters, see [here](configure_settings.md).

* images are located in /app/images
* adminPassword is Aide!234

3. Copy the *.ini file to each server instance.
4. On each instance, set the `AIDE_CONFIG_PATH` environment variable to point to your *.ini file:
```bash
    # run both commands
    
    # temporarily:
    export AIDE_CONFIG_PATH=/path/to/settings.ini
    export AIDE_CONFIG_PATH=/app/aerial_wildlife_detection/config/settings.ini

    # permanently (requires re-login):
    echo "export AIDE_CONFIG_PATH=path/to/settings.ini" | tee ~/.profile
    (aide) root@tes2:/app/aerial_wildlife_detection# echo "export AIDE_CONFIG_PATH=/app/aerial_wildlife_detection/config/settings.ini" | tee ~/.profile
```


### Set up the database instance

See [here](setup_db.md)



### Set up the message broker

The message broker is required for all services of AIDE, except for the Database.
To set up the message broker correctly, see [here](installation_aiTrainer.md).





### Import existing data

In the latest version, AIDE offers a GUI solution to configure projects and import and export images.
At the moment, previous data management scripts listed [here](import_data.md) only work if the configuration .ini
file contains all the legacy, project-specific parameters required for the previous version of AIDE.
New API scripts are under development.

### install ogrgdal 
Reference: <https://mothergeo-py.readthedocs.io/en/latest/development/how-to/gdal-ubuntu-pkg.html>

In a conda venv environment
```
sudo apt-get update && \
    sudo apt-get install -y software-properties-common && \
    sudo rm -rf /var/lib/apt/lists/*
    
sudo add-apt-repository ppa:ubuntugis/ppa \
    && sudo apt-get update \
    && sudo apt-get install -y gdal-bin \
    && sudo apt-get install -y libgdal-dev \
    && sudo apt-get install -y python3-pip \
    && export CPLUS_INCLUDE_PATH=/usr/include/gdal \
    && export C_INCLUDE_PATH=/usr/include/gdal \
    && sudo ogrinfo --version \
    # fix an error in the installation
    && pip3 install --upgrade --no-cache-dir setuptools==41.0.0 \
    && pip3 install GDAL==2.4.2    
``` 

Some error can occur when installing gdal python module

```
(aide) vince@vince-VirtualBox:~/aerial_wildlife_detection$ pip3 install GDAL==2.4.2
Error processing line 1 of /home/vince/anaconda3/envs/aide/lib/python3.7/site-packages/distutils-precedence.pth:

  Traceback (most recent call last):
    File "/home/vince/anaconda3/envs/aide/lib/python3.7/site.py", line 168, in addpackage
      exec(line)
    File "<string>", line 1, in <module>
  ModuleNotFoundError: No module named '_distutils_hack'

Remainder of file ignored
Collecting GDAL==2.4.2
  Using cached GDAL-2.4.2.tar.gz (564 kB)
  Preparing metadata (setup.py) ... done
Building wheels for collected packages: GDAL
  Building wheel for GDAL (setup.py) ... done
  Created wheel for GDAL: filename=GDAL-2.4.2-cp37-cp37m-linux_x86_64.whl size=2345436 sha256=b2bc1d6e9debc0e8786dc99392c877fd1922634b3e7bc096509aeeb713ac6d38
  Stored in directory: /home/vince/.cache/pip/wheels/2d/ed/4a/ec59835b868d89864ec563404136ecee6d954370df3d26b68a
Successfully built GDAL
Installing collected packages: GDAL
Successfully installed GDAL-2.4.2
(aide) vince@vince-VirtualBox:~/aerial_wildlife_detection$ vi ~/.profile
```

### update the .profile file 

.p# Install gdal/ogr on ubuntu 
Reference: <https://mothergeo-py.readthedocs.io/en/latest/development/how-to/gdal-ubuntu-pkg.html>

NOT IN a conda venv environment, as the script is not launched from a python venv. So the global python version of the remote dev/lab server and modules will be used. 
```
sudo apt-get update && \
    sudo apt-get install -y software-properties-common && \
    sudo rm -rf /var/lib/apt/lists/*
    
sudo add-apt-repository ppa:ubuntugis/ppa \
    && sudo apt-get update \
    && sudo apt-get install -y gdal-bin \
    && sudo apt-get install -y libgdal-dev \
    && sudo apt-get install -y python3-pip \
    && export CPLUS_INCLUDE_PATH=/usr/include/gdal \
    && export C_INCLUDE_PATH=/usr/include/gdal \
    && sudo ogrinfo --version \
    # fix an error in the installation
    && sudo pip3 install --upgrade --no-cache-dir setuptools==41.0.0 \
    && sudo pip3 install GDAL==2.4.2    
``` 

Some error can occur when installing gdal python module

```
(aide) vince@vince-VirtualBox:~/aerial_wildlife_detection$ pip3 install GDAL==2.4.2
Error processing line 1 of /home/vince/anaconda3/envs/aide/lib/python3.7/site-packages/distutils-precedence.pth:

  Traceback (most recent call last):
    File "/home/vince/anaconda3/envs/aide/lib/python3.7/site.py", line 168, in addpackage
      exec(line)
    File "<string>", line 1, in <module>
  ModuleNotFoundError: No module named '_distutils_hack'

Remainder of file ignored
Collecting GDAL==2.4.2
  Using cached GDAL-2.4.2.tar.gz (564 kB)
  Preparing metadata (setup.py) ... done
Building wheels for collected packages: GDAL
  Building wheel for GDAL (setup.py) ... done
  Created wheel for GDAL: filename=GDAL-2.4.2-cp37-cp37m-linux_x86_64.whl size=2345436 sha256=b2bc1d6e9debc0e8786dc99392c877fd1922634b3e7bc096509aeeb713ac6d38
  Stored in directory: /home/vince/.cache/pip/wheels/2d/ed/4a/ec59835b868d89864ec563404136ecee6d954370df3d26b68a
Successfully built GDAL
Installing collected packages: GDAL
Successfully installed GDAL-2.4.2
(aide) vince@vince-VirtualBox:~/aerial_wildlife_detection$ vi ~/.profile
```

# update the .profile file 

.profile file: 
```
(aide) vince@vince-VirtualBox:~/aerial_wildlife_detection$ cat ~/.profile
export AIDE_CONFIG_PATH=/home/vince/aerial_wildlife_detection/config/settings.ini
export AIDE_MODULES=LabelUI,AIController,FileServer,AIWorker
export PYTHONPATH=/home/vince/aerial_wildlife_detection
export CPLUS_INCLUDE_PATH=/usr/include/gdal
export C_INCLUDE_PATH=/usr/include/gdal
source .bashrc
(aide) vince@vince-VirtualBox:~/aerial_wildlife_detection$
```

### Launch the modules

See [here](launch_aide.md)
