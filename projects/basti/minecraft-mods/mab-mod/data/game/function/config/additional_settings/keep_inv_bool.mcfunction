execute as @e[type=interaction] run data remove entity @s attack
execute as @e[type=interaction] run data remove entity @s interaction


$execute if score $(obj) config matches 0 run execute as @e[tag=$(obj)_block] run data modify entity @e[limit=1,tag=$(obj)_block] item.id set value green_concrete
$execute if score $(obj) config matches 0 run function game:config/additional_settings/set_gamerule
$execute if score $(obj) config matches 0 run return run scoreboard players set $(obj) config 1


$execute if score $(obj) config matches 1 run execute as @e[tag=$(obj)_block] run data modify entity @e[limit=1,tag=$(obj)_block] item.id set value red_concrete
$execute if score $(obj) config matches 1 run function game:config/additional_settings/set_gamerule
$execute if score $(obj) config matches 1 run return run scoreboard players set $(obj) config 0

