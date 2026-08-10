






$execute if score $(team)_ready wave_number matches 1 run title @a title {color:$(team),text:"$(Team) not ready!"}
$execute if score $(team)_ready wave_number matches 1 run return run scoreboard players set $(team)_ready wave_number 0




execute unless entity @a[team=red] run scoreboard players set red_ready wave_number 1
execute unless entity @a[team=blue] run scoreboard players set blue_ready wave_number 1
execute unless entity @a[team=green] run scoreboard players set green_ready wave_number 1
execute unless entity @a[team=yellow] run scoreboard players set yellow_ready wave_number 1

$execute unless score $(team)_ready wave_number matches 1 run title @a title {color:$(team),text:"$(Team) ready!"}

$scoreboard players set $(team)_ready wave_number 1 


execute if score green_ready wave_number matches 1 if score yellow_ready wave_number matches 1 if score blue_ready wave_number matches 1 if score red_ready wave_number matches 1 run function game:arena/choose

