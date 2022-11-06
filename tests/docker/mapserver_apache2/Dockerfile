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

RUN apt-key adv --fetch-keys http://developer.download.nvidia.com/compute/cuda/repos/ubuntu1804/x86_64/7fa2af80.pub && \
    apt-key adv --fetch-keys http://developer.download.nvidia.com/compute/cuda/repos/ubuntu1804/x86_64/3bf863cc.pub

# Setup basic packages, environment and user
RUN apt-get update \
    && apt-get -y install --no-install-recommends apt-utils dialog 2>&1 \
    #
    # Verify git, process tools, lsb-release (common in install instructions for CLIs) exiftool installed
    && apt-get -y install git openssh-client iproute2 procps iproute2 lsb-release exiftool \
    #
    && conda install python=3.7 \
    # TBC if all of this is required (from AIDE scripts)
    && apt-get -y install libpq-dev python3.7-dev wget systemd \
    #
    # Install pylint
    && /opt/conda/bin/pip install pylint \
    #
    # Libraries for OpenCV
    && apt-get -y install ffmpeg libsm6 libxext6 python3-opencv \
    #
    # Create a non-root user to use if preferred - see https://aka.ms/vscode-remote/containers/non-root-user.
    && groupadd --gid $USER_GID $USERNAME \
    && useradd -s /bin/bash --uid $USER_UID --gid $USER_GID -m $USERNAME \
    # [Optional] Add sudo support for the non-root user
    && apt-get install -y sudo \
    && echo $USERNAME ALL=\(root\) NOPASSWD:ALL > /etc/sudoers.d/$USERNAME\
    && chmod 0440 /etc/sudoers.d/$USERNAME \
    #
    # Clean up
    && apt-get autoremove -y \
    && apt-get clean -y \
    && rm -rf /var/lib/apt/lists/*

# AIDE installation starts here
# specify the root folder where you wish to install AIDE
WORKDIR /home/$USERNAME/app

# setup apache and mapserver
# ============================ APACHE2 STARTS ==========================================
RUN sudo apt-get -y install apache2 \
    && sudo wget https://mirrors.edge.kernel.org/ubuntu/pool/multiverse/liba/libapache-mod-fastcgi/libapache2-mod-fastcgi_2.4.7~0910052141-1.2_amd64.deb \
    && sudo dpkg -i libapache2-mod-fastcgi_2.4.7~0910052141-1.2_amd64.deb \
    && sudo a2enmod fastcgi alias \
    && sudo chmod 755 /var/log/apache2 \
    && sudo chmod 755 /var/log \
    && port=8888 \
    && sudo sed -i "s/:80/:${port}/" /etc/apache2/sites-enabled/000-default.conf \
    && sudo sed -i "s/Listen 80/Listen ${port}/" /etc/apache2/ports.conf \
    && sudo cat "# Include the mapserver configurations: \
IncludeOptional /app/mapserv/mapserv.conf" >> /etc/apache2/apache2.conf \
    && sudo sed -i "/^\<\/IfModule\>$/i\ \ \ \ Alias \/ms \"\/usr\/lib\/cgi-bin\/mapserv\"" /etc/apache2/mods-enabled/alias.conf \
    && sudo sed -i "/^\<\/IfModule\>$/i\ \ \ \ Alias \/ms_tmp\/ \"\/app\/mapserv\/\"" /etc/apache2/mods-enabled/alias.conf \
    # Clean up
    && apt-get autoremove -y \
    && apt-get clean -y \
    && rm -rf /var/lib/apt/lists/*
# ============================ APACHE2 ENDS ==========================================

# setup mapserver
# ============================ MAPSERVER STARTS ==========================================
RUN sudo apt-get -y install cgi-mapserver \
    && sudo ln -s /usr/bin/mapserv /usr/lib/cgi-bin/mapserv \
    # Clean up
    && apt-get autoremove -y \
    && apt-get clean -y \
    && rm -rf /var/lib/apt/lists/*
# ============================ MAPSERVER ENDS ==========================================

# download AIDE source code (from local repository)
COPY . .
RUN chmod a+rx docker/container_init.sh && chmod a+rx AIDE.sh
RUN cp scripts/sh/gdalogr_createtiles*.sh /usr/local/bin && chmod a+rx /usr/local/bin/gdalogr_createtiles*.sh
RUN cp scripts/sh/mapserv_include.sh /usr/local/bin && chmod a+rx /usr/local/bin/mapserv_include.sh
RUN cp mapserv /app/mapserv

# Set to proper settings file
ENV PYTHONPATH=/home/${USERNAME}/app
ENV AIDE_CONFIG_PATH=/home/${USERNAME}/app/docker/settings.ini
ENV AIDE_MODULES=LabelUI,AIController,AIWorker,FileServer

CMD bash docker/test.sh
