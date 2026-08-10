# /timer countdown command
# This function is called when /timer countdown [days] [hours] [minutes] [seconds] is executed
# Usage: /timer countdown 0 0 10 0

# Stop timer if running
execute if score start timer_state matches 1 run scoreboard players set start timer_state 0

# Parse arguments from command (simplified version)
# In a real implementation, you'd parse the command arguments

# Set default values if not provided
execute unless score days timer matches 1.. run scoreboard players set days timer 0
execute unless score hours timer matches 1.. run scoreboard players set hours timer 0
execute unless score minutes timer matches 1.. run scoreboard players set minutes timer 0
execute unless score seconds timer matches 1.. run scoreboard players set seconds timer 0

# Validate input
execute if score days timer matches ..-1 run scoreboard players set days timer 0
execute if score hours timer matches ..-1 run scoreboard players set hours timer 0
execute if score minutes timer matches ..-1 run scoreboard players set minutes timer 0
execute if score seconds timer matches ..-1 run scoreboard players set seconds timer 0

execute if score hours timer matches 24.. run scoreboard players set hours timer 23
execute if score minutes timer matches 60.. run scoreboard players set minutes timer 59
execute if score seconds timer matches 60.. run scoreboard players set seconds timer 59

# Start the timer immediately
scoreboard players set start timer_state 1
tellraw @s [{"text":"Countdown started!","color":"green"}]
function timer:tick

# Show usage if no arguments
tellraw @s [{"text":"Usage: /timer countdown [days] [hours] [minutes] [seconds]","color":"yellow"}]
tellraw @s [{"text":"Example: /timer countdown 0 0 10 0 (10 minutes)","color":"gray"}]
