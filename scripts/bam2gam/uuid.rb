#!/bin/ruby
#
#

previous_line = []
count = 0

STDIN.each_line do |line|
  line = line.split(" ")
  current_id = line[3]
  if previous_line.length > 3 && previous_line[3] == current_id
    previous_line[3] += "_#{count}:#{previous_line[5]}"
    count += 1
  else
    #count += 1
    previous_line[3] += "_#{count}:#{previous_line[5]}" if previous_line.length > 3
    count = 0
  end
  puts previous_line.join(" ")
  previous_line = line
end

previous_line[3] += "_#{count}:#{previous_line[5]}"
puts previous_line.join(" ")
