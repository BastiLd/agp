# Set color function
scoreboard players add #timer_color timer 1
execute if score #timer_color timer matches 6 run scoreboard players set #timer_color timer 0

execute if score #timer_color timer matches 0 run tellraw @a [{"text":"Timer color set to ","color":"gold"},{"text":"Gold/Yellow","color":"yellow","bold":true}]
execute if score #timer_color timer matches 1 run tellraw @a [{"text":"Timer color set to ","color":"aqua"},{"text":"Aqua/Light Purple","color":"light_purple","bold":true}]
execute if score #timer_color timer matches 2 run tellraw @a [{"text":"Timer color set to ","color":"green"},{"text":"Green/Lime","color":"lime","bold":true}]
execute if score #timer_color timer matches 3 run tellraw @a [{"text":"Timer color set to ","color":"red"},{"text":"Red/Dark Red","color":"dark_red","bold":true}]
execute if score #timer_color timer matches 4 run tellraw @a [{"text":"Timer color set to ","color":"blue"},{"text":"Blue/Purple","color":"dark_purple","bold":true}]
execute if score #timer_color timer matches 5 run tellraw @a [{"text":"Timer color set to ","color":"light_blue"},{"text":"Light Blue/Cyan","color":"cyan","bold":true}] 