# Install and configure mapserver to serve image's annotations through WFS

_mapserver_ stable version for Ubuntu is the version 7.4.4 as we speak. 
Version 8.0 is still in dev mod and not available as a stable release. 
Version 7.6 is not available through the stable UbuntunGIS repository.

_mapserver_ version 7.4.4 documentation is located here : https://download.osgeo.org/mapserver/docs/MapServer-74.pdf

Ubuntu 18.04 LTS is the Ubuntu operating system used. 

## Installation of mapserver

### Add UbuntuGIS stable PPA repository

Sources : 
+ <https://wiki.ubuntu.com/UbuntuGIS>
+ <https://trac.osgeo.org/ubuntugis/wiki/QuickStartGuide>
+ <https://trac.osgeo.org/ubuntugis/wiki/UbuntuGISRepository>

```
~~sudo apt-get install python-properties-common~~
sudo apt-get install software-properties-common
sudo add-apt-repository ppa:ubuntugis/ppa
sudo apt-get update
```

### Install mapserver

Source : Mapserver 7.4.4 documentation file is not up-to-date. Using <https://trac.osgeo.org/ubuntugis/wiki/QuickStartGuide> instead.

Check the available version of mapserver (which is named _cgi-mapserver_ in the repo PPA; and binary is _mapserv_): 
`apt list -a cgi-mapserver`

Install the latest available using `sudo apt install cgi-mapserver`, which is _cgi-mapserver/bionic,now 7.4.1-1~bionic0 amd64_ in my case.

Test the installation

```
vince@vince-VirtualBox:~$ whereis mapserv
mapserv: /usr/bin/mapserv /usr/share/man/man1/mapserv.1.gz

vince@vince-VirtualBox:~$ mapserv -v
MapServer version 7.4.1 OUTPUT=PNG OUTPUT=JPEG OUTPUT=KML SUPPORTS=PROJ SUPPORTS=AGG SUPPORTS=FREETYPE SUPPORTS=CAIRO SUPPORTS=SVG_SYMBOLS SUPPORTS=RSVG SUPPORTS=ICONV SUPPORTS=FRIBIDI SUPPORTS=WMS_SERVER SUPPORTS=WMS_CLIENT SUPPORTS=WFS_SERVER SUPPORTS=WFS_CLIENT SUPPORTS=WCS_SERVER SUPPORTS=SOS_SERVER SUPPORTS=FASTCGI SUPPORTS=THREADS SUPPORTS=GEOS SUPPORTS=PBF INPUT=JPEG INPUT=POSTGIS INPUT=OGR INPUT=GDAL INPUT=SHAPEFILE
```

###  Installation and configuration of Apache2 for mapserver

#### fastcgi module 

Source : Mapserver 7.4.4 documentation file is not up-to-date. 

Using instead <https://www.digitalocean.com/community/tutorials/how-to-configure-nginx-as-a-web-server-and-reverse-proxy-for-apache-on-one-ubuntu-18-04-server>

Install the fastcgi module but also PHP-FPM (to test the fastcgi module other than with mapserver)

```
sudo apt install apache2 php-fpm
sudo apt-get install php libapache2-mod-php
wget https://mirrors.edge.kernel.org/ubuntu/pool/multiverse/liba/libapache-mod-fastcgi/libapache2-mod-fastcgi_2.4.7~0910052141-1.2_amd64.deb
sudo dpkg -i libapache2-mod-fastcgi_2.4.7~0910052141-1.2_amd64.deb
a2enmod actions fastcgi alias
```

Update the _mod_fastcgi_ configuration to enable PHP and map the _/usr/lib/cgi-bin_ forder with _/cgi-bin_ path.
```
<IfModule mod_fastcgi.c>
  AddHandler fastcgi-script .fcgi
  FastCgiIpcDir /var/lib/apache2/fastcgi
  AddType application/x-httpd-fastphp .php
  Action application/x-httpd-fastphp /php-fcgi
  Alias /php-fcgi /usr/lib/cgi-bin/php-fcgi
  FastCgiExternalServer /usr/lib/cgi-bin/php-fcgi -socket /run/php/php7.2-fpm.sock -pass-header Authorization
  <Directory /usr/lib/cgi-bin>
    Require all granted
  </Directory>
</IfModule>
```

Make sure that mapserver has a symbolic link into _/usr/lib/cgi-bin/mapserv_  

`ln -s /usr/bin/mapserv /usr/lib/cgi-bin/mapserv`

> **_Important note_ : change the permission of the apache2 log folder to avoid error `unable to connect to cgi daemon after multiple tries: /usr/lib/cgi-bin/mapserv`**
> 
> source : <https://serverfault.com/questions/142801/13-permission-denied-on-apache-cgi-attempt> 
> ```
> sudo chmod 755 /var/log/apache2 
> sudo chmod 755 /var/log
> ```

Test Apache2 configuration and restart Apache2

```
sudo apachectl -t
sudo systemctl reload apache2
```

