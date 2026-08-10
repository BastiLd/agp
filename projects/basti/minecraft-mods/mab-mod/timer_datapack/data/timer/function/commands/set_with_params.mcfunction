# Timer Set Command with Parameters
# Usage: function timer:commands/set_with_params {days:1,hours:2,minutes:30,seconds:45}

# Stop timer if running
execute if score start timer_state matches 1 run scoreboard players set start timer_state 0

# Parse parameters from storage
execute store result score days timer run data get storage timer:params days 1
execute store result score hours timer run data get storage timer:params hours 1
execute store result score minutes timer run data get storage timer:params minutes 1
execute store result score seconds timer run data get storage timer:params seconds 1

# Validate input
execute if score days timer matches ..-1 run scoreboard players set days timer 0
execute if score hours timer matches ..-1 run scoreboard players set hours timer 0
execute if score minutes timer matches ..-1 run scoreboard players set minutes timer 0
execute if score seconds timer matches ..-1 run scoreboard players set seconds timer 0

execute if score hours timer matches 24.. run scoreboard players set hours timer 23
execute if score minutes timer matches 60.. run scoreboard players set minutes timer 59
execute if score seconds timer matches 60.. run scoreboard players set seconds timer 59

# Clear storage
data remove storage timer:params days
data remove storage timer:params hours
data remove storage timer:params minutes
data remove storage timer:params seconds

# Display confirmation
execute if score days timer matches 1.. run tellraw @s [{"text":"Timer set to ","color":"green"},{"score":{"name":"days","objective":"timer"},"color":"green"},{"text":" days, ","color":"green"},{"score":{"name":"hours","objective":"timer"},"color":"green"},{"text":" hours, ","color":"green"},{"score":{"name":"minutes","objective":"timer"},"color":"green"},{"text":" minutes, ","color":"green"},{"score":{"name":"seconds","objective":"timer"},"color":"green"},{"text":" seconds","color":"green"}]

execute if score days timer matches 0 if score hours timer matches 1.. run tellraw @s [{"text":"Timer set to ","color":"green"},{"score":{"name":"hours","objective":"timer"},"color":"green"},{"text":" hours, ","color":"green"},{"score":{"name":"minutes","objective":"timer"},"color":"green"},{"text":" minutes, ","color":"green"},{"score":{"name":"seconds","objective":"timer"},"color":"green"},{"text":" seconds","color":"green"}]

execute if score days timer matches 0 if score hours timer matches 0 if score minutes timer matches 1.. run tellraw @s [{"text":"Timer set to ","color":"green"},{"score":{"name":"minutes","objective":"timer"},"color":"green"},{"text":" minutes, ","color":"green"},{"score":{"name":"seconds","objective":"timer"},"color":"green"},{"text":" seconds","color":"green"}]

execute if score days timer matches 0 if score hours timer matches 0 if score minutes timer matches 0 if score seconds timer matches 1.. run tellraw @s [{"text":"Timer set to ","color":"green"},{"score":{"name":"seconds","objective":"timer"},"color":"green"},{"text":" seconds","color":"green"}]
