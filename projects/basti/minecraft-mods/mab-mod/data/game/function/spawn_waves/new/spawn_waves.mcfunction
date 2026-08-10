$team modify $(team)s_enemies color $(team)

$execute unless score $(Team)Team_$(opponent)s_waves wave_number matches 1.. run scoreboard players set $(Team)Team_$(opponent)s_waves wave_number 1
$execute if score display_$(Team)Team wave_number matches 1.. run function game:init/display_wave {Team:$(Team),team:$(team),opponent:$(opponent),Opponent:$(Opponent)}



$execute if score $(Team)Team_$(opponent)s_waves wave_number matches 1 run function game:spawn_waves/new/mobs_for_spawn_enemies {Team:$(Team),team:$(team),wave:1,Opponent:$(Opponent),opponent:$(opponent)}
$execute if score $(Team)Team_$(opponent)s_waves wave_number matches 2 run function game:spawn_waves/new/mobs_for_spawn_enemies {Team:$(Team),team:$(team),wave:2,Opponent:$(Opponent),opponent:$(opponent)}
$execute if score $(Team)Team_$(opponent)s_waves wave_number matches 3 run function game:spawn_waves/new/mobs_for_spawn_enemies {Team:$(Team),team:$(team),wave:3,Opponent:$(Opponent),opponent:$(opponent)}


$execute if score $(opponent) teams matches 1 if score $(Team)Team_$(opponent)s_waves wave_number matches 3 unless entity @e[tag=w3_$(opponent)s_mobs_for_$(team)] run tellraw @a[team=$(team)] [{"bold":true,"text":"You have defeated all waves of team "},{"bold":true,"color":"$(opponent)","text":"$(opponent)"},{"bold":true,"text":"!"}]
$execute if score $(Team)Team_$(opponent)s_waves wave_number matches 3 unless entity @e[tag=w3_$(opponent)s_mobs_for_$(team)] run scoreboard players set $(Team)Team_$(opponent)s_waves wave_number 100


$execute if score $(opponent) teams matches 1 if score $(Team)Team_$(opponent)s_waves wave_number matches 2 unless entity @e[tag=w2_$(opponent)s_mobs_for_$(team)] run title @a[team=$(team)] title {color:$(opponent),text:"Wave 3"}
$execute if score $(Team)Team_$(opponent)s_waves wave_number matches 2 unless entity @e[tag=w2_$(opponent)s_mobs_for_$(team)] run scoreboard players set $(Team)Team_$(opponent)s_waves wave_number 3

$execute if score $(opponent) teams matches 1 if score $(Team)Team_$(opponent)s_waves wave_number matches 1 unless entity @e[tag=w1_$(opponent)s_mobs_for_$(team)] run title @a[team=$(team)] title {color:$(opponent),text:"Wave 2"}
$execute if score $(Team)Team_$(opponent)s_waves wave_number matches 1 unless entity @e[tag=w1_$(opponent)s_mobs_for_$(team)] run scoreboard players set $(Team)Team_$(opponent)s_waves wave_number 2




$execute if score $(Team)Team_$(opponent)s_waves wave_number matches 1 run scoreboard players set display_$(Team)Team wave_number 1
$execute if score $(Team)Team_$(opponent)s_waves wave_number matches 2 run scoreboard players set display_$(Team)Team wave_number 2
$execute if score $(Team)Team_$(opponent)s_waves wave_number matches 3 run scoreboard players set display_$(Team)Team wave_number 3

