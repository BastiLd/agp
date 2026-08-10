
kill @e[tag=additional]

summon text_display ~-1.75 ~2 ~-2.75 {Tags:["game_config","additional"],text:[{"bold":true,"text":"Additional-Settings"}],transformation:{left_rotation:[0f,0f,0f,1f],right_rotation:[0f,0f,0f,1f],translation:[0f,0f,0f],scale:[0.6f,0.6f,0.6f]}}
summon text_display ~-1.9 ~1.7 ~-2.75 {Tags:["game_config","additional"],text:[{"text":"Fight agains own mobs:"}],transformation:{left_rotation:[0f,0f,0f,1f],right_rotation:[0f,0f,0f,1f],translation:[0f,0f,0f],scale:[0.5f,0.5f,0.5f]}}
summon text_display ~-1.9 ~1.4 ~-2.75 {Tags:["game_config","additional"],text:[{"text":"Keep-Inventory:"}],transformation:{left_rotation:[0f,0f,0f,1f],right_rotation:[0f,0f,0f,1f],translation:[0f,0f,0f],scale:[0.5f,0.5f,0.5f]}}
summon text_display ~-1.9 ~1.1 ~-2.75 {Tags:["game_config","additional"],text:[{"text":"Show-Deathmessages:"}],transformation:{left_rotation:[0f,0f,0f,1f],right_rotation:[0f,0f,0f,1f],translation:[0f,0f,0f],scale:[0.5f,0.5f,0.5f]}}
summon text_display ~-1.9 ~0.8 ~-2.75 {Tags:["game_config","additional"],text:[{"text":"Show-Advancements:"}],transformation:{left_rotation:[0f,0f,0f,1f],right_rotation:[0f,0f,0f,1f],translation:[0f,0f,0f],scale:[0.5f,0.5f,0.5f]}}




function game:config/additional_settings/faom
function game:config/additional_settings/keep_inv
function game:config/additional_settings/announce_death
function game:config/additional_settings/announceadvancements