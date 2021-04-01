#!/bin/bash -eu
# VCF2XG SCRIPT:
# Usage: bash vcf2xg.sh vcf_file uuid vg_path (ref_id|ref_path)
# ex. bash vcf2xg.sh test.vcf test_output /bin/vg hg[19|38] 
# Reference is hg19 or hg38 from UCSC, auto-downloaded.  #/data/hg38.fa(.gz)
# ex. bash vcf2xg.sh test.vcf test_output /bin/vg hg38.fa.gz 
# Output may be in "./$uuid.xg".

if [ $# -lt 4 ]; then
    echo "Error: arguments are not correct." 1>&2
    exit 1
fi

vcf_file=$1
uuid=$2
vg_path=$3
ref_id=$4 

tmp_dir="./"
pcf_file=${tmp_dir}/$uuid.pcf
vg_file=${tmp_dir}/$uuid.vg
ggf_file=${tmp_dir}/$uuid.ggf
gfa_file=${tmp_dir}/$uuid.gfa
xg_file=${tmp_dir}/$uuid.xg
json_file=${tmp_dir}/$uuid.json # For progress.
readable_name=$uuid

if builtin command -v $vg_path > /dev/null 2>&1
then
    : $vg_path version
else
    echo "Error: ${vg_path} is not executable." 1>&2
    exit 1
fi

echo "{\"current\": 0, \"max\": 5}" > $json_file

# The workflow:
# 1. VCF->PCF by external script.
# 2. PCF->GGF2.0
# 3. GGF2.0->GFA1.0
# 4. GFA1.0->VG
# 5. VG->XG

# 1. VCF -> PCF if needed
vcf_or_pcf=${vcf_file##*.}
if [ $vcf_or_pcf = "pcf" ]; then
    cat $vcf_file > $pcf_file
else
    cp $vcf_file $vcf_file.vcf
    ruby `dirname $0`/vcf2gfa/vcf2pcf.rb < $vcf_file.vcf > $pcf_file 2>&1
fi

echo '{"current": 1, "max": 5, "reference": "'${ref_id}'", "name": "'${readable_name}'" }' > $json_file

# 2. PCF -> GGF2.0
bash -x `dirname $0`/vcf2gfa/pcf2gfa.sh $pcf_file $ref_id > $ggf_file 2>&1
echo '{"current": 2, "max": 5, "reference": "'${ref_id}'", "name": "'${readable_name}'" }' > $json_file

# 3. GGF2.0 -> GFA1.0
cp $ggf_file $gfa_file
echo '{"current": 3, "max": 5, "reference": "'${ref_id}'", "name": "'${readable_name}'" }' > $json_file

# 4. GFA1.0 -> VG
#cat $ggf_file | $vg_path view -Fv - > $vg_file.old
$vg_path convert -g $gfa_file -p > $vg_file.old 2>&1
$vg_path mod -X 1024 $vg_file.old > $vg_file 2>&1
rm $vg_file.old
echo '{"current": 4, "max": 5, "reference": "'${ref_id}'", "name": "'${readable_name}'" }' > $json_file

# 5. VG(mod) -> XG
$vg_path index -x $xg_file $vg_file 2>&1
echo '{"current": 5, "max": 5, "reference": "'${ref_id}'", "name": "'${readable_name}'" }' > $json_file

exit 0
