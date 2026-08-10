$function game:preview/kill_preview {team:$(team)}
$execute unless score $(Team)$(wave)Total wave_selection matches 1.. run return fail 

$scoreboard players set $(Team)_all_mobs_spawned preview 0
$scoreboard players set $(Team)mob_x preview 0
$scoreboard players set $(Team)mob_z preview 0
scoreboard objectives remove preview 
scoreboard objectives add preview dummy


$function game:preview/kill_preview {team:$(team)}


$function game:preview/mobs_for_copy_score {Team:$(Team),team:$(team),wave:$(wave)}

$function game:preview/init_mobs_for_preview {mobs_per_row:13,Team:$(Team),team:$(team),wave:$(wave)}

