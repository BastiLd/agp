$summon item_display ~ ~ ~ {Tags:["$(Team)_show_preview"],item:{id:"minecraft:sculk_shrieker",Count:1}}
$summon minecraft:interaction ~ ~-0.5 ~ {Tags:["$(Team)_show_preview"]}


$summon text_display ~ ~0.6 ~ {background:1,Tags:["$(Team)_show_preview"],text:[{"bold":true,"text":"Click to spawn Wave preview!"}]}