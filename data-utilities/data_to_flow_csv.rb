require 'csv'
require 'pp'
require 'facets/string/titlecase'

expense_file = '../_src/data/fy2017/c4okc_fy2017.csv'
revenue_file = '../_src/data/fy2017/c4okc_fy2017Revenue.csv'
flow_output = '../_src/data/flow/FY17__adopted.csv'

#----------------------------------
# Rollup the expense data
#----------------------------------

expense_csv = CSV.read(expense_file, headers: true)
expense_rollup = {}
expense_csv.each do |row|

  fund_code = row[0].to_i
  fund_name = "General Fund"
  if fund_code != 1
    fund_code = 2
    fund_name = "Non-discretionary funds"
  end

  agency_code = row[4]
  agency_name = row[5]

  rollup_key = "#{fund_code}:#{agency_code}"
  rollup_value = row[-1].gsub(',','')

  if expense_rollup[rollup_key].nil?
    expense_rollup[rollup_key] = {
      fund_name: fund_name,
      fund_code: fund_code,
      agency_name: agency_name,
      agency_code: agency_code,
      value: 0
    }
  end
  expense_rollup[rollup_key][:value] += rollup_value.to_f
end


#----------------------------------
# Rollup the revenue data
#----------------------------------

revenue_rollup = {}
revenue_csv = CSV.read(revenue_file, headers: true)
revenue_csv.each do |row|
  fund_code = row[1].to_i
  fund_name = "General Fund"
  if fund_code != 1
    fund_code = 2
    fund_name = "Non-discretionary funds"
  end

  category_code = row[3].downcase.titlecase.gsub('"','')
  category_name = row[3].downcase.titlecase.gsub('"','')

  rollup_key = "#{fund_code}:#{category_code}"
  rollup_value = row[-1].gsub(',','')

  if revenue_rollup[rollup_key].nil?
    revenue_rollup[rollup_key] = {
      fund_name: fund_name,
      fund_code: fund_code,
      category_name: category_name,
      category_code: category_code,
      value: 0
    }
  end
  revenue_rollup[rollup_key][:value] += rollup_value.to_f
end

#------------------------------
#Write out the combined CSV
#------------------------------

column_names = ['account_category', 'account_type', 'amount', 'budget_year', 'department', 'fund_code']
CSV.open(flow_output, 'w') do |csv|
  csv << column_names
  revenue_rollup.each_pair do |key, data|
    csv << [data[:category_name],'Revenue',data[:value], 'FY17', nil, data[:fund_code]]
  end
  expense_rollup.each_pair do |key, data|
    csv << [nil,'Expense',data[:value], 'FY17', data[:agency_name], data[:fund_code]]
  end
end

puts "Wrote new file to : #{flow_output}"
