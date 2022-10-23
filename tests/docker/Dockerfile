FROM pytorch/pytorch:1.7.1-cuda11.0-cudnn8-devel

# Avoid warnings by switching to noninteractive
ENV DEBIAN_FRONTEND=noninteractive

# This Dockerfile adds a non-root user with sudo access. Use the "remoteUser"
# property in devcontainer.json to use it. On Linux, the container user's GID/UIDs
# will be updated to match your local UID/GID (when using the dockerFile property).
# See https://aka.ms/vscode-remote/containers/non-root-user for details.
ARG USERNAME=aide
ARG USER_UID=1000
ARG USER_GID=$USER_UID

# AIDE installation starts here
# specify the root folder where you wish to install AIDE
WORKDIR /home/$USERNAME/app

# download AIDE source code (from local repository)
COPY . .

# Set to proper settings file
ENV PYTHONPATH=/home/${USERNAME}/app
ENV AIDE_CONFIG_PATH=/home/${USERNAME}/app/docker/settings.ini
ENV AIDE_MODULES=LabelUI,AIController,AIWorker,FileServer

CMD bash docker/test.sh
