function game:init/init_scoreboards
effect give @a night_vision infinite 1 true 
gamerule doTileDrops true
gamerule doImmediateRespawn true
tellraw @a [{"text":"\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n"}]
tellraw @a [{"text":"[Datapack by Pious880]","color":"dark_aqua","bold":true}]
tellraw @a [{"text":"Click to enable/disable or join to a team.","color":"dark_aqua"}]
tellraw @a [{"text":"Sneak-Click the clock to add or remove 10 minutes.","color":"dark_aqua"}]
tellraw @a [{"text":"Right-Click to remove and Left-Click to add.","color":"dark_aqua"}]
function game:config/spawn