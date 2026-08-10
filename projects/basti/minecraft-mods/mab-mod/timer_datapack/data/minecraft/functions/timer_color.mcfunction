# /timer color command
# This function is called when /timer color [color] is executed
# Usage: /timer color red

# Get color from storage (in a real implementation, this would parse the command argument)
execute store result storage timer:temp new_color string 1 run scoreboard players get color timer_color

# Set the color
scoreboard players set color timer_color $(new_color)

# Clear storage
data remove storage timer:temp new_color

# Display confirmation
tellraw @s [{"text":"Timer color set to ","color":"green"},{"text":"$(new_color)","color":"$(new_color)","bold":true}]

# Show available colors
tellraw @s [{"text":"Available colors:","color":"yellow"}]
tellraw @s [{"text":"dark_green, green, blue, light_blue, red, yellow, orange, purple, pink, white, gray, dark_gray, black","color":"gray"}]
