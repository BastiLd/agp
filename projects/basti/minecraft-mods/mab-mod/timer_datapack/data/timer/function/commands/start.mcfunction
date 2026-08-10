# /timer start command handler
# This function handles the /timer start command

# Check if timer is already running
execute if score start timer_state matches 1 run tellraw @s [{"text":"Timer is already running!","color":"red"}]
execute if score start timer_state matches 1 run return 0

# Check if timer is set
execute if score days timer matches 0 if score hours timer matches 0 if score minutes timer matches 0 if score seconds timer matches 0 run tellraw @s [{"text":"Please set a timer first using /timer set!","color":"red"}]
execute if score days timer matches 0 if score hours timer matches 0 if score minutes timer matches 0 if score seconds timer matches 0 run return 0

# Start the timer
scoreboard players set start timer_state 1
tellraw @s [{"text":"Timer started!","color":"green"}]
function timer:tick
