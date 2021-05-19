#!/bin/bash -eu
# VCF2XG SCRIPT:
# Usage: bash vcf2xg_multi.sh uuid vg_path ref_id vcf_file alternative_vcf_file
# ex. bash vcf2xg_multi.sh test_output /bin/vg hg[19|38] test1.vcf test2.vcf 
# Reference is hg19 or hg38 from UCSC, auto-downloaded.  #/data/hg38.fa(.gz)
# Output may be in "./$uuid.xg".

uuid=$1
vg_path=$2
ref_id=$3
vcf_file=$4
alt_vcf_file=$5

tmp_dir=${MOMIG_TMP:-"./"}
pcf_file=${tmp_dir}/$vcf_file.pcf
alt_pcf_file=${tmp_dir}/$alt_vcf_file.pcf
pcf_output=${tmp_dir}/$uuid.pcf
vg_file=${tmp_dir}/$uuid.vg
ggf_file=${tmp_dir}/$uuid.ggf
xg_file=${tmp_dir}/$uuid.xg
json_file=${tmp_dir}/$uuid.json # For progress.
readable_name=$uuid

if [ $# -lt 4 ]; then
    echo "Error: arguments are not correct." 1>&2
    exit 1
fi

: $vg_path version
echo "{\"current\": 0, \"max\": 5}" > $json_file

# The workflow:
# 1. VCF->PCF by external script.
# 2. PCF->GGF2.0
# 3. GGF2.0->GFA1.0
# 4. GFA1.0->VG
# 5. VG-> XG

# 1. VCF -> PCF if needed
vcf_or_pcf=${vcf_file##*.} # Check the extension.
if [ $vcf_or_pcf = "pcf" ]; then
    cat $vcf_file > $pcf_file
else
    cp $vcf_file $vcf_file.vcf
    ruby `dirname $0`/vcf2gfa/vcf2pcf.rb $vcf_file < $vcf_file.vcf > $pcf_file
fi

# 1'. VCF -> PCF if needed
vcf_or_pcf=${alt_vcf_file##*.}
if [ $vcf_or_pcf = "pcf" ]; then
    cat $alt_vcf_file > $alt_pcf_file
else
    cp $alt_vcf_file $alt_vcf_file.vcf
    ruby `dirname $0`/vcf2gfa/vcf2pcf.rb $alt_vcf_file < $alt_vcf_file.vcf > $alt_pcf_file
fi

echo '{"current": 1, "max": 5, "reference": "'${ref_id}'", "name": "'${readable_name}'" }' > $json_file

# 2. PCF -> GGF2.0
bash -x `dirname $0`/vcf2gfa/pcf2gfa_multi.sh $pcf_file $alt_pcf_file $ref_id $uuid > $ggf_file
echo '{"current": 2, "max": 5, "reference": "'${ref_id}'", "name": "'${readable_name}'" }' > $json_file

# 3. Merge PCF
cat $pcf_file > $pcf_output
tail -n +1 $alt_pcf_file >> $pcf_output
echo '{"current": 3, "max": 5, "reference": "'${ref_id}'", "name": "'${readable_name}'" }' > $json_file

# 4. GFA1.0 -> VG
cat $ggf_file | $vg_path view -Fv - > $vg_file.old
$vg_path mod -X 1024 $vg_file.old > $vg_file
rm $vg_file.old
echo '{"current": 4, "max": 5, "reference": "'${ref_id}'", "name": "'${readable_name}'" }' > $json_file

# 5. VG(mod) -> XG
$vg_path index -x $xg_file $vg_file
echo '{"current": 5, "max": 5, "reference": "'${ref_id}'", "name": "'${readable_name}'" }' > $json_file

exit 0
