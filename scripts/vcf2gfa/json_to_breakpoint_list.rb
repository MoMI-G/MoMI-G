#!/bin/ruby
#

require "json"

interval = 1*1000*1000
chrs = {}
hash = {}

File.foreach(ARGV[0]) do |line|
  chrs[line.split("\t")[0]] = 1
end

File.foreach(ARGV[1] + ".fai") do |line|
  line = line.chomp.split
  hash[line[0]] = line[1].to_i
end

#File.open(__dir__ + "/GRCh.json") do |file|
#  hash = JSON.load(file)
#
  chrs.to_a.each do |chr_name, id| 
    next if chr_name == "source_id" || chr_name == "target_id"
    chr_len = hash[chr_name] #hash[ARGV[1]].find{|t| t["label"] == chr_name}
    [*1..chr_len / interval].each{|t|  puts [chr_name, t * interval].join("\t") } if chr_len
  end
#end
