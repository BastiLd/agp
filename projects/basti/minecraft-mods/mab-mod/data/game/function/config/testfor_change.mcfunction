execute as @e[type=minecraft:interaction,nbt={interaction:{}},tag=start] run return run function game:init/init_start_playing
execute as @e[type=minecraft:interaction,nbt={attack:{}},tag=start] run return run function game:init/init_start_playing




execute as @e[type=minecraft:interaction,nbt={interaction:{}}] at @s run function game:config/right
execute as @e[type=minecraft:interaction,nbt={attack:{}}] at @s run function game:config/left




