$function game:preview/kill_preview {team:$(team)}
$scoreboard players add $(Team) wave_selection 1
$execute if score $(Team) wave_selection matches 4.. run scoreboard players set $(Team) wave_selection 1
$execute store result storage $(team)_wave_selection wave int 1 run scoreboard players get $(Team) wave_selection

kill @n[tag=show_wave,distance=..1]
kill @n[tag=show_wave,distance=..1]
$execute at @s positioned ~ ~0.5 ~ run function game:w_config/new/click/spawn/show_current_selected_wave {Team:$(Team),team:$(team)}



$execute at @s positioned ~-1 ~2.5 ~ run function game:w_config/new/show/mobs_for_list with storage $(team)_wave_selection