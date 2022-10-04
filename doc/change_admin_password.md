# How to change the admin password

AIDE uses the following statement to set the password (refer to _modules/UserHandling/backend/middleware.py:52_)

`hash = bcrypt.hashpw(password, bcrypt.gensalt(self.SALT_NUM_ROUNDS))`

The hash is saved into the _ailabeltool_ database, into the _aide_admin.user_ schema/table. 

It's possible to generate the hash manually in a Python console and update the hash into the table.  

## setup the Python virtual environment with the bcrypt module

```
source ./.venv/bin/activate
python -m pip install bcrypt
```

## Generate the hash using the Python3 console

```
python3
Python 3.7.9 (default, Jun 23 2022, 15:59:21)
[GCC 7.5.0] on linux
Type "help", "copyright", "credits" or "license" for more information.
>>> import bcrypt
>>> bcrypt.hashpw(b'Aide!234', bcrypt.gensalt(12))
b'$2b$12$e2x3G8G7RXXS2sMoUK8F0./nDuxyuvGgkp3L6kvURh/ESvPXchEje'
>>> quit()
```

You can also execute it in a one-liner command : 

> _Important Note_: need to enclose the string between single quote or the bash interpreter will interpret $ and ! and other bash special characters. 

`python3 -c 'import bcrypt; hash=bcrypt.hashpw(b"Aide!234", bcrypt.gensalt(12)); print(hash);'
b'$2b$12$5zj2E7D8f5XnQzE1tEgf.emwUzFTbR6Fjnmg8/PdRIyrBn9psyk6.'`

## Update the hash into the table for the admin user

With one liner command:

> _Important Note_: need to enclose the SQL statement string between single quote or the bash interpreter will interpret $ and ! and other bash special characters. 
> The inner single quote of the SQL statement should be escaped with a backslash. But because the entire statement is enclosed by single quote also, the right syntax is to enclose the escaping with single quotes also.  So the syntax is -c 'SELECT bla bla '\''innerstring'\'';' 

`sudo -u postgres psql -d ailabeltooldb -c 'UPDATE aide_admin.user set hash='\''$2b$12$5zj2E7D8f5XnQzE1tEgf.emwUzFTbR6Fjnmg8/PdRIyrBn9psyk6.'\'' where name='\''admin'\'';'`

You can also update it using PgAdmin and the query tool, which is safer (no interpretation of the hash string by the bash shell).

You can validate. The hash should be a long string (and not a short one).

```
sudo -u postgres psql -d ailabeltooldb -c 'SELECT hash FROM aide_admin.user where name='\''admin'\'';'
                                                            hash
----------------------------------------------------------------------------------------------------------------------------
 \x24326224313224357a6a32453744386635586e517a4531744567662e656d77557a4654625236466a6e6d67382f506452497972426e397073796b362e
(1 row)
```

