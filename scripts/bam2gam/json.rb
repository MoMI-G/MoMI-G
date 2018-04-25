#!/bin/ruby
#
#
require "json"

previous_line = {}
previous_orient = ""

STDIN.each_line do |line|
  line = JSON.parse(line)
  current_id = line["name"]
    orient = current_id.match(/.*\_\d*:(\+|\-)/)[1]
    mapping = line["path"]["mapping"]
    #print orient
    if orient == "-"
      mapping = mapping.reverse.map do |item|
        item["position"]["is_reverse"] = true
        item
      end
    end
   #p mapping
  if previous_line != {} && previous_line["name"].match(/(.*)\_\d*/)[1] == current_id.match(/(.*)\_\d*/)[1]
    #previous_orient = orient
    previous_line["path"]["mapping"] = previous_line["path"]["mapping"].concat(mapping)
  else
    if previous_line != {}
      previous_line["name"] = previous_line["name"].match(/(.*)\_\d*/)[1]
      puts JSON.dump(previous_line)
    end
    line["path"]["mapping"] = mapping
    previous_line = line
    previous_orient = orient
  end
end

if previous_line != {}
    previous_line["name"] = previous_line["name"].match(/(.*)\_\d*/)[1]
    puts JSON.dump(previous_line)
end
