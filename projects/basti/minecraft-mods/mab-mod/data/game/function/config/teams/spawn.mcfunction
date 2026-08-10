kill @e[tag=teams_selection]
scoreboard players set game_config bool 1
fill ~5 ~2 ~ ~-5 ~ ~-6 air



summon text_display ~1.3 ~ ~-2.75 {Tags:["game_config","Timer","start_things"],text:[{"bold":true,"text":"Teams"}]}
summon minecraft:interaction ~1 ~1.05 ~-3 {Tags:["game_config","teams_selection","green"],width:0.5f,height:0.5f}
summon minecraft:item_display ~1 ~1.3 ~-3 {Tags:["game_config","teams_selection"],item:{id:"minecraft:green_concrete",Count:1},transformation:{left_rotation:[0f,0f,0f,1f],right_rotation:[0f,0f,0f,1f],translation:[0f,0f,0f],scale:[0.5f,0.5f,0.5f]}}

summon minecraft:interaction ~1 ~0.45 ~-3 {Tags:["game_config","teams_selection","yellow"],width:0.5f,height:0.5f}
summon minecraft:item_display ~1 ~0.7 ~-3 {Tags:["game_config","teams_selection"],item:{id:"minecraft:yellow_concrete",Count:1},transformation:{left_rotation:[0f,0f,0f,1f],right_rotation:[0f,0f,0f,1f],translation:[0f,0f,0f],scale:[0.5f,0.5f,0.5f]}}

summon minecraft:interaction ~1.6 ~1.05 ~-3 {Tags:["game_config","teams_selection","blue"],width:0.5f,height:0.5f}
summon minecraft:item_display ~1.6 ~1.3 ~-3 {Tags:["game_config","teams_selection"],item:{id:"minecraft:blue_concrete",Count:1},transformation:{left_rotation:[0f,0f,0f,1f],right_rotation:[0f,0f,0f,1f],translation:[0f,0f,0f],scale:[0.5f,0.5f,0.5f]}}

summon minecraft:interaction ~1.6 ~0.45 ~-3 {Tags:["game_config","teams_selection","red"],width:0.5f,height:0.5f}
summon minecraft:item_display ~1.6 ~0.7 ~-3 {Tags:["game_config","teams_selection"],item:{id:"minecraft:red_concrete",Count:1},transformation:{left_rotation:[0f,0f,0f,1f],right_rotation:[0f,0f,0f,1f],translation:[0f,0f,0f],scale:[0.5f,0.5f,0.5f]}}