If you see the warning _Could not reliably determine the server's fully qualified domain name, using 127.0.1.1. Set the 'ServerName' directive globally to suppress this message._, 
you can safely ignore it for now. We’ll configure server names later.

### Test php and mapserver integration under apache2   

#### Test with PHP

Enter in a terminal `echo "<?php phpinfo(); ?>" | sudo tee /var/www/html/info.php`

Open a browser and enter `http://localhost/info.php`

You should see an HTML page with all the PHP configuration settings. 

#### Test with mapserver

Open a browser and enter `http://localhost/cgi-bin/mapserv`

You should see an HTML page with the message _No query information to decode. QUERY_STRING is set, but empty._ 


# Install dependencies

## GDAL

source : <https://mothergeo-py.readthedocs.io/en/latest/development/how-to/gdal-ubuntu-pkg.html>

# MAJOR NOTES ABOUT THE INSTALLATION

## Enable Apache2 modules and default site 
Enable modules, conf and sites (do not forget sites) modifying the configuration files first and then using _a2enmod_ and _a2ensite_. _a2enconf_ never used but could with `a2enconf serve-cgi-bin`.

### site /etc/apache2/sites-available/000-default.conf
Change the port. 

Enable it. 
```
a2ensite -f 000-default.conf
```

### alias /etc/apache2/mods-available/alias.conf

Set the alias : 
```
        ...
        
        Alias /ms "/usr/lib/cgi-bin/mapserv"
        Alias /ms_tmp/ "/home/aide/app/mapserv/tmp/"

</IfModule>
```

Enable. 

```
a2enmod alias
```

## Disable Apache2 modules and default site 
 
To disable, use -f with the commands 

```
a2dismod -f alias
a2dissite -f 000-default.conf
```

## Error in apache2 /var/log/apache2/error.log AH01630: client denied by server configuration: /usr/lib/cgi-bin/mapserv

Enable cgid and fastcgi to enable

`a2enmod cgid fastcgi`

Do not change _/etc/apache2/conf-enabled/serve-cgi-bin.conf_ but that explains the error
```
<IfModule mod_alias.c>
        <IfModule mod_cgi.c>
                Define ENABLE_USR_LIB_CGI_BIN
        </IfModule>

        <IfModule mod_cgid.c>
                Define ENABLE_USR_LIB_CGI_BIN
        </IfModule>

        <IfDefine ENABLE_USR_LIB_CGI_BIN>
                ScriptAlias /cgi-bin/ /usr/lib/cgi-bin/
                <Directory "/usr/lib/cgi-bin">
                        AllowOverride None
                        Options +ExecCGI -MultiViews +SymLinksIfOwnerMatch
                        Require all granted
                </Directory>
        </IfDefine>
</IfModule>

```

## Error in browser msSetErrorFile(): General error message. Failed to open MS_ERRORFILE /var/www/html/wfs/log/ms_error.txt
Using <http://127.0.0.1:7781/cgi-bin/mapserv?map=/var/www/html/wfs/wfs_service.map&SERVICE=WFS&REQUEST=GetCapabilities&LAYERS=province>

Make ms_error accessible and writeable by apache2 and mapserv 
```
touch /var/www/html/wfs/log/ms_error.txt
chown www-data:www-data /var/www/html/wfs/log/ms_error.txt
```

## Error No query information to decode. QUERY_STRING is set, but empty.  
using <http://127.0.0.1:7781/ms/wfs_aide>

That means it works

## Error msCGILoadMap(): Web application error. Mapfile not found in environment variables and this server is not configured for full paths.
Using <http://127.0.0.1:7781/ms/wfs_aide?map=/var/www/html/wfs/wfs_service.map&SERVICE=WFS&REQUEST=GetCapabilities>

Using alias ms/wfs_aide and map-... into same URL. Removes the map== 

## Error Internal Server Error
Using <http://127.0.0.1:7781/ms/wfs_aide?SERVICE=WFS&REQUEST=GetCapabilities&VERSION=1.1.0>

## URL test
<http://127.0.0.1:7781/cgi-bin/mapserv?map=/var/www/html/wfs/wfs_service.map&SERVICE=WFS&REQUEST=GetCapabilities>
<http://127.0.0.1:7781/cgi-bin/mapserv?map=/var/www/html/wfs/wfs_service.map&SERVICE=WFS&REQUEST=GetCapabilities&VERSION=1.1.0>

## Docker vs Dev

In the docker container, the mapserver workdir is located under '/home/aide/app/mapserv'.
Therefore in dev mode on the VBox VM, the mapserver files need to be located in the same folder. 
Create a new user 'aide' and move the mapserver folder into '/home/aide/app/' with the owner:group set to 'aide:aide'.

```
sudo adduser aide
sudo mkdir -p /home/aide/app
sudo cp -rap /app/aerial_wildlife_detection/mapserv /home/aide/app
sudo chown -R aide:aide /home/aide/app
```