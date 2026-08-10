#update show mob count in wave

$kill @n[tag=$(mob),tag=show_mob_count_in_wave]
$summon text_display ~ ~ ~0.05 {background:1,Tags:[$(Team)_mob_egg,"show_mob_count_in_wave","$(Team)",$(mob)],text:[{"bold":true,"text":""},{"score":{"name":"$(Team)TeamWave$(wave)","objective":"$(mob)"}}]}


$data modify storage $(team)_wave_actionbar mob set value $(mob)
$data modify storage $(team)_wave_actionbar team set value $(team)
$data modify storage $(team)_wave_actionbar Team set value $(Team)
$execute store result storage $(team)_wave_actionbar TeamTotal int 1 run scoreboard players get $(Team)TeamTotal $(mob)
$execute store result storage $(team)_wave_actionbar TeamUsed int 1 run scoreboard players get $(Team)TeamUsed $(mob)

$function game:w_config/new/show/actionbar_mobcount_wave with storage $(team)_wave_actionbar
$function game:w_config/new/show/bossbar_mobcount_wave with storage $(team)_wave_actionbar