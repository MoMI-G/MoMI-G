#!/bin/bash -eu

#cd $(dirname $0)

input=$3
input2=$4
input3=$5
reference=$1
pref=$2

cat <(sed '1d' $input) <(sed '1d' $input2) <(sed '1d' $input3) | sort -t "," -k 7n > $pref.output.pcf
awk -F "[,:]" '{print $1,"\t",$2,"\n",$4,"\t",$5}' <(cat $pref.output.pcf) | sed -e 's/[ ]*//g' | sort -k 1,1 -k 2,2n | uniq > $pref.bp.tsv

if [ ! -s $reference.fai ] && [ ! -s $reference.fa.fai ]; then 
  if [ ! -s $reference ]; then
    rsync -avPq --ignore-existing rsync://hgdownload.cse.ucsc.edu/goldenPath/$reference/bigZips/$reference.fa.gz .
    gunzip -c $reference.fa.gz > $reference.fa
    samtools faidx $reference.fa
  else
    samtools faidx $reference
  fi
fi

ruby vcf2gfa/json_to_breakpoint_list.rb $pref.bp.tsv $reference.fa > breakpoint_list_tmp.tsv
cat $pref.bp.tsv breakpoint_list_tmp.tsv | sort -k 1,1 -k 2,2n | uniq > $pref.bp.merged.tsv
cat $input | sort -t "," -k 7n > $input.pcf
cat $input2 | sort -t "," -k 7n > $input2.pcf
cat $input3 | sort -t "," -k 7n > $input3.pcf

ruby vcf2gfa/gfa_generator.rb $pref.bp.merged.tsv $input1.pcf $reference.fa > $pref.1.gfa &
ruby vcf2gfa/gfa_generator.rb $pref.bp.merged.tsv $input2.pcf $reference.fa > $pref.2.gfa &
ruby vcf2gfa/gfa_generator.rb $pref.bp.merged.tsv $input3.pcf $reference.fa > $pref.3.gfa &
wait
ruby vcf2gfa/gfa_generator_multi.rb $pref.bp.merged.tsv $reference.fa $input.pcf $input2.pcf $input3.pcf
