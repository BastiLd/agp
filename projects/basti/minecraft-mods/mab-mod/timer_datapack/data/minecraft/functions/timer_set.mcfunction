# /timer set command
# This function is called when /timer set [days] [hours] [minutes] [seconds] is executed
# Usage: /timer set 1 2 30 45

# Stop timer if running
execute if score start timer_state matches 1 run scoreboard players set start timer_state 0

# Parse arguments from command
# Note: This is a simplified version - in a real implementation, you'd need to parse the command arguments
# For now, we'll use a basic approach with storage

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

# Display confirmation
execute if score days timer matches 1.. run tellraw @s [{"text":"Timer set to ","color":"green"},{"score":{"name":"days","objective":"timer"},"color":"green"},{"text":" days, ","color":"green"},{"score":{"name":"hours","objective":"timer"},"color":"green"},{"text":" hours, ","color":"green"},{"score":{"name":"minutes","objective":"timer"},"color":"green"},{"text":" minutes, ","color":"green"},{"score":{"name":"seconds","objective":"timer"},"color":"green"},{"text":" seconds","color":"green"}]

execute if score days timer matches 0 if score hours timer matches 1.. run tellraw @s [{"text":"Timer set to ","color":"green"},{"score":{"name":"hours","objective":"timer"},"color":"green"},{"text":" hours, ","color":"green"},{"score":{"name":"minutes","objective":"timer"},"color":"green"},{"text":" minutes, ","color":"green"},{"score":{"name":"seconds","objective":"timer"},"color":"green"},{"text":" seconds","color":"green"}]

execute if score days timer matches 0 if score hours timer matches 0 if score minutes timer matches 1.. run tellraw @s [{"text":"Timer set to ","color":"green"},{"score":{"name":"minutes","objective":"timer"},"color":"green"},{"text":" minutes, ","color":"green"},{"score":{"name":"seconds","objective":"timer"},"color":"green"},{"text":" seconds","color":"green"}]

execute if score days timer matches 0 if score hours timer matches 0 if score minutes timer matches 0 if score seconds timer matches 1.. run tellraw @s [{"text":"Timer set to ","color":"green"},{"score":{"name":"seconds","objective":"timer"},"color":"green"},{"text":" seconds","color":"green"}]

# Show usage if no arguments
tellraw @s [{"text":"Usage: /timer set [days] [hours] [minutes] [seconds]","color":"yellow"}]
tellraw @s [{"text":"Example: /timer set 0 0 5 0 (5 minutes)","color":"gray"}]
