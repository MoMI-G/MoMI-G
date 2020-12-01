#!/bin/ruby
#
# For inter-chromosomal dataset.

mode_10x=false
puts "source_id,source_breakpoint,source_strand,target_id,target_breakpoint,target_strand,priority,svtype,gt,allele,id"
INTRA=ARGV[0]

STDIN.each do |line|
  if line.start_with?("#")
    mode_10x = true if line.start_with?("##source=10X")
    next
  end
  orig = line
  line = line.split("\t")
  next if line[2].end_with?("_2") if mode_10x # For 10X dataset
  info = line[7]
  info_hash = {}
  info.split(";").each{|t| a = t.split("=");info_hash[a[0]] = a[1]}
  if mode_10x
    line[6] = info_hash["PAIRS"].to_i.abs 
  elsif not info_hash["SVMETHOD"]
    line[6] = info_hash["SVLEN"].to_i.abs
  elsif info_hash["SVMETHOD"].start_with?("Sniffles")
    line[6] = info_hash["SVLEN"].to_i.abs
  elsif info_hash["SVMETHOD"].start_with?("SURVIVOR")
    line[6] = info_hash["AVGLEN"].to_i.abs
  else
    line[6] = info_hash["SVLEN"].to_i.abs # It depends on an implementation.
  end
  if mode_10x
    line[7] = info_hash["SVTYPE2"] ? info_hash["SVTYPE2"] : info_hash["SVTYPE"]
    line[7] = line[7] === "BND" ? "TRA" : line[7]
  else
    line[7] = line[4][1..-2]
  end

  if mode_10x
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
    if info_hash["CHR2"] && info_hash["END"]
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
    else
      line[3] = line[0]
      line[4] = line[4]
      line[2] = "+"
      line[5] = "-"
    end
    if info_hash["SVMETHOD"] && info_hash["SVMETHOD"].start_with?("SURVIVOR")
      line[0] = "chr" + line[0]
      line[3] = "chr" + info_hash["CHR2"]
    end
  end
  next if line[3] == "chrM" || line[0] == "chrM"
  begin
    path_name = line[0] + "_" + line[1].to_s + ".." + line[3] + "_" + line[4].to_s 
  rescue => e
    raise "Error line: " + orig
  end
  line[9] = line[9].chomp if line[9]
  line[10] = "#{line[7].downcase}_#{path_name}"
  next if line[0] == line[3] && INTRA
  raise "Unsupported format: #{orig}" if line[1] == "" || line[4] == ""
  raise "Unsupported format: #{orig}, #{line[0..10].join(",")}" if !(line[1] =~ /^[0-9]+$/ && line[4] =~ /^[0-9]+$/ )
  
  puts line[0..10].join(",")  if line[0] != ""
end
