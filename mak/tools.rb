
# mak/tools.rb

module Tools
class << self

  def slash_slash_text(path)

    File.readlines(path).each { |l| puts "// #{l}".strip }
  end

  def slash_star_text(path)

    lines = File.readlines(path).drop_while { |l| l.strip == '' }
    lines.pop while lines[-1].strip == ''

    puts '/*'
    lines.each { |l| puts ' ' + "* #{l}".strip }
    puts ' */'
  end
end
end

path = ARGV[0]
variant = ARGV[1]

if variant.match?(/star/)
  Tools.slash_star_text(path)
else
  Tools.slash_slash_text(path)
end

