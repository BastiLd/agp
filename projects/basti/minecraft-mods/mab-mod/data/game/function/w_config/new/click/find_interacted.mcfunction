scoreboard players set found_interacted bool 0
execute on target store result score found_interacted bool if entity @s[tag=yyyy_interacted]
execute unless score found_interacted bool matches 1 run return fail


$execute as @s run function game:w_config/new/click/mob_egg/save_data {type:target,Team:$(Team),team:$(team)}



$execute as @s[tag=$(Team)_wave_selector,type=interaction] run function game:w_config/new/wave_selector/previous_wave with storage $(team)_wave_selection
$execute as @s[tag=$(Team)_wave_selector,type=interaction] run function game:w_config/new/click/data_remove
$execute as @s[tag=$(Team)_wave_selector,type=interaction] run return fail



$execute as @s run function game:w_config/remove_mob_from_wave with storage $(team)_wave_selection
$execute on target if predicate game:is_sneaking run function game:w_config/remove_mob_from_wave with storage $(team)_wave_selection
$execute on target if predicate game:is_sneaking run function game:w_config/remove_mob_from_wave with storage $(team)_wave_selection
$execute on target if predicate game:is_sneaking run function game:w_config/remove_mob_from_wave with storage $(team)_wave_selection
$execute on target if predicate game:is_sneaking run function game:w_config/remove_mob_from_wave with storage $(team)_wave_selection
$execute as @s at @s run function game:w_config/new/show/update_smciw with storage $(team)_wave_selection

$execute as @s[tag=$(Team)_show_preview] run function game:preview/kill_preview {team:$(team)}


data remove entity @s attack
data remove entity @s interaction 
data remove storage interacted team
data remove storage interacted Team 
scoreboard players set found_interacted bool 0
