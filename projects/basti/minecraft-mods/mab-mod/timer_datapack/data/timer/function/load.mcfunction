# Timer Datapack Load Function
# Initialize scoreboards and default values

# Create scoreboards
scoreboard objectives add timer dummy
scoreboard objectives add timer_state dummy
scoreboard objectives add timer_color dummy
scoreboard objectives add timer_days dummy
scoreboard objectives add timer_hours dummy
scoreboard objectives add timer_minutes dummy
scoreboard objectives add timer_seconds dummy

# Set default values
scoreboard players set start timer_state 0
scoreboard players set minutes timer 0
scoreboard players set seconds timer 0
scoreboard players set hours timer 0
scoreboard players set days timer 0
scoreboard players set color timer_color dark_green

# Display welcome message
tellraw @a [{"text":"[Timer Datapack]","color":"dark_aqua","bold":true}]
tellraw @a [{"text":"Timer system loaded!","color":"dark_aqua"}]
tellraw @a [{"text":"Run 'function timer:help' to see available commands","color":"dark_aqua"}]
