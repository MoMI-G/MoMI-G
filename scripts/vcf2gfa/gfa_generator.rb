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
  ref_tail = {}
  csv.each do |row|
    ref_tail[row[0]] = row[1].to_i
  end
  ref_tail
end

ref_len = parse_faidx(REF)
REF_CHECK= ref_len.clone
REF_RANGE = Hash.new{|h,k| h[k]= [] }

def fasta(current_read, start, stop)
  seq = "#{current_read}:#{start}-#{stop}"
  raise "unexpected genomic range #{seq}" if !current_read || !start || !stop || stop <= 0
  REF_CHECK[current_read] -= (stop - start + 1)
  REF_RANGE[current_read] << start..stop
  fasta = `samtools faidx #{REF} #{seq}`
  fasta
end

left_hash = Hash.new{|h,k| h[k]= Hash.new }
right_hash = Hash.new{|h,k| h[k]= Hash.new }
read_hash = {}
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
    line_orig = line.clone
    raise "ERROR: Link is not found on '#{line_orig}'" if !(line[1]=~ /^[0-9]+$/)
    line[1] = line[1].to_i
    raise "ERROR: Reference id '#{line[0]}' is not found in #{REF}" if !ref_len[line[0]]
    if line[1]==0 && current_read != "" # When reads start from 0
      begin
        fasta = fasta(current_read, prev_pos, ref_len[current_read])
      rescue => exception
        raise "[ERROR] in '#{line_orig.join(" ")}' : #{exception}"
      end
      next if fasta == ""
      #seq = seq.gsub(":", "_")
      seq = unique_id
      unique_id += 1
      seg_names << seq
      puts "S\t#{seq}\t#{fasta.split("\n").drop(1).join("").upcase}"
      raise "ERROR: Link is not found on '#{line_orig}': #{prev_seq}, #{seq}" if prev_seq == "" || seq == ""
      puts "L\t#{prev_seq}\t+\t#{seq}\t+\t0M"
      puts "P\t#{current_read}\t#{seg_names.join("+,")}+\t*"#{seg_names.map{"*"}.join(",")}"
      raise "ERROR: input file is not sorted in chromosome '#{current_read}'" if read_hash[current_read]
      read_hash[current_read] = true

      seg_names = []
      left_hash[current_read][prev_pos] = seq
      right_hash[current_read][CHRMAX] = seq
  
      current_read = line[0]
      prev_seq = ""
      prev_pos = 0
      next
    end
    if current_read != "" && line[0] != current_read
      begin
        fasta = fasta(current_read, prev_pos, ref_len[current_read])
      rescue => exception
        raise "[ERROR] in '#{line_orig.join(" ")}' : #{exception}"
      end
      if fasta.split("\n").drop(1).join("").upcase != ""
        seq = unique_id
        unique_id += 1
        seg_names << seq
        puts "S\t#{seq}\t#{fasta.split("\n").drop(1).join("").upcase}"
        raise "ERROR: Link is not found on '#{line_orig}': #{prev_seq}, #{seq}" if prev_seq == "" || seq == ""
        puts "L\t#{prev_seq}\t+\t#{seq}\t+\t0M"
        left_hash[current_read][prev_pos] = seq
        right_hash[current_read][CHRMAX] = seq
      end
      puts "P\t#{current_read}\t#{seg_names.join("+,")}+\t*" if seg_names.length > 1 #{seg_names.map{"*"}.join(",")}"
      raise "ERROR: input file is not sorted in chromosome '#{current_read}'" if read_hash[current_read]
      read_hash[current_read] = true      
      seg_names = []

      if line[1] > 1
        begin
          fasta = fasta(line[0], 0, line[1]-1)
        rescue => exception
          raise "[ERROR] in '#{line_orig.join(" ")}' : #{exception}"
        end
      else
        current_read = ""
        prev_pos = 0
        prev_seq = ""
        next
      end
      seq = unique_id
      unique_id += 1
      puts "S\t#{seq}\t#{fasta.split("\n").drop(1).join("").upcase}" # Now N is not needed for 0-origin problem.
      left_hash[line[0]][0] = seq
      right_hash[line[0]][line[1]] = seq

    else
      next if line[1]-1 <= 0
      begin
        fasta = fasta(line[0], prev_pos, line[1]-1)
      rescue => exception
        raise "[ERROR] in '#{line_orig.join(" ")}' : #{exception}"
      end
      seq = unique_id
      unique_id += 1
      puts "S\t#{seq}\t#{fasta.split("\n").drop(1).join("").upcase}"
      raise "ERROR: Link is not found on '#{line_orig}': #{prev_seq}, #{seq}" if seq == ""
      puts "L\t#{prev_seq}\t+\t#{seq}\t+\t0M" if prev_seq != "" #|| prev_pos == 0
      left_hash[line[0]][prev_pos] = seq
      right_hash[line[0]][line[1]] = seq
    end
    current_read = line[0]
    prev_seq = seq
    prev_pos = line[1]
    seg_names << seq
  end
end

begin
  fasta = fasta(current_read, prev_pos, ref_len[current_read])
rescue => exception
  raise "[ERROR] in '#{line_orig.join(" ")}' : #{exception}"
end
seq = unique_id
unique_id += 1
puts "S\t#{seq}\t#{fasta.split("\n").drop(1).join("").upcase}"
raise "ERROR: Link is not found on '#{line_orig}': #{prev_seq}, #{seq}" if prev_seq == "" || seq == ""
puts "L\t#{prev_seq}\t+\t#{seq}\t+\t0M"
seg_names << seq
puts "P\t#{current_read}\t#{seg_names.join("+,")}+\t*"#{seg_names.map{"*"}.drop(1).join(",")}"
raise "ERROR: input file is not sorted in chromosome '#{current_read}'" if read_hash[current_read]
read_hash[current_read] = true
left_hash[current_read][prev_pos] = seq
right_hash[current_read][CHRMAX] = seq

REF_CHECK.to_a.each do |line|
  STDERR.puts("Potentially truncated chromosomes:")
  if read_hash[line[0]]&& line[1] > 0
    STDERR.puts(line.join(" "))
  end
end

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
      next unless line[8] # If insersion sequence is not explicitly 
      ins_segment = unique_id
      unique_id += 1
      fasta = line[8].upcase
      unless fasta =~ /^[ATGCN]+$/
        STDERR.puts "[INFO] VCF file does not include implicit insertion sequence."
        next
      end
      puts "S\t#{ins_segment}\t#{fasta}"
      puts "L\t#{left_segment}\t#{line[2]}\t#{ins_segment}\t+\t0M"
      puts "L\t#{ins_segment}\t+\t#{right_segment}\t#{line[5]}\t0M"
      puts "P\t#{"ins_" + path_name + "_" + line[9]}\t#{[left_segment.to_s+line[2],ins_segment.to_s+"+",right_segment.to_s+line[5]].join(",")}\t*"
    elsif line[7] == "INV"
      #next if line[1] >= line[4] 
      left_segment += 1 if line[2] == "-"
      right_segment -= 1 if line[5] == "-"
      puts "L\t#{left_segment}\t#{line[2]}\t#{right_segment}\t#{line[5]}\t0M"
      puts "P\tinv_#{path_name}\t#{[left_segment.to_s+line[2],right_segment.to_s+line[5]].join(",")}\t*" 
    elsif line[7] == "DEL"
      next if line[1] >= line[4] 
      puts "L\t#{left_segment}\t+\t#{right_segment}\t+\t0M"
      puts "P\tdel_#{path_name}\t#{[left_segment.to_s+"+",right_segment.to_s+"+"].join(",")}\t*" 
    elsif line[7] == "BND" || line[7] == "TRA"
      left_segment += 1 if line[2] == "-"
      right_segment -= 1 if line[5] == "-"
      puts "L\t#{left_segment}\t#{line[2]}\t#{right_segment}\t#{line[5]}\t0M"
      puts "P\ttra_#{path_name}\t#{[left_segment.to_s+line[2],right_segment.to_s+line[5]].join(",")}\t*" 
    elsif line[7] == "DUP"
      next if line[1] >= line[4] 
      path_name = line[0] + "_" + line[1].to_s + ".." + line[3] + "_" + line[4].to_s 
      puts "L\t#{right_segment-1}\t+\t#{left_segment+1}\t+\t0M"
      puts "P\tdup_#{path_name}\t#{[(right_segment-1).to_s+"+",(left_segment+1).to_s+"+"].join(",")}\t*" 
      #puts "L\t#{left_segment+1}\t-\t#{right_segment-1}\t-\t0M"
    elsif line[7] == "UNK"
      #IGNORE
    else
      #IGNORE
    end 
  end
end
