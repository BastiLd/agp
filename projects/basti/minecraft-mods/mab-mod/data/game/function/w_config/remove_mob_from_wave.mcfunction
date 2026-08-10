$scoreboard players set $(Team)TeamUsed $(mob) 0 
$scoreboard players set zero $(mob) 0 
#wenn größer 0 
$execute if score $(Team)TeamWave$(wave) $(mob) > zero $(mob) run scoreboard players remove $(Team)$(wave)Total wave_selection 1
$execute if score $(Team)TeamWave$(wave) $(mob) > zero $(mob) run scoreboard players remove $(Team)TeamWave$(wave) $(mob) 1

$execute if score $(Team)TeamWave$(wave) $(mob) > zero $(mob) run function game:w_config/make_wave_for_opponent {Team:$(Team),mob:$(mob),wave:$(wave)}




$execute if score $(Team)TeamUsed $(mob) <= $(Team)TeamTotal $(mob) run scoreboard players set $(Team)TeamUsed $(mob) 0 
$scoreboard players operation $(Team)TeamUsed $(mob) += $(Team)TeamWave1 $(mob)
$scoreboard players operation $(Team)TeamUsed $(mob) += $(Team)TeamWave2 $(mob)
$scoreboard players operation $(Team)TeamUsed $(mob) += $(Team)TeamWave3 $(mob)


#---------------------------------------------------------------------------------------------------------------------------------
#Examples
#
#Example Commad: /function game:w_config/remove_wave_mob {mob:"armadillo",wave:"3",team:"Red"}
# /function game:w_config/remove_wave_mob {mob:"mobname",qave:"wavenumber",team:"team"}