$execute positioned ~$(mobx) ~$(interactiony) ~ run kill @e[tag=$(mob),distance=..30]


$summon minecraft:interaction ~$(mobx) ~$(interactiony) ~ {Tags:["$(mob)"],width:0.5f,height:0.8f}


$summon item_display ~$(mobx) ~$(moby) ~ {Tags:["$(Team)_mob_egg"],item:{id:"minecraft:$(mob)_spawn_egg",Count:1},transformation:[0.5000f,0.0000f,0.0000f,0.0000f,0.0000f,0.5000f,0.0000f,0.0000f,0.0000f,0.0000f,1.0000f,0.0000f,0.0000f,0.0000f,0.0000f,1.0000f]}

$execute store result storage $(team)wave_config wave int 1 run scoreboard players get $(Team) wave_selection

$function game:w_config/new/click/spawn/show_mob_count_in_wave with storage $(team)wave_config
$function game:init/mobs_scoreboards {mob:$(mob),Team:$(Team)}