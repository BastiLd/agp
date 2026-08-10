# Timer Color Command
# Sets the color of the timer display
# Usage: /timer color [color]

# Get color from storage
execute store result storage timer:temp new_color string 1 run scoreboard players get color timer_color

# Set the color
scoreboard players set color timer_color $(new_color)

# Clear storage
data remove storage timer:temp new_color

# Display confirmation
tellraw @s [{"text":"Timer color set to ","color":"green"},{"text":"$(new_color)","color":"$(new_color)","bold":true}]
