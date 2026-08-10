# Timer Command Parser
# This function parses timer commands and routes them to the appropriate handler

# Get command from storage
execute store result storage timer:temp cmd string 1 run scoreboard players get command timer_cmd

# Route commands
execute if score cmd timer_cmd matches 1 run function timer:commands/start
execute if score cmd timer_cmd matches 2 run function timer:commands/resume
execute if score cmd timer_cmd matches 3 run function timer:commands/stop
execute if score cmd timer_cmd matches 4 run function timer:commands/set
execute if score cmd timer_cmd matches 5 run function timer:commands/color
execute if score cmd timer_cmd matches 6 run function timer:commands/countdown

# Clear storage
data remove storage timer:temp cmd
