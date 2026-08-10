$data remove storage $(team)mob_order $(mob)

$execute store result score $(Team)TeamWave$(wave)_preview $(mob) run scoreboard players get $(Team)TeamWave$(wave) $(mob)
