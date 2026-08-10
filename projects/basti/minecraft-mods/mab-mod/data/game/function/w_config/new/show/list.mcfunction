
$execute unless score $(Team)TeamTotal $(mob) matches 1.. run return fail
$scoreboard players add $(Team)_mobx wave_config 1

$scoreboard players set $(Team)_interactiony wave_config 10

$scoreboard players operation $(Team)_interactiony wave_config *= $(Team)_moby wave_config
$scoreboard players operation $(Team)_interactiony wave_config -= 5 config 


$execute store result storage $(team)wave_config mobx double 0.6 run scoreboard players get $(Team)_mobx wave_config 
$execute store result storage $(team)wave_config moby double 1 run scoreboard players get $(Team)_moby wave_config
$execute store result storage $(team)wave_config interactiony double 0.1 run scoreboard players get $(Team)_interactiony wave_config
$data modify storage $(team)wave_config mob set value $(mob)
$data modify storage $(team)wave_config Team set value $(Team)
$data modify storage $(team)wave_config team set value $(team)
$function game:w_config/new/click/spawn/egg with storage $(team)wave_config 

$execute if score $(Team)_mobx wave_config matches 13.. run scoreboard players add $(Team)_moby wave_config 1
$execute if score $(Team)_mobx wave_config matches 13.. run scoreboard players set $(Team)_mobx wave_config 0
