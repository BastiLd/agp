# Timer Tick Function
# Handles countdown and display

# Countdown logic
execute if score start timer_state matches 1 run scoreboard players remove seconds timer 1

# Handle time rollover
execute if score start timer_state matches 1 if score seconds timer matches ..-1 run scoreboard players set seconds timer 59
execute if score start timer_state matches 1 if score seconds timer matches ..-1 run scoreboard players remove minutes timer 1

execute if score start timer_state matches 1 if score minutes timer matches ..-1 run scoreboard players set minutes timer 59
execute if score start timer_state matches 1 if score minutes timer matches ..-1 run scoreboard players remove hours timer 1

execute if score start timer_state matches 1 if score hours timer matches ..-1 run scoreboard players set hours timer 23
execute if score start timer_state matches 1 if score hours timer matches ..-1 run scoreboard players remove days timer 1

# Stop timer when it reaches zero
execute if score days timer matches ..0 if score hours timer matches ..0 if score minutes timer matches ..0 if score seconds timer matches ..0 run scoreboard players set start timer_state 0
execute if score days timer matches ..0 if score hours timer matches ..0 if score minutes timer matches ..0 if score seconds timer matches ..0 run title @a title {"text":"Timer Finished!","color":"red","bold":true}
execute if score days timer matches ..0 if score hours timer matches ..0 if score minutes timer matches ..0 if score seconds timer matches ..0 run playsound minecraft:entity.player.levelup @a

# Display timer in actionbar
execute if score start timer_state matches 1 run function timer:display_timer

# Schedule next tick
execute if score start timer_state matches 1 run schedule function timer:tick 1s
