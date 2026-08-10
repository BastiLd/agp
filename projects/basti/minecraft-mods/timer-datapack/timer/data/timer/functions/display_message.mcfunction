# Prepare JSON components for actionbar
# Arguments: <color_main> <color_time>

# Set default colors if not provided (though they should be)
scoreboard players set #color_main timer 0
scoreboard players set #color_time timer 0

execute store result score #color_main timer run data get storage minecraft:global DisplayColors.main
execute store result score #color_time timer run data get storage minecraft:global DisplayColors.time


# Construct the message
# Start with an empty JSON array
summon minecraft:area_effect_cloud ~ ~ ~ {Tags:["timer_message_start"]}

# Add Days (if > 0)
execute if score #timer_days timer matches 1.. run data modify entity @e[tag=timer_message_start,limit=1] CustomName append value {"score":{"name":"#timer_days","objective":"timer"},"color":".#color_time","bold":true,"nbt":"scoreboard.DisplayColors.time"}
execute if score #timer_days timer matches 1.. run data modify entity @e[tag=timer_message_start,limit=1] CustomName append value {"text":"d ","color":".#color_main","bold":true,"nbt":"scoreboard.DisplayColors.main"}

# Add Hours (if > 0 or if days > 0)
execute if score #timer_hours timer matches 1.. or if score #timer_days timer matches 1.. run data modify entity @e[tag=timer_message_start,limit=1] CustomName append value {"score":{"name":"#timer_hours","objective":"timer"},"color":".#color_time","bold":true,"nbt":"scoreboard.DisplayColors.time"}
execute if score #timer_hours timer matches 1.. or if score #timer_days timer matches 1.. run data modify entity @e[tag=timer_message_start,limit=1] CustomName append value {"text":"h ","color":".#color_main","bold":true,"nbt":"scoreboard.DisplayColors.main"}

# Add Minutes (if > 0 or if hours > 0 or if days > 0)
execute if score #timer_minutes timer matches 1.. or if score #timer_hours timer matches 1.. or if score #timer_days timer matches 1.. run data modify entity @e[tag=timer_message_start,limit=1] CustomName append value {"score":{"name":"#timer_minutes","objective":"timer"},"color":".#color_time","bold":true,"nbt":"scoreboard.DisplayColors.time"}
execute if score #timer_minutes timer matches 1.. or if score #timer_hours timer matches 1.. or if score #timer_days timer matches 1.. run data modify entity @e[tag=timer_message_start,limit=1] CustomName append value {"text":"m ","color":".#color_main","bold":true,"nbt":"scoreboard.DisplayColors.main"}

# Add Seconds
data modify entity @e[tag=timer_message_start,limit=1] CustomName append value {"score":{"name":"#timer_seconds","objective":"timer"},"color":".#color_time","bold":true,"nbt":"scoreboard.DisplayColors.time"}
data modify entity @e[tag=timer_message_start,limit=1] CustomName append value {"text":"s","color":".#color_main","bold":true,"nbt":"scoreboard.DisplayColors.main"}


# Display the JSON
execute as @a at @s run title @s actionbar [{"text":"Timer: ","color":".#color_main","bold":true,"nbt":"scoreboard.DisplayColors.main"},{"nbt":"CustomName","entity":"@e[tag=timer_message_start,limit=1]"}]

kill @e[tag=timer_message_start,limit=1] 