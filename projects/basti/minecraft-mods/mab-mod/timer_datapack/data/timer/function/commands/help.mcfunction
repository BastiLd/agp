# Timer Help Command
# Shows available commands

tellraw @s [{"text":"=== Timer Commands ===","color":"gold","bold":true}]
tellraw @s [{"text":"/timer start","color":"yellow"},{"text":" - Start the timer","color":"white"}]
tellraw @s [{"text":"/timer resume","color":"yellow"},{"text":" - Resume a paused timer","color":"white"}]
tellraw @s [{"text":"/timer stop","color":"yellow"},{"text":" - Stop/pause the timer","color":"white"}]
tellraw @s [{"text":"/timer set [d] [h] [m] [s]","color":"yellow"},{"text":" - Set timer time","color":"white"}]
tellraw @s [{"text":"/timer color [color]","color":"yellow"},{"text":" - Set display color","color":"white"}]
tellraw @s [{"text":"/timer countdown [d] [h] [m] [s]","color":"yellow"},{"text":" - Set and start timer","color":"white"}]
tellraw @s [{"text":"/timer help","color":"yellow"},{"text":" - Show this help","color":"white"}]
tellraw @s [{"text":"","color":"white"}]
tellraw @s [{"text":"Example:","color":"gray"}]
tellraw @s [{"text":"/timer set 0 0 5 0","color":"aqua"},{"text":" - Set 5 minutes","color":"white"}]
tellraw @s [{"text":"/timer countdown 0 0 10 0","color":"aqua"},{"text":" - Start 10-minute countdown","color":"white"}]
