
function game:init/timer/pause

gamemode spectator @a
gamerule maxEntityCramming 1000
gamerule doMobSpawning false
gamerule doEntityDrops false
title @a subtitle {"text":"Configure the waves!"}
title @a title {"text":"Preperation Phase!"}

execute as @a run attribute @s entity_interaction_range base set 100
effect give @a minecraft:slow_falling infinite 100 true

tp @a[team=red] 1000 400 1000 180 0
tp @a[team=green] -1000 400 1000 180 0
tp @a[team=yellow] 1000 400 -1000 180 0
tp @a[team=blue] 0 400 0 180 0

execute positioned 0 400 0 run function game:init/preparation-phase {team:blue,Team:Blue}
execute positioned -1000 400 1000 run function game:init/preparation-phase {team:green,Team:Green}
execute positioned 1000 400 1000 run function game:init/preparation-phase {team:red,Team:Red}
execute positioned 1000 400 -1000 run function game:init/preparation-phase {team:yellow,Team:Yellow}
