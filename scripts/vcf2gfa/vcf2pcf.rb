#!/bin/ruby
#
# For inter-chromosomal dataset.

INTMAX=1000*1000*1000
MODE_10X=false
puts "source_id,source_breakpoint,source_strand,target_id,target_breakpoint,target_strand,priority,svtype,gt,allele,id"

STDIN.each do |line|
  if line.start_with?("#")
    MODE_10X = true if line.start_with?("##source=10X")
    next
  end
  line = line.split("\t")
  next if line[2].end_with?("_2") if MODE_10X # For 10X dataset
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
  if MODE_10X
    line[7] = info_hash["SVTYPE2"] ? info_hash["SVTYPE2"] : info_hash["SVTYPE"]
    line[7] = line[7] === "BND" ? "TRA" : line[7]
  else
    line[7] = line[4][1..-2]
  end

  if MODE_10X
    if match = line[4].match(/(.?)([\[\]])(chr.*)\:(\d*)([\[\]])(.?)/)
      line[3] = match[3]
      line[4] = match[4]
      if match[1] != "" && match[2] == "]"
        line[2] = "+"
        line[5] = "-"
      elsif match[1] == "" && match[2] == "["
        line[2] = "-"
        line[5] = "+"
      elsif match[1] != "" && match[2] == "["
        line[2] = "+"
        line[5] = "+"
      else
        line[2] = "-"
        line[5] = "-"
      end
      line[5] = line[5] == "-" ? "+" : "-" ###DANGER: It works ONLY 10X large_svs.vcf
    else
      line[3] = line[0]
      line[4] = info_hash["END"]
      #if line[7] == "DUP"
      #  line[2] = "-"
      #  line[5] = "+"
      #else
        line[2] = "+"
        line[5] = "+"
      #end
    end
  else
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
  end
  next if line[3] == "chrM" || line[0] == "chrM"
  path_name = line[0] + "_" + line[1].to_s + ".." + line[3] + "_" + line[4].to_s 
  line[9] = line[9].chomp
  line[10] = "#{line[7].downcase}_#{path_name}"

  puts line[0..10].join(",")  if line[0] != ""
end
