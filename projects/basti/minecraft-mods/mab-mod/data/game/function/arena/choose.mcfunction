title @a subtitle "Choose the arena!"
execute as @a run attribute @s minecraft:gravity base reset
execute as @a run attribute @s minecraft:entity_interaction_range base reset
gamemode spectator @a
gamerule doMobSpawning false
tp @a 85 200 120


kill @e[type=!player,type=!marker]
kill @e[type=!player,type=!marker]
kill @e[type=!player,type=!marker]
kill @e[type=!player,type=!marker]
kill @e[type=!player,type=!marker]
tellraw @a ["\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n"]

#execute if score f_a_o_m config matches 1 run tellraw @a {"bold":true,"click_event":{"action":"run_command","command":"/function game:spawn_waves/enable-disable_faom"},"color":"dark_aqua","hover_event":{"action":"show_text","value":[{"text":"Start"}]},"text":"Fight against own mobs[X]"}

scoreboard players set red teams 0
scoreboard players set green teams 0
scoreboard players set blue teams 0
scoreboard players set yellow teams 0

execute as @a[team=red] run scoreboard players set red teams 1
execute as @a[team=green] run scoreboard players set green teams 1
execute as @a[team=yellow] run scoreboard players set yellow teams 1
execute as @a[team=blue] run scoreboard players set blue teams 1

tellraw @a {"click_event":{"action":"run_command","command":"/function game:arena/ancient_city/init"},"text":"[Ancient city]"}
tellraw @a ["  "]
tellraw @a {"click_event":{"action":"run_command","command":"/function game:arena/village_plains/init"},"text":"[Village]"}
tellraw @a ["  "]
tellraw @a {"click_event":{"action":"run_command","command":"/function game:arena/japan/init"},"text":"[Japanese]"}