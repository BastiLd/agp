data remove storage player @s 

team leave @s
$team join $(team) @s
tag @s remove blue
tag @s remove red
tag @s remove Blue
tag @s remove Red
tag @s remove green
tag @s remove yellow
tag @s remove Green
tag @s remove Yellow
$tag @s add $(team)
$tag @s add $(Team)
$scoreboard players set $(Team) wave_selection 0



$tellraw @a [{"selector":"@s"},{"text":" joined the "},{"text":"$(team) team","color":"$(team)"},{"text":"!"}]
execute as @e[type=interaction] run data remove entity @s attack

execute as @e[type=interaction] run data remove entity @s interaction