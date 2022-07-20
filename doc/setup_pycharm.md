# Setup Pycharm

## PyCharm Version
Install Pycharm Pro Edition, not the community edition, to get the remote SSH connection and run and debug the code from a remote Ubuntu host. 

## Clone the project from Github
Using PyCharm, clone the project from GitHub and checkout the 'annotation_single_label' branch. 

## Setup the remote server access to get a UBuntu 18.04 LTS environment (WSL2 Ubuntu not supported and too risky as production will be Ubuntu 18.04 LTS)

Go to Menu File > Settings > Build, Execution, Deployment > Deployment

Click on the + icon to add a SFTP deployment with the following information : 
* Type : SFTP
* SSH Configuration : host 206.12.94.82, port 22, user ubuntu, key pair file ('key2.ppk' provided by Mickaël G. by email), passphrase *****
  * Mapping Local Path: C:\Users\User\PycharmProjects\aerial_wildlife_detection
  * Deployment path : /tmp/pycharm_remote_debug_hpelitebook850g3
* Root Path: / 
* Web Server URL : http://

## Create the Python virtual environment on the remote host.
Check the document doc/install_overview.md and doc/install.md

# Setup the Python interpreter
Set the remote virtual Python interpreter as the project Python interpreter.

Go to Menu File > Settings > Project: aerial_wildlife_detection > Python Interpreter

# Add Run/Debug configuration





