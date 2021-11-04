# extract id
awk -F'\t' '{
  # http://data.canadensys.net/vascan/taxon/1142
  match($1, /[0-9]+$/, id);
};{
  print id[0];
}' test_regex_awk.txt

# full command
awk -F'\t' '{
  # http://data.canadensys.net/vascan/taxon/1142
  match($1, /[0-9]+$/, _res);
  id=_res[0]
};{
  print id"\t"$2"\t"$3"\t"$4"\t"$5"\t"$6"\t"$7;
}' Liste\ Sp\ vasculaire\ Qc\ VASCAN.txt | sort -k 2 | uniq | awk -F"\t" \
'BEGIN {
  print "{"
}; {
  if (!type) {
    type=$2;
    print "\""$2"\": ["
  } else if (type!=$2) {
    print "],\""$2"\": [";
    type=$2;
  } else {
    print ","
  }
}; {
  print "\t{ \
    \"name\":\""$3"\", \
    \"color\":\"#095797\", \
    \"external_id\": \""$1"\", \
    \"alias_fr\": \""$4"\", \
    \"alias_en\": \""$5"\", \
    \"cat1\": \""$6"\", \
    \"cat2\": \""$7"\" \
  }"
};END {
  print "]}"
}' > classes_melcc_org_ext.json