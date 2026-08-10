# Display Timer Function
# Shows timer in actionbar with proper formatting

# Get current color
execute store result storage timer:temp color string 1 run scoreboard players get color timer_color

# Display with days
execute if score days timer matches 1.. run title @a actionbar [{"text":"","color":"$(color)"},{"score":{"name":"days","objective":"timer"},"color":"$(color)","bold":true},{"text":"d ","color":"$(color)"},{"score":{"name":"hours","objective":"timer"},"color":"$(color)","bold":true},{"text":":","color":"$(color)"},{"score":{"name":"minutes","objective":"timer"},"color":"$(color)","bold":true},{"text":":","color":"$(color)"},{"score":{"name":"seconds","objective":"timer"},"color":"$(color)","bold":true}]

# Display without days
execute if score days timer matches 0 if score hours timer matches 1.. run title @a actionbar [{"text":"","color":"$(color)"},{"score":{"name":"hours","objective":"timer"},"color":"$(color)","bold":true},{"text":":","color":"$(color)"},{"score":{"name":"minutes","objective":"timer"},"color":"$(color)","bold":true},{"text":":","color":"$(color)"},{"score":{"name":"seconds","objective":"timer"},"color":"$(color)","bold":true}]

# Display minutes and seconds only
execute if score days timer matches 0 if score hours timer matches 0 if score minutes timer matches 1.. run title @a actionbar [{"text":"","color":"$(color)"},{"score":{"name":"minutes","objective":"timer"},"color":"$(color)","bold":true},{"text":":","color":"$(color)"},{"score":{"name":"seconds","objective":"timer"},"color":"$(color)","bold":true}]

# Display seconds only
execute if score days timer matches 0 if score hours timer matches 0 if score minutes timer matches 0 if score seconds timer matches 1.. run title @a actionbar [{"text":"","color":"$(color)"},{"score":{"name":"seconds","objective":"timer"},"color":"$(color)","bold":true}]
