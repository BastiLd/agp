scoreboard players set @s died 0

execute unless score battle_started config matches 1 run return fail





title @s title {color:dark_red,text:"You died!"}
title @s subtitle {color:dark_red,text:"You are weak for 8s!"}

effect give @s blindness 1 1
effect give @s slowness 8 1
effect give @s minecraft:resistance 4 4 true
effect give @s minecraft:weakness 8 255
effect give @a night_vision infinite 1 true 



