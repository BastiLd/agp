kill @e[tag=Timer]
scoreboard players set game_config bool 1
fill ~2 ~2 ~ ~-2 ~ ~-6 air


summon minecraft:interaction ~ ~1 ~-3.25 {Tags:["game_config","clock","Timer"]}
execute at @e[type=interaction,tag=clock] positioned ~ ~ ~ run function game:config/timer/time_display
summon minecraft:item_display ~ ~1.5 ~-3 {Tags:["game_config","Timer"],item:{id:"minecraft:clock",Count:1}}

summon text_display ~ ~0.75 ~-3 {Tags:["game_config","Timer","start_things"],text:[{"bold":true,"text":"Click to start"}]}
summon minecraft:interaction ~ ~ ~-3.25 {Tags:["game_config","start","Timer","start_things"]}
summon minecraft:item_display ~ ~0.5 ~-3 {Tags:["game_config","Timer","start_things"],item:{id:"minecraft:end_crystal",Count:1}}
execute as @e[tag=start_things] run data modify entity @s transformation.scale set value [0.5f,0.5f,0.5f]