# Update display values
scoreboard players operation #timer_days timer = #timer timer
scoreboard players operation #timer_days timer /= #86400 timer

scoreboard players operation #timer_hours timer = #timer timer
scoreboard players operation #timer_hours timer %= #86400 timer
scoreboard players operation #timer_hours timer /= #3600 timer

scoreboard players operation #timer_minutes timer = #timer timer
scoreboard players operation #timer_minutes timer %= #3600 timer
scoreboard players operation #timer_minutes timer /= #60 timer

scoreboard players operation #timer_seconds timer = #timer timer
scoreboard players operation #timer_seconds timer %= #60 timer 