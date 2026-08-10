# Register Timer Commands
# This function registers all timer commands

# Register /timer start
execute run function timer:commands/start

# Register /timer resume  
execute run function timer:commands/resume

# Register /timer stop
execute run function timer:commands/stop

# Register /timer set
execute run function timer:commands/set

# Register /timer color
execute run function timer:commands/color

# Register /timer countdown
execute run function timer:commands/countdown

tellraw @a [{"text":"[Timer Commands]","color":"gold","bold":true}]
tellraw @a [{"text":"Commands registered:","color":"yellow"}]
tellraw @a [{"text":"/timer start, /timer resume, /timer stop","color":"white"}]
tellraw @a [{"text":"/timer set [d] [h] [m] [s], /timer color [color]","color":"white"}]
tellraw @a [{"text":"/timer countdown [d] [h] [m] [s]","color":"white"}]
