# Update display values
scoreboard players operation #timer_minutes timer = #timer timer
scoreboard players operation #timer_minutes timer /= #60 timer
scoreboard players operation #timer_seconds timer = #timer timer
scoreboard players operation #timer_seconds timer %= #60 timer 