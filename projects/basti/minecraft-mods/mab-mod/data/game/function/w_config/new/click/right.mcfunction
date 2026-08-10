advancement revoke @s only game:right_click
execute if score game_config bool matches 1 run return fail
#die ganzen yyy damit es bei Tags.[0] ist 
#klappt aber iwi net  Tags werden komisch sortiert
tag @s add yyyy_interacted 
execute as @s at @s run playsound minecraft:ui.button.click
execute as @s[team=red] run function game:w_config/new/click/save_team {Team:Red,team:red,type:interacted}
execute as @s[team=green] run function game:w_config/new/click/save_team {Team:Green,team:green,type:interacted}
execute as @s[team=blue] run function game:w_config/new/click/save_team {Team:Blue,team:blue,type:interacted}
execute as @s[team=yellow] run function game:w_config/new/click/save_team {Team:Yellow,team:yellow,type:interacted}


execute as @e[type=interaction,distance=..20] run function game:w_config/new/click/find_interacted with storage interacted
tag @s remove yyyy_interacted