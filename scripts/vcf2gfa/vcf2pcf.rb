#!/bin/ruby
#
# For inter-chromosomal dataset.

INTMAX=1000*1000*1000
puts "source_id,source_breakpoint,source_strand,target_id,target_breakpoint,target_strand,priority,svtype,gt,allele,id"

STDIN.each do |line|
  next if line.start_with?("#")
  line = line.split("\t")
  #next if line[2].end_with?("_2")  # For 10X dataset
  info = line[7]
  info_hash = {}
  info.split(";").each{|t| a = t.split("=");info_hash[a[0]] = a[1]}
  if info_hash["SVMETHOD"].start_with("Sniffles")
    line[6] = info_hash["SVLEN"].to_i.abs
  elsif info_hash["SVMETHOD"].start_with("SURVIVOR")
    line[6] = info_hash["AVGLEN"].to_i.abs
  else
    line[6] = info_hash["SVLEN"].to_i.abs # It depends on an implementation.
  end
  line[7] = line[4][1..-2]

    line[3] = info_hash["CHR2"]
    line[4] = info_hash["END"]
    if info_hash["STRANDS"] == "++" 
      line[2] = "+"
      line[5] = "-"
    elsif info_hash["STRANDS"] == "--" 
      line[2] = "-"
      line[5] = "+"
    elsif info_hash["STRANDS"] == "-+" 
      line[2] = "-"
      line[5] = "-"
    elsif info_hash["STRANDS"] == "+-"
      line[2] = "+"
      line[5] = "+"
    end
  next if line[3] == "chrM" || line[0] == "chrM"
  path_name = line[0] + "_" + line[1].to_s + ".." + line[3] + "_" + line[4].to_s 
  line[9] = line[9].chomp
  line[10] = "#{line[7].downcase}_#{path_name}"

  puts line[0..10].join(",")  if line[0] != ""
end
