
$execute unless score $(Team)mob_order_index preview = $(Team)_$(mob) preview run return fail

$execute if score $(Team)mob_order_index preview = $(Team)mob_order preview if score $(Team)TeamWave$(wave)_preview $(mob) matches 0 run scoreboard players set $(Team)_all_mobs_spawned preview 1
$execute unless score $(Team)TeamWave$(wave)_preview $(mob) matches 1.. run return run scoreboard players add $(Team)mob_order_index preview 1






#+1 mobx
$scoreboard players add $(Team)mob_x preview 1 



$execute store result storage $(team)_storage_preview mob_x double 0.4 run scoreboard players get $(Team)mob_x preview 
$execute store result storage $(team)_storage_preview mob_z double 0.4 run scoreboard players get $(Team)mob_z preview
$data modify storage $(team)_storage_preview mob set value $(mob)
$data modify storage $(team)_storage_preview team set value $(team)
$data modify storage $(team)_storage_preview Team set value $(Team)

$function game:preview/special_mobs/spawn_shulker with storage $(team)_storage_preview

#wenn mobx größer als mobx auf 0, +1 mobz
$execute if score $(Team)mob_x preview matches $(mobs_per_row).. run scoreboard players add $(Team)mob_z preview 1 
$execute if score $(Team)mob_x preview matches $(mobs_per_row).. run scoreboard players set $(Team)mob_x preview 0 

$scoreboard players remove $(Team)TeamWave$(wave)_preview $(mob) 1




