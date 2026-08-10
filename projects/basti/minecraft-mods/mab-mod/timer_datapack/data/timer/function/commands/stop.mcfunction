# Timer Stop Command
# Stops/pauses the timer

execute if score start timer_state matches 0 run tellraw @s [{"text":"Timer is not running!","color":"red"}]
execute if score start timer_state matches 0 run return 0

# Stop the timer
scoreboard players set start timer_state 0
tellraw @s [{"text":"Timer stopped!","color":"yellow"}]
title @a actionbar {"text":"Timer Paused!","color":"yellow","bold":true}
