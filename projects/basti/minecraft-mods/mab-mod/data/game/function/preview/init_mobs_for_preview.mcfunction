
$execute if score $(Team)_all_mobs_spawned preview matches 1 run return fail

$function game:preview/mobs_for_preview {mobs_per_row:$(mobs_per_row),Team:$(Team),team:$(team),wave:$(wave)}
$function game:preview/init_mobs_for_preview {mobs_per_row:$(mobs_per_row),Team:$(Team),team:$(team),wave:$(wave)}
