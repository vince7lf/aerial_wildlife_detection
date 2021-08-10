awk -F'\t' '{print $2"\t"$3}' Liste\ Sp\ vasculaire\ Qc\ VASCAN.txt | sort | uniq | awk -F"\t" 'BEGIN{print "{"}; { if
 (!type) { type=$1; print "\""$1"\": ["} else if (type!=$1) { print "],\""$1"\": ["; type=$1; } else {print ","}}; { pri
nt "\t{\"name\":\""$2"\", \"color\":\"#1111FF\"}" };END {print "]}"}' > classes_melcc_org.json