#!/bin/bash -eu
# BAM2GAM SCRIPT:
# Usage: bash bam2gam.sh bam_file xg_file vg_path uuid
# ex. bash vcf2xg.sh test.bam test.xg /bin/vg UUID
# Output: "./$uuid.gam" and "./$uuid.gam.index".
# It discards CIGARs explicitly.
# Dependencies: bedtools, vg, gawk, ruby 

if [ $# -lt 3 ]; then
    echo "Error: arguments are not correct." 1>&2
    exit 1
fi

bam_file=$1
xg_file=$2
vg_path=$3
uuid=$4

if [ $# -lt 4 ]; then
    uuid=$1
fi

tmp_dir=${GAM_TEMP_DIR:-./}
bed_file=${tmp_dir}/$uuid.bed
gam_file=${tmp_dir}/$uuid.gam
gam_sorted_file=${tmp_dir}/$uuid.sorted.gam
gam_json_file=${tmp_dir}/$uuid.gam.json
json_file=${tmp_dir}/$uuid.json # For progress.

: $vg_path version
echo "{\"current\": 0, \"max\": 5}" > $json_file

# 1. BAM -> BED  
bedtools bamtobed -cigar -i $bam_file 2>&1 > $bed_file 
echo "{\"current\": 1, \"max\": 5}" > $json_file

# 2. BED -> Canonical BED 
# cat $bed_file | gawk '($6=="+"){gsub(/S.*/, "", $7);gsub(/^.*\D.*$/, "0", $7)}1' | parallel -j 16 --pipe gawk \'\(\$6==\"-\"\)\{\$7\=gensub\(/\(.*\)[^0-9]\([0-9]+\)S\$/,\"\\2\",\"g\",\$7\)\;gsub\(/^.*\D.*$/,\"0\",\$7\)\}1\' | sort -k 4,4 -k 7,7n > $bed_file.1
gawk '($6=="+"){gsub(/S.*/, "", $7);gsub(/^.*\D.*$/, "0", $7)}1' $bed_file | gawk '($6=="-"){$7=gensub(/(.*)[^0-9]([0-9]+)S$/, "\\2", "g", $7); gsub(/^.*\D.*$/, "0", $7)}1' | sort -k 4,4 -k 7,7n > $bed_file.1

cat $bed_file.1 | ruby `dirname $0`/bam2gam/uuid.rb | awk '$1!~/_/{print $0}' | grep -v "chrM" | grep -v "chrEBV" 2>&1 > $bed_file.2
echo "{\"current\": 2, \"max\": 5}" > $json_file

# 3. Canonical BED -> GAM -> JSON
$vg_path annotate -p -x $xg_file -b $bed_file.2 2>&1 > $gam_file.1
$vg_path view -a $gam_file.1 2>&1 > $gam_json_file
echo "{\"current\": 3, \"max\": 5}" > $json_file

# 4. JSON -> Canonical JSON
cat $gam_json_file | ruby `dirname $0`/bam2gam/json.rb 2>&1 > $gam_json_file.2
echo "{\"current\": 4, \"max\": 5}" > $json_file

# 5. Canonical JSON -> Canonical GAM 
$vg_path view -aJG $gam_json_file.2 2>&1 > $gam_file
$vg_path index -t 12 -N $gam_file -d $gam_file.index
$vg_path gamsort -d -t 12 $gam_file 2>&1 > $gam_sorted_file
$vg_path index -l $gam_sorted_file
echo "{\"current\": 5, \"max\": 5}" > $json_file
