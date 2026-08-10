# Main command handler for /timer

# /timer start
execute if subcommand run function timer:start

# /timer stop
execute if subcommand run function timer:stop

# /timer reset
execute if subcommand run function timer:reset

# /timer reverse
execute if subcommand run function timer:reverse

# /timer color
execute if subcommand run function timer:set_color

# /timer set <time_in_seconds>
execute if subcommand run scoreboard players set #custom_time timer %arg0%
execute if subcommand run function timer:set_time 