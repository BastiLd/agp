
$execute if score $(Team)TeamWave$(wave) $(mob) matches 1.. run scoreboard players add $(Team)mob_order preview 1

$execute if score $(Team)TeamWave$(wave) $(mob) matches 1.. run execute store result storage $(team)mob_order index double 1 run scoreboard players get $(Team)mob_order preview
$execute if score $(Team)TeamWave$(wave) $(mob) matches 1.. run data modify storage $(team)mob_order mob set value $(mob)
$execute if score $(Team)TeamWave$(wave) $(mob) matches 1.. run data modify storage $(team)mob_order team set value $(team)
$execute if score $(Team)TeamWave$(wave) $(mob) matches 1.. run data modify storage $(team)mob_order Team set value $(Team)

$execute if score $(Team)TeamWave$(wave) $(mob) matches 1.. run function game:preview/add_mob_to_order with storage $(team)mob_order





