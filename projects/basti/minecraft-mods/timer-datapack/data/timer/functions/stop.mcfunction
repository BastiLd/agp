# Stop timer
scoreboard players set #timer timer 0
scoreboard players set #timer_minutes timer 0
scoreboard players set #timer_seconds timer 0
execute as @a run title @s actionbar {"text":"Timer finished!","color":"red"}
tellraw @a {"text":"Timer has finished!","color":"red"} 