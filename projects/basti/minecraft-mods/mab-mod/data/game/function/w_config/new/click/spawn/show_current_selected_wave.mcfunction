$kill @e[distance=..1,tag=$(Team)_show_wave]
$summon text_display ~ ~0.6 ~ {background:1,Tags:["$(Team)_show_wave"],text:[{"bold":true,"text":"Click to change!"}]}
$summon text_display ~ ~ ~0.6 {Tags:["$(Team)_show_wave"],background:1,text:[{"bold":true,"text":"Wave: "},{"score":{"name":"$(Team)","objective":"wave_selection"}}]}
