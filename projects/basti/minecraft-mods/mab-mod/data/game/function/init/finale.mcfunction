execute if entity @a[team=green] unless entity @e[tag=spawn_greens_enemies] run execute at @a run playsound minecraft:entity.villager.no
execute if entity @a[team=blue] unless entity @e[tag=spawn_blues_enemies] run execute at @a run playsound minecraft:entity.villager.no
execute if entity @a[team=red] unless entity @e[tag=spawn_reds_enemies] run execute at @a run playsound minecraft:entity.villager.no
execute if entity @a[team=yellow] unless entity @e[tag=spawn_yellows_enemies] run execute at @a run playsound minecraft:entity.villager.no





execute if entity @a[team=green] unless entity @e[tag=spawn_greens_enemies] run return run title @a title "Not all arenas are build"
execute if entity @a[team=blue] unless entity @e[tag=spawn_blues_enemies] run return run title @a title "Not all arenas are build"
execute if entity @a[team=red] unless entity @e[tag=spawn_reds_enemies] run return run title @a title "Not all arenas are build"
execute if entity @a[team=yellow] unless entity @e[tag=spawn_yellows_enemies] run return run title @a title "Not all arenas are build"






scoreboard players set start timer 1
scoreboard players set battle timer 1 
scoreboard players set battle_started config 1

execute as @a run attribute @s entity_interaction_range base reset
bossbar remove blue
bossbar remove red
bossbar remove green
bossbar remove yellow

gamemode survival @a


execute if score Arena wave_number matches 1 run tp @a[team=red] 141 264 93
execute if score Arena wave_number matches 1 run tp @a[team=blue] 141 164 93
execute if score Arena wave_number matches 1 run tp @a[team=green] 141 114 93
execute if score Arena wave_number matches 1 run tp @a[team=yellow] 141 214 93
execute if score Arena wave_number matches 1 run spawnpoint @a[team=red] 141 264 93
execute if score Arena wave_number matches 1 run spawnpoint @a[team=blue] 141 164 93
execute if score Arena wave_number matches 1 run spawnpoint @a[team=green] 141 114 93
execute if score Arena wave_number matches 1 run spawnpoint @a[team=yellow] 141 214 93


execute if score Arena wave_number matches 2 run tp @a[team=red] 63 271 70
execute if score Arena wave_number matches 2 run tp @a[team=blue] 63 171 70
execute if score Arena wave_number matches 2 run tp @a[team=green] 63 121 70
execute if score Arena wave_number matches 2 run tp @a[team=yellow] 63 221 70
execute if score Arena wave_number matches 2 run spawnpoint @a[team=red] 63 271 70
execute if score Arena wave_number matches 2 run spawnpoint @a[team=blue] 63 171 70
execute if score Arena wave_number matches 2 run spawnpoint @a[team=green] 63 121 70
execute if score Arena wave_number matches 2 run spawnpoint @a[team=yellow] 63 221 70

execute if score Arena wave_number matches 3 run tp @a[team=red] 94.999 257.00 118.5
execute if score Arena wave_number matches 3 run tp @a[team=blue] 94.999 157.00 118.5
execute if score Arena wave_number matches 3 run tp @a[team=green] 94.999 107.00 118.5
execute if score Arena wave_number matches 3 run tp @a[team=yellow] 94.999 207.00 118.5
execute if score Arena wave_number matches 3 run spawnpoint @a[team=red] 94 257 118
execute if score Arena wave_number matches 3 run spawnpoint @a[team=blue] 94 157 118
execute if score Arena wave_number matches 3 run spawnpoint @a[team=green] 94 107 118
execute if score Arena wave_number matches 3 run spawnpoint @a[team=yellow] 94 207 118



execute if score neutral_mobs_angry_at_player config matches 1 run gamerule forgiveDeadPlayers false

tellraw @a ["\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n"]
gamerule doTileDrops false
gamerule mobGriefing false
gamerule doMobLoot false
gamerule doMobSpawning false

effect clear @a minecraft:slow_falling

execute at @a run playsound minecraft:entity.player.levelup

scoreboard players set battle_started wave_number 1

scoreboard players set BlueTeam_yellows_waves wave_number 1
scoreboard players set RedTeam_yellows_waves wave_number 1
scoreboard players set GreenTeam_yellows_waves wave_number 1
scoreboard players set YellowTeam_reds_waves wave_number 1
title @a title "Battle started!"
title @a subtitle "Wave 1"
scoreboard players set display_RedTeam wave_number 1
scoreboard players set display_BlueTeam wave_number 1
scoreboard players set display_GreenTeam wave_number 1
scoreboard players set display_YellowTeam wave_number 1
give @a clock[custom_name=[{"text":"Mob Radar","italic":false,"color":"light_purple","bold":true}],lore=[[{"text":"Shows particles towards the nearest mob. ","italic":false}]],rarity=epic,enchantment_glint_override=true]