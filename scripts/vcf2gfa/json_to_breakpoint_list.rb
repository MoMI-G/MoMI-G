#!/bin/ruby
#

require "json"

interval = 1*1000*1000
chrs = {}

File.foreach(ARGV[0]) do |line|
  chrs[line.split("\t")[0]] = 1
end

File.open("./GRCh.json") do |file|
  hash = JSON.load(file)

  chrs.to_a.each do |chr_name, id| 
    next if chr_name == "source_id" || chr_name == "target_id"
    chr = hash[ARGV[1]].find{|t| t["label"] == chr_name}
    [*1..chr["len"] / interval].each{|t|  puts [chr["id"], t * interval].join("\t") } if chr
  end
end
