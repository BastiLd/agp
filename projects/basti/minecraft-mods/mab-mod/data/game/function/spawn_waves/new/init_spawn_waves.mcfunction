$execute unless score $(Team)Team_$(op1)s_waves wave_number matches 1.. run scoreboard players set $(Team)Team_$(op1)s_waves wave_number 1






$execute if score $(Team)Team_$(op1)s_waves wave_number matches ..99 run function game:spawn_waves/new/spawn_waves {Team:$(Team),team:$(team),opponent:$(op1),Opponent:$(Op1)}
$execute if score $(Team)Team_$(op1)s_waves wave_number matches 100 run function game:spawn_waves/new/spawn_waves {Team:$(Team),team:$(team),opponent:$(op2),Opponent:$(Op2)}
$execute if score $(Team)Team_$(op2)s_waves wave_number matches 100 run function game:spawn_waves/new/spawn_waves {Team:$(Team),team:$(team),opponent:$(op3),Opponent:$(Op3)}
$execute if score f_a_o_m config matches 1 if score $(Team)Team_$(op3)s_waves wave_number matches 100 run function game:spawn_waves/new/spawn_waves {Team:$(Team),team:$(team),opponent:$(team),Opponent:$(Team)}

$execute if score f_a_o_m config matches 0 if score $(Team)Team_$(op3)s_waves wave_number matches 100 run scoreboard players set display_$(Team)Team wave_number 100
$execute if score f_a_o_m config matches 0 if score $(Team)Team_$(op3)s_waves wave_number matches 100 as @a[team=$(team)] at @s run playsound ui.toast.challenge_complete 
$execute if score f_a_o_m config matches 0 if score $(Team)Team_$(op3)s_waves wave_number matches 100 run tellraw @a[team=$(team)] [{"bold":true,"text":"\n\n\n\n\n\n\n\n\nYou have defeated all waves!!!"}]
$execute if score f_a_o_m config matches 0 if score $(Team)Team_$(op3)s_waves wave_number matches 100 run gamemode creative @a[team=$(team)]
$execute if score f_a_o_m config matches 0 if score $(Team)Team_$(op3)s_waves wave_number matches 100 run scoreboard players add $(Team)Team_$(op3)s_waves wave_number 1





$execute if score f_a_o_m config matches 1 if score $(Team)Team_$(team)s_waves wave_number matches 100 run scoreboard players set display_$(Team)Team wave_number 100
$execute if score f_a_o_m config matches 1 if score $(Team)Team_$(team)s_waves wave_number matches 100 as @a[team=$(team)] at @s run playsound ui.toast.challenge_complete 
$execute if score f_a_o_m config matches 1 if score $(Team)Team_$(team)s_waves wave_number matches 100 run tellraw @a[team=$(team)] [{"bold":true,"text":"\n\n\n\n\n\n\n\n\nYou have defeated all waves!!!"}]
$execute if score f_a_o_m config matches 1 if score $(Team)Team_$(team)s_waves wave_number matches 100 run gamemode creative @a[team=$(team)]
$execute if score f_a_o_m config matches 1 if score $(Team)Team_$(team)s_waves wave_number matches 100 run scoreboard players add $(Team)Team_$(team)s_waves wave_number 1

