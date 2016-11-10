require 'csv'
require 'json'
require 'pry'
require 'optparse'

DATA_KEYS = %w[agency fund lob program_name account amount]
OKC_MAPPING = { 'agency' => 1,
                'fund' => 1,
                'lob' => 1,
                'program_name' => 1,
                'account' => 1,
                'amount' => 1 }

options = {}
OptionParser.new do |opts|
  options[:okc] = false
  options[:file] = ''

  opts.banner = "Usage: data_to_json.rb [options]"

  opts.on("-o", "--okc", "Run with OKC data mappings") do |okc_mapping|
    options[:okc] = true
  end

  opts.on("-f", "--file [file]", String, "CSV file to convert") do |file_name|
    options[:file] = file_name
  end

  opts.on( '-h', '--help', 'Display this screen' ) do
    puts opts
    puts ""
    exit
  end
end.parse!

if options[:file].empty?
  puts "Please supply the name of the csv file:"
  puts "Probably something like 'CODE for OKC FY16 Final.csv'"
  options[:file] = gets.strip
end

csv = CSV.read(options[:file], headers: true)
headers = csv.headers

mapping = {}

if options[:okc]
  mapping = OKC_MAPPING
else
  DATA_KEYS.each do |key|
    print "Please select the number corresponding to the #{key}:\n"
    headers.each_with_index { |header, index| puts "#{index}: #{header}"}

    mapping[key] = gets.to_i
  end
end

data = []
csv.each do |row|
  data << {
    agency: row[headers[mapping['agency']]],
    fund: row[headers[mapping['fund']]],
    lob: row[headers[mapping['lob']]],
    program: row[headers[mapping['program_name']]],
    key: row[headers[mapping['account']]],
    value: row[headers[mapping['amount']]]
  }
end

json_file_name = "#{options[:file].chomp('.csv')}.json"
file = File.new(json_file_name, 'w')

puts ""
puts "# Writing #{json_file_name}"
puts ""

file.write JSON.pretty_generate(data)
