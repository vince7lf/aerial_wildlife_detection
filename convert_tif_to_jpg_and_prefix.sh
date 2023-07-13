#!/bin/bash
cd "/mnt/c/Users/vincent.le.falher/Downloads/AIDE+IVADO/roseau1_C_07_07/presence"
PREFIX=pre_
for f in *.TIF; do 
	echo "Converting $f"
	convert "$f" "$PREFIX$(basename "$f" .TIF).jpg"
	rm $f
done

# to prefix 3 digits with 0 :
# In Total Commander : Select all files > Files > Multi-Rename Tool > Search for : '_(\d{3})\.' Replace With : '_0$1.' Check E and regEx > Start!