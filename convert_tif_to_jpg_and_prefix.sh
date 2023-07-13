#!/bin/bash
cd "/mnt/c/Users/vincent.le.falher/Downloads/AIDE+IVADO/roseau1_C_07_07/presence"
PREFIX=pre_
for f in *.TIF; do 
	echo "Converting $f"
	convert "$f" "$PREFIX$(basename "$f" .TIF).jpg"
	rm $f
done
