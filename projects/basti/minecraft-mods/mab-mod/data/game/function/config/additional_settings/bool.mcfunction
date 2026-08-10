execute as @e[type=interaction] run data remove entity @s attack
execute as @e[type=interaction] run data remove entity @s interaction 

$execute unless score $(type) config matches 1 run execute as @e[tag=$(type)_block] run data modify entity @e[limit=1,tag=$(type)_block] item.id set value green_concrete
$execute unless score $(type) config matches 1 run function game:config/additional_settings/$(type)_set_gamerule
$execute unless score $(type) config matches 1 run return run scoreboard players set $(type) config 1


$execute if score $(type) config matches 1 run execute as @e[tag=$(type)_block] run data modify entity @e[limit=1,tag=$(type)_block] item.id set value red_concrete
$execute if score $(type) config matches 1 run function game:config/additional_settings/$(type)_set_gamerule
$execute if score $(type) config matches 1 run return run scoreboard players set $(type) config 0




