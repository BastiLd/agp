# Timer Command System
# This function creates a command-like system for the timer

# Display available commands
tellraw @s [{"text":"=== Timer Commands ===","color":"gold","bold":true}]
tellraw @s [{"text":"","color":"white"}]
tellraw @s [{"text":"To use timer commands, run these functions:","color":"yellow"}]
tellraw @s [{"text":"","color":"white"}]
tellraw @s [{"text":"• function timer:start","color":"aqua"},{"text":" - Start timer","color":"white"}]
tellraw @s [{"text":"• function timer:resume","color":"aqua"},{"text":" - Resume timer","color":"white"}]
tellraw @s [{"text":"• function timer:stop","color":"aqua"},{"text":" - Stop timer","color":"white"}]
tellraw @s [{"text":"• function timer:set","color":"aqua"},{"text":" - Set timer (set scoreboard first)","color":"white"}]
tellraw @s [{"text":"• function timer:color","color":"aqua"},{"text":" - Set color (set scoreboard first)","color":"white"}]
tellraw @s [{"text":"• function timer:countdown","color":"aqua"},{"text":" - Set and start timer","color":"white"}]
tellraw @s [{"text":"• function timer:help","color":"aqua"},{"text":" - Show this help","color":"white"}]
tellraw @s [{"text":"","color":"white"}]
tellraw @s [{"text":"Parameter-based commands:","color":"yellow"}]
tellraw @s [{"text":"• function timer:commands/set_with_params {days:0,hours:0,minutes:5,seconds:0}","color":"aqua"}]
tellraw @s [{"text":"• function timer:commands/countdown_with_params {days:0,hours:0,minutes:10,seconds:0}","color":"aqua"}]
tellraw @s [{"text":"• function timer:commands/color_with_params {color:red}","color":"aqua"}]
