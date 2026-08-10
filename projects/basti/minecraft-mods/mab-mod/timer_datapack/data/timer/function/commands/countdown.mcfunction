# Timer Countdown Command
# Sets a timer and starts it immediately
# Usage: /timer countdown [days] [hours] [minutes] [seconds]

# Stop timer if running
execute if score start timer_state matches 1 run scoreboard players set start timer_state 0

# Parse arguments from storage
execute store result score days timer run data get storage timer:args days 1
execute store result score hours timer run data get storage timer:args hours 1
execute store result score minutes timer run data get storage timer:args minutes 1
execute store result score seconds timer run data get storage timer:args seconds 1

# Validate input
execute if score days timer matches ..-1 run scoreboard players set days timer 0
execute if score hours timer matches ..-1 run scoreboard players set hours timer 0
execute if score minutes timer matches ..-1 run scoreboard players set minutes timer 0
execute if score seconds timer matches ..-1 run scoreboard players set seconds timer 0

execute if score hours timer matches 24.. run scoreboard players set hours timer 23
execute if score minutes timer matches 60.. run scoreboard players set minutes timer 59
execute if score seconds timer matches 60.. run scoreboard players set seconds timer 59

# Clear storage
data remove storage timer:args days
data remove storage timer:args hours
data remove storage timer:args minutes
data remove storage timer:args seconds

# Start the timer immediately
scoreboard players set start timer_state 1
tellraw @s [{"text":"Countdown started!","color":"green"}]
function timer:tick
