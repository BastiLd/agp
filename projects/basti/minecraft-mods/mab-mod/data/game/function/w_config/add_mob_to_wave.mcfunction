

$scoreboard players set $(Team)TeamUsed $(mob) 0 
$scoreboard players operation $(Team)TeamUsed $(mob) += $(Team)TeamWave1 $(mob)
$scoreboard players operation $(Team)TeamUsed $(mob) += $(Team)TeamWave2 $(mob)
$scoreboard players operation $(Team)TeamUsed $(mob) += $(Team)TeamWave3 $(mob)

#wenn noch welche übrig, dann
$execute if score $(Team)TeamUsed $(mob) < $(Team)TeamTotal $(mob) run scoreboard players add $(Team)$(wave)Total wave_selection 1
$execute if score $(Team)TeamUsed $(mob) < $(Team)TeamTotal $(mob) run scoreboard players add $(Team)TeamWave$(wave) $(mob) 1
$execute if score $(Team)TeamUsed $(mob) < $(Team)TeamTotal $(mob) run function game:w_config/make_wave_for_opponent {Team:$(Team),mob:$(mob),wave:$(wave)}




$scoreboard players set $(Team)TeamUsed $(mob) 0 
$scoreboard players operation $(Team)TeamUsed $(mob) += $(Team)TeamWave1 $(mob)
$scoreboard players operation $(Team)TeamUsed $(mob) += $(Team)TeamWave2 $(mob)
$scoreboard players operation $(Team)TeamUsed $(mob) += $(Team)TeamWave3 $(mob)



#---------------------------------------------------------------------------------------------------------------------------------
#Examples
#
#Example Commad: /function game:w_config/add_wave_mob {mob:"armadillo",wave:"3",Team:"Red"}
# /function game:w_config/add_wave_mob {mob:"mobname",qave:"wavenumber",Team:"Team"}