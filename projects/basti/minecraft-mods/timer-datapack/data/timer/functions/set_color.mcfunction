# Set color function
execute if score #timer_color timer matches 0 run scoreboard players set #timer_color timer 1
execute if score #timer_color timer matches 1 run scoreboard players set #timer_color timer 2
execute if score #timer_color timer matches 2 run scoreboard players set #timer_color timer 3
execute if score #timer_color timer matches 3 run scoreboard players set #timer_color timer 0 