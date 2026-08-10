# Main Timer Command Function
# Routes to appropriate subcommand based on first argument

# Get the subcommand from storage
execute store result storage timer:temp subcommand string 1 run scoreboard players get subcommand timer_command

# Route to appropriate function
execute if score subcommand timer_command matches 1 run function timer:commands/start
execute if score subcommand timer_command matches 2 run function timer:commands/resume
execute if score subcommand timer_command matches 3 run function timer:commands/stop
execute if score subcommand timer_command matches 4 run function timer:commands/set
execute if score subcommand timer_command matches 5 run function timer:commands/color
execute if score subcommand timer_command matches 6 run function timer:commands/countdown

# Clear storage
data remove storage timer:temp subcommand
