# Display timer with different colors and format

# Prepare JSON components based on time values
# Color 0: Gold/Yellow
execute if score #timer_color timer matches 0 run function timer:display_format_gold
# Color 1: Aqua/Light Purple
execute if score #timer_color timer matches 1 run function timer:display_format_aqua
# Color 2: Green/Lime
execute if score #timer_color timer matches 2 run function timer:display_format_green
# Color 3: Red/Dark Red
execute if score #timer_color timer matches 3 run function timer:display_format_red
# Color 4: Blue/Dark Purple
execute if score #timer_color timer matches 4 run function timer:display_format_blue
# Color 5: Light Blue/Cyan
execute if score #timer_color timer matches 5 run function timer:display_format_lightblue 