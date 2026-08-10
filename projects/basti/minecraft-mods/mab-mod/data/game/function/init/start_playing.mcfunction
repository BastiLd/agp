execute as @a at @a run playsound minecraft:entity.player.levelup master @s
title @a title "Game started!"
scoreboard players set game_config bool 0 

kill @e[tag=game_config]
function game:init/timer/start
tellraw @a ["\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n"]
