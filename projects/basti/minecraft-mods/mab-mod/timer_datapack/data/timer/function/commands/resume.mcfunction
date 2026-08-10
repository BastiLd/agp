# Timer Resume Command
# Resumes a paused timer

execute if score start timer_state matches 1 run tellraw @s [{"text":"Timer is already running!","color":"red"}]
execute if score start timer_state matches 1 run return 0

execute if score days timer matches 0 if score hours timer matches 0 if score minutes timer matches 0 if score seconds timer matches 0 run tellraw @s [{"text":"No timer to resume!","color":"red"}]
execute if score days timer matches 0 if score hours timer matches 0 if score minutes timer matches 0 if score seconds timer matches 0 run return 0

# Resume the timer
scoreboard players set start timer_state 1
tellraw @s [{"text":"Timer resumed!","color":"green"}]
function timer:tick
