# /timer resume command
# This function is called when /timer resume is executed

# Check if timer is already running
execute if score start timer_state matches 1 run tellraw @s [{"text":"Timer is already running!","color":"red"}]
execute if score start timer_state matches 1 run return 0

# Check if timer exists
execute if score days timer matches 0 if score hours timer matches 0 if score minutes timer matches 0 if score seconds timer matches 0 run tellraw @s [{"text":"No timer to resume!","color":"red"}]
execute if score days timer matches 0 if score hours timer matches 0 if score minutes timer matches 0 if score seconds timer matches 0 run return 0

# Resume the timer
scoreboard players set start timer_state 1
tellraw @s [{"text":"Timer resumed!","color":"green"}]
function timer:tick
