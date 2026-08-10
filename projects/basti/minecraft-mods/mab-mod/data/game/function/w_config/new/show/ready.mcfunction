$kill @e[tag=$(Team)_ready_dinge]
$summon text_display ~ ~-1.55 ~0.26 {background:1,Tags:["$(Team)_ready_dinge"],text:[{"bold":true,"text":"Ready"}],transformation:{left_rotation:[0f,0f,0f,1f],right_rotation:[0f,0f,0f,1f],translation:[0f,0f,0f],scale:[0.5f,0.5f,0.5f]}}
$summon minecraft:interaction ~ ~-1.55 ~ {Tags:["$(Team)_ready","$(Team)_ready_dinge"],width:0.5f,height:0.5f}
$execute unless score $(team)_ready wave_number matches 1 run return run summon minecraft:item_display ~ ~-1.3 ~ {Tags:["$(Team)_ready_block","$(Team)_ready_dinge"],item:{id:"minecraft:red_concrete",Count:1},transformation:{left_rotation:[0f,0f,0f,1f],right_rotation:[0f,0f,0f,1f],translation:[0f,0f,0f],scale:[0.5f,0.52f,0.5f]}}
$summon minecraft:item_display ~ ~-1.3 ~ {Tags:["$(Team)_ready_block","$(Team)_ready_dinge"],item:{id:"minecraft:green_concrete",Count:1},transformation:{left_rotation:[0f,0f,0f,1f],right_rotation:[0f,0f,0f,1f],translation:[0f,0f,0f],scale:[0.5f,0.52f,0.5f]}}

