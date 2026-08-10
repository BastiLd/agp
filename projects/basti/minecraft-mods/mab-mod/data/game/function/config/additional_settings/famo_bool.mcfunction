execute as @e[type=interaction] run data remove entity @s attack
execute as @e[type=interaction] run data remove entity @s interaction
execute if score f_a_o_m config matches 0 run execute as @e[tag=famo_block] run data modify entity @e[limit=1,tag=famo_block] item.id set value green_concrete
execute if score f_a_o_m config matches 0 run return run scoreboard players set f_a_o_m config 1


execute if score f_a_o_m config matches 1 run execute as @e[tag=famo_block] run data modify entity @e[limit=1,tag=famo_block] item.id set value red_concrete
execute if score f_a_o_m config matches 1 run return run scoreboard players set f_a_o_m config 0