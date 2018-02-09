exit if ARGV.size < 1
puts ["source_id", "source_breakpoint", "source_strand", "target_id","target_breakpoint", "target_strand"].join(',')
permit_list = [*1..22, "X", "Y"].map{|t| "chr"+t.to_s}
File.open(ARGV[0]) do |f|
f.each_line do |line|
  line = line.chomp.split("\t")
  line = line.map{|t| t =~ /^(-)?[0-9]+$/ ? t.to_i : t}
#  p line[2]
  next if !permit_list.include?(line[2]) || !permit_list.include?(line[6])
if line[1] == line[5]
  # ++, --  right_hash, left_hash
  #left_segment = right_hash[line[2]][line[4]]
  #right_segment = left_hash[line[6]][line[7]]
  #path_name = line[2]+":" + line[4].to_s + "&"+ line[6] + ":" + line[7].to_s

  list = [line[2], line[4], line[1], line[6], line[7], line[5]]
elsif line[1] == "-"
  # -+ left_hash, left_hash
  #left_segment = left_hash[line[2]][line[3]]
  #right_segment = left_hash[line[6]][line[7]]
  #path_name = line[2] + ":" + line[3].to_s + "&"+ line[6] + ":" + line[7].to_s
  list = [line[2], line[3], line[1], line[6], line[7], line[5]]
else
  # +- right_hash, right_hash
  #left_segment = right_hash[line[2]][line[4]]
  #right_segment = right_hash[line[6]][line[8]]
  #path_name = line[2] + ":" +line[4].to_s + "&"+ line[6] + ":" + line[8].to_s
  list = [line[2], line[4], line[1], line[6], line[8], line[5]]
end
  puts list.join(",")
end
end
