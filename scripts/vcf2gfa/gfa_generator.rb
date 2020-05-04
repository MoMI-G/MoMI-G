#!/bin/ruby
# ruby gfa_generator_with_svlink.rb all_list_new_ins_bplist.csv all_list_new_clustered.tsv reference.fa > sv_test_with_svlink.gfa
#

require 'csv'

exit if ARGV.size < 3

CHRMAX=270000000
#SPLIT=40 * 1000 * 1000
REF=ARGV[2]

def parse_faidx(ref)
  ref_file = ref + ".fai"
  csv = CSV.read(ref_file, col_sep: "\t", headers: false)
  ref_len = {}
  csv.each do |row|
    ref_len[row[0]] = row[1].to_i
  end
  ref_len
end

ref_len = parse_faidx(REF)

left_hash = Hash.new{|h,k| h[k]= Hash.new }
right_hash = Hash.new{|h,k| h[k]= Hash.new }
puts "H\tVN:Z:1.0"

current_read = ""
prev_pos = 0
prev_seq = ""
seg_names = []
unique_id = 1

File.open(ARGV[0]) do |f|
f.each_line do |line|
  line = line.chomp.split(" ")
  next if line[0].end_with?("id")
  line[1] = line[1].to_i
  if line[1]==0 # When reads start from 0
    seq = "#{current_read}:#{prev_pos}-#{ref_len[current_read]}"
    fasta = `samtools faidx #{REF} #{seq}`
    next if fasta == ""
    #seq = seq.gsub(":", "_")
    seq = unique_id
    unique_id += 1
    seg_names << seq
    puts "S\t#{seq}\t#{fasta.split("\n").drop(1).join("").upcase}"
    puts "L\t#{prev_seq}\t+\t#{seq}\t+\t0M"
    puts "P\t#{current_read}\t#{seg_names.join("+,")}+"#\t#{seg_names.map{"*"}.join(",")}"
    seg_names = []
    left_hash[current_read][prev_pos] = seq
    right_hash[current_read][CHRMAX] = seq
 
    current_read = line[0]
    prev_seq = ""
    prev_pos = 0
    next
  end
  if current_read != "" && line[0] != current_read
  seq = "#{current_read}:#{prev_pos}-#{ref_len[current_read]}"
  fasta = `samtools faidx #{REF} #{seq}`
  #seq = seq.gsub(":", "_")
  seq = unique_id
  unique_id += 1
  seg_names << seq
  puts "S\t#{seq}\t#{fasta.split("\n").drop(1).join("").upcase}"
  puts "L\t#{prev_seq}\t+\t#{seq}\t+\t0M"
  puts "P\t#{current_read}\t#{seg_names.join("+,")}+"#\t#{seg_names.map{"*"}.join(",")}" if seg_names.length > 1
  seg_names = []
  left_hash[current_read][prev_pos] = seq
  right_hash[current_read][CHRMAX] = seq


  seq = "#{line[0]}:0-#{line[1]-1}"
  fasta = `samtools faidx #{REF} #{seq}`
    seq = unique_id
    unique_id += 1
  puts "S\t#{seq}\tN#{fasta.split("\n").drop(1).join("").upcase}" # added N for 0-origin problem.
  left_hash[line[0]][0] = seq
  right_hash[line[0]][line[1]] = seq
  else
  seq = "#{line[0]}:#{prev_pos}-#{line[1]-1}"
  fasta = `samtools faidx #{REF} #{seq}`
    seq = unique_id
    unique_id += 1
  puts "S\t#{seq}\t#{fasta.split("\n").drop(1).join("").upcase}"
  puts "L\t#{prev_seq}\t+\t#{seq}\t+\t0M" if prev_seq!="" #|| prev_pos == 0
  left_hash[line[0]][prev_pos] = seq
  right_hash[line[0]][line[1]] = seq
  end
  current_read = line[0]
  prev_seq = seq
  prev_pos = line[1]
  seg_names << seq
end
end

seq = "#{current_read}:#{prev_pos}-#{ref_len[current_read]}"
fasta = `samtools faidx #{REF} #{seq}`
  seq = unique_id
  unique_id += 1
puts "S\t#{seq}\t#{fasta.split("\n").drop(1).join("").upcase}"
puts "L\t#{prev_seq}\t+\t#{seq}\t+\t0M"
  seg_names << seq
puts "P\t#{current_read}\t#{seg_names.join("+,")}+"#\t#{seg_names.map{"*"}.drop.join(",")}"
left_hash[current_read][prev_pos] = seq
right_hash[current_read][CHRMAX] = seq

File.open(ARGV[1]) do |f|
  f.each_line do |line|
    line = line.chomp.split(",")
    line = line.map{|t| t =~ /^(-)?[0-9]+$/ ? t.to_i : t}
    next if line[0] == "source_id"
    left_segment = right_hash[line[0]][line[1]]
    right_segment = left_hash[line[3]][line[4]]
    path_name = line[0].to_s+"_" + line[1].to_s + ".."+ line[3].to_s + "_" + line[4].to_s 
    next if not left_segment or not right_segment
    if line[7] == "INS"
      next unless line[8]
      ins_segment = unique_id
      unique_id += 1
      fasta = line[8] 
      puts "S\t#{ins_segment}\t#{fasta.upcase}"
      puts "L\t#{left_segment}\t#{line[2]}\t#{ins_segment}\t+\t0M"
      puts "L\t#{ins_segment}\t+\t#{right_segment}\t#{line[5]}\t0M"
      puts "P\t#{"ins_" + path_name + "_" + line[9]}\t#{[left_segment.to_s+line[2],ins_segment.to_s+"+",right_segment.to_s+line[5]].join(",")}"
    elsif line[7] == "INV"
      #next if line[1] >= line[4] 
      left_segment += 1 if line[2] == "-"
      right_segment -= 1 if line[5] == "-"
      puts "L\t#{left_segment}\t#{line[2]}\t#{right_segment}\t#{line[5]}\t0M"
      puts "P\tinv_#{path_name}\t#{[left_segment.to_s+line[2],right_segment.to_s+line[5]].join(",")}" 
    elsif line[7] == "DEL"
      next if line[1] >= line[4] 
      puts "L\t#{left_segment}\t+\t#{right_segment}\t+\t0M"
      puts "P\tdel_#{path_name}\t#{[left_segment.to_s+"+",right_segment.to_s+"+"].join(",")}" 
    elsif line[7] == "BND" || line[7] == "TRA"
      left_segment += 1 if line[2] == "-"
      right_segment -= 1 if line[5] == "-"
      puts "L\t#{left_segment}\t#{line[2]}\t#{right_segment}\t#{line[5]}\t0M"
      puts "P\ttra_#{path_name}\t#{[left_segment.to_s+line[2],right_segment.to_s+line[5]].join(",")}" 
    elsif line[7] == "DUP"
      next if line[1] >= line[4] 
      path_name = line[0] + "_" + line[1].to_s + ".." + line[3] + "_" + line[4].to_s 
      puts "L\t#{right_segment-1}\t+\t#{left_segment+1}\t+\t0M"
      puts "P\tdup_#{path_name}\t#{[(right_segment-1).to_s+"+",(left_segment+1).to_s+"+"].join(",")}" 
      #puts "L\t#{left_segment+1}\t-\t#{right_segment-1}\t-\t0M"
    elsif line[7] == "UNK"
      #IGNORE
    else
      #IGNORE
    end 
  end
end
