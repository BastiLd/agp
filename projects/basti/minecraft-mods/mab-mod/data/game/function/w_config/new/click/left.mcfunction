advancement revoke @s only game:left_click
execute if score game_config bool matches 1 run return fail
tag @s add yyyy_attacker 
execute as @s at @s run playsound minecraft:ui.button.click
execute as @s[team=red] run function game:w_config/new/click/save_team {Team:Red,team:red,type:attacked}
execute as @s[team=green] run function game:w_config/new/click/save_team {Team:Green,team:green,type:attacked}
execute as @s[team=blue] run function game:w_config/new/click/save_team {Team:Blue,team:blue,type:attacked}
execute as @s[team=yellow] run function game:w_config/new/click/save_team {Team:Yellow,team:yellow,type:attacked}
#falls das nicht klappt in der function game:w_config/new/click/save_team eigenes storrage pro team
#und dann hier execute as @e[type=interaction,distance=..20] run function game:w_config/new/click/find_attacked with storage (und dann das team, zb.: blue_attacked)


execute as @e[type=interaction,distance=..20] run function game:w_config/new/click/find_attacked with storage attacked
tag @s remove yyyy_attacker