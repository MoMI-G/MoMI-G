#!/bin/bash -eu

#cd $(dirname $0)

input=$1
reference=$2
pref=$input

sort -t"," -k 7n $input > $pref.output.pcf
awk -F "[,:]" '{print $1,"\t",$2,"\n",$4,"\t",$5}' <(sed '1d' $input) | sed -e 's/[ ]*//g' | sort -k 1,1 -k 2,2n | uniq > $pref.bp.tsv
if [ ! -s $reference.fai ]; then
  if [ ! -s $reference ]; then
    if [ ! -s $reference.fa ]; then 
      rsync -avPq --ignore-existing rsync://hgdownload.cse.ucsc.edu/goldenPath/$reference/bigZips/$reference.fa.gz .
      gunzip -c $reference.fa.gz > $reference.fa
    fi
    samtools faidx $reference.fa
    reference=$reference.fa
  else
    samtools faidx $reference
  fi
fi
ruby `dirname $0`/json_to_breakpoint_list.rb $pref.bp.tsv $reference > breakpoint_list_tmp.tsv
cat $pref.bp.tsv breakpoint_list_tmp.tsv | sort -k 1,1 -k 2,2n | uniq > $pref.bp.merged.tsv
awk '{print $1 "\t" $2 "\t" $2}' $pref.bp.merged.tsv > $pref.bp.merged.bed
awk '{print $1 "\t0\t" $2}' $reference.fai > $pref.reference.tsv
bedtools intersect -a $pref.bp.merged.bed -b $pref.reference.tsv | cut -f 1,2 > $pref.bp.merged.filtered.tsv
ruby `dirname $0`/gfa_generator.rb $pref.bp.merged.filtered.tsv $pref.output.pcf $reference
