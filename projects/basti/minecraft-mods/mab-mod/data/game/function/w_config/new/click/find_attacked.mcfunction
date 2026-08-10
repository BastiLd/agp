scoreboard players set found_attacker bool 0
execute on attacker store result score found_attacker bool if entity @s[tag=yyyy_attacker]
execute unless score found_attacker bool matches 1 run return fail


$execute as @s[tag=$(Team)_ready] run function game:w_config/team_ready {team:$(team),Team:$(Team)}
$execute as @s[tag=$(Team)_ready] at @s run return run execute positioned ~ ~1.55 ~ run function game:w_config/new/show/ready {team:$(team),Team:$(Team)}


$execute as @s run function game:w_config/new/click/mob_egg/save_data {type:attacker,Team:$(Team),team:$(team)}


$execute as @s[tag=$(Team)_show_preview] at @s positioned ~-6 ~ ~ run function game:preview/show_preview with storage $(team)_wave_selection
$execute as @s[tag=$(Team)_show_preview] run function game:w_config/new/click/data_remove
$execute as @s[tag=$(Team)_show_preview] run return fail


$execute as @s[tag=$(Team)_wave_selector,type=interaction] run function game:w_config/new/wave_selector/next_wave with storage $(team)_wave_selection
$execute as @s[tag=$(Team)_wave_selector,type=interaction] run function game:w_config/new/click/data_remove
$execute as @s[tag=$(Team)_wave_selector,type=interaction] run return fail

$execute as @s[tag=$(Team)_wave_selector,type=interaction] run function game:w_config/new/wave_selector/next_wave with storage $(team)_wave_selection
$execute as @s[tag=$(Team)_wave_selector,type=interaction] run function game:w_config/new/click/data_remove
$execute as @s[tag=$(Team)_wave_selector,type=interaction] run return fail



$execute as @s run function game:w_config/add_mob_to_wave with storage $(team)_wave_selection
$execute on attacker if predicate game:is_sneaking run function game:w_config/add_mob_to_wave with storage $(team)_wave_selection
$execute on attacker if predicate game:is_sneaking run function game:w_config/add_mob_to_wave with storage $(team)_wave_selection
$execute on attacker if predicate game:is_sneaking run function game:w_config/add_mob_to_wave with storage $(team)_wave_selection
$execute on attacker if predicate game:is_sneaking run function game:w_config/add_mob_to_wave with storage $(team)_wave_selection

$execute as @s at @s run function game:w_config/new/show/update_smciw with storage $(team)_wave_selection



function game:w_config/new/click/data_remove




data remove entity @s interaction
data remove entity @s attack
data remove storage attacked team 
data remove storage attacked Team 


