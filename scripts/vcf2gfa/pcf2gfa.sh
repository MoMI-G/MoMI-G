#!/bin/bash -eu

#cd $(dirname $0)

input=$1
reference=$2
pref=$input

sort -t","  -k 7n $input > $pref.output.pcf
awk -F "[,:]" '{print $1,"\t",$2,"\n",$4,"\t",$5}' $input | sed -e 's/[ ]*//g' | sort -k 1,1 -k 2,2n | uniq > $pref.bp.tsv
ruby vcf2gfa/json_to_breakpoint_list.rb $pref.bp.tsv $reference > breakpoint_list_tmp.tsv
cat $pref.bp.tsv breakpoint_list_tmp.tsv | sort -k 1,1 -k 2,2n | uniq > $pref.bp.merged.tsv
if [ ! -s $reference.fa.fai ]; then 
  rsync -avzP --ignore-existing rsync://hgdownload.cse.ucsc.edu/goldenPath/$reference/bigZips/$reference.fa.gz .
  gunzip $reference.fa.gz
  samtools faidx $reference.fa
fi
ruby vcf2gfa/gfa_generator.rb $pref.bp.merged.tsv $pref.output.pcf $reference.fa
