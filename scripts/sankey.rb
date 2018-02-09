require "nokogiri"
require 'graphviz'
require 'json'
require 'pry'

json_file_path= ARGV[0]

json_data = open(json_file_path) do |io|
  JSON.load(io)
end

json_hash = {}
json_hash[:links] = []
json_hash[:nodes] = []

node_hash = {}
path_hash = Hash.new{|k,v| k[v] = []}
=begin
json_data['path'].each do |path|
  path['mapping'].map{|t| t['position']['node_id'] }.each do |id|
    path_hash[id] = path['name']
  end
end
=end
json_data['path'].each do |path|
  path['mapping'].each do |t|
    path_hash[t['position']['node_id']] = [path['name'], t['rank']]
  end
end


json_data['node'].each_with_index do |t,i|
  node_hash[t['id']] = i
  json_hash[:nodes] << {name: t['id'].to_s, length: Math.log2(t['sequence'].length)/10}
end

json_data['edge'].each do |edge|
  if edge['from'] != edge['to']
    value = (path_hash[edge['from']][0] == path_hash[edge['to']][0]) && ((path_hash[edge['from']][1] - path_hash[edge['to']][1]).abs == 1) ? 8 : 1
    path = (path_hash[edge['from']][0] == path_hash[edge['to']][0]) && ((path_hash[edge['from']][1] - path_hash[edge['to']][1]).abs == 1) ? path_hash[edge['from']][0] : ""
    json_hash[:links] << {source: node_hash[edge['from']], target: node_hash[edge['to']], value: value, path: path }
  end
end

json_data['path'].each do |path|
end

puts JSON.dump(json_hash)
