execute as @e[type=interaction] run data remove entity @s attack
execute as @e[type=interaction] run data remove entity @s interaction

scoreboard players set player_with_team_count teams 0
scoreboard players set player_count teams 0

execute as @a run scoreboard players add player_count teams 1

execute as @a[team=green] run scoreboard players add player_with_team_count teams 1
execute as @a[team=red] run scoreboard players add player_with_team_count teams 1
execute as @a[team=yellow] run scoreboard players add player_with_team_count teams 1
execute as @a[team=blue] run scoreboard players add player_with_team_count teams 1



execute if score player_with_team_count teams = player_count teams run return run function game:init/start_playing

execute as @a at @a run playsound minecraft:block.beacon.deactivate master @s
title @a title "Not every player is on a team!"