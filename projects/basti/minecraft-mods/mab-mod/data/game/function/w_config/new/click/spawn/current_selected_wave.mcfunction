
$summon item_display ~ ~ ~ {Tags:["$(Team)_wave_itemdisplay"],item:{id:"minecraft:beacon",Count:1}}
$summon minecraft:interaction ~ ~-0.5 ~ {Tags:["$(Team)_wave_selector"]}

$function game:w_config/new/click/spawn/show_current_selected_wave {Team:$(Team),team:$(team)}
