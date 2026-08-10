




$scoreboard players set $(Team)_new_config bool 1

$function game:w_config/new/wave_selector/next_wave {Team:$(Team),team:$(team)}
scoreboard players set start timer -1
$kill @e[tag=$(Team)_wave_selector]
$kill @e[tag=$(Team)_wave_itemdisplay]
$kill @e[tag=$(Team)_show_wave]
$kill @e[tag=$(Team)_show_preview]
$kill @e[tag=$(Team)_ready_dinge]
$gamemode survival @a[team=$(team)]

$execute positioned ~ ~ ~-5 run function game:w_config/new/show/ready {team:$(team),Team:$(Team)}


$execute positioned ~-4 ~ ~-5 run function game:w_config/new/show/mobs_for_list {team:$(team),Team:$(Team)}
$execute positioned ~-3 ~-2 ~-5 run function game:w_config/new/click/spawn/current_selected_wave {team:$(team),Team:$(Team)}
$execute positioned ~3.5 ~-2 ~-5 run function game:w_config/new/click/spawn/show_preview {team:$(team),Team:$(Team)}
$execute as @a[team=$(team)] run attribute @s minecraft:gravity base set 0


$scoreboard players set $(Team)_new_config bool 1

attribute @s minecraft:entity_interaction_range base set 111

$tellraw @a[team=$(team)] "\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n"
$tellraw @a[team=$(team)] "Leftclick an egg to add mob to wave"
$tellraw @a[team=$(team)] "Rightclick an egg to remove mob from wave"
$tellraw @a[team=$(team)] "Sneak-click an egg to add/remove 5 mobs from wave"
$tellraw @a[team=$(team)] "Rightclick shrieker to disable preview"


