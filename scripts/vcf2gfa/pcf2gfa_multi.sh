#!/bin/bash -eu

#cd $(dirname $0)

input=$1
input2=$2
reference=$3
pref=$input

cat <(sed '1d' $input)  <(sed '1d' $input2) | sort -t "," -k 7n > $pref.output.pcf
awk -F "[,:]" '{print $1,"\t",$2,"\n",$4,"\t",$5}' <(cat $pref.output.pcf) | sed -e 's/[ ]*//g' | sort -k 1,1 -k 2,2n | uniq > $pref.bp.tsv
ruby vcf2gfa/json_to_breakpoint_list.rb $pref.bp.tsv $reference > breakpoint_list_tmp.tsv
cat $pref.bp.tsv breakpoint_list_tmp.tsv | sort -k 1,1 -k 2,2n | uniq > $pref.bp.merged.tsv
if [ ! -s $reference.fa.fai ]; then 
  rsync -avzP --ignore-existing rsync://hgdownload.cse.ucsc.edu/goldenPath/$reference/bigZips/$reference.fa.gz .
  gunzip $reference.fa.gz
  samtools faidx $reference.fa
fi
cat $input | sort -t "," -k 7n > $1.pcf
cat $input2 | sort -t "," -k 7n > $2.pcf

ruby vcf2gfa/gfa_generator.rb $pref.bp.merged.tsv $1.pcf $reference.fa > $pref.1.gfa
ruby vcf2gfa/gfa_generator.rb $pref.bp.merged.tsv $2.pcf $reference.fa > $pref.2.gfa
ruby vcf2gfa/gfa_generator_multi.rb $pref.bp.merged.tsv $reference.fa $1.pcf $2.pcf
