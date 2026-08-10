$scoreboard players set marker_y arena $(offset) 

scoreboard players operation marker_y arena += y arena
execute store result storage arena marker_y int 1 run scoreboard players get marker_y arena
$data modify storage arena marker_z set value $(z)
$data modify storage arena marker_x set value $(x)
$data modify storage arena tag set value $(tag)
function game:arena/marker/spawn with storage arena