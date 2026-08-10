execute as @s at @s run playsound minecraft:ui.button.click ambient @a

execute if entity @s[tag=announce_death] on attacker run return run function game:config/additional_settings/bool {type:announce_death}
execute if entity @s[tag=announceadvancements] on attacker run return run function game:config/additional_settings/bool {type:announceadvancements}

execute if entity @s[tag=keep_inv] on attacker run return run function game:config/additional_settings/keep_inv_bool {obj:keep_inv}
execute if entity @s[tag=famo] on attacker run return run function game:config/additional_settings/famo_bool

execute if entity @s[tag=yellow] on attacker run return run function game:init/join_team {Team:Yellow,team:yellow}
execute if entity @s[tag=green] on attacker run return run function game:init/join_team {Team:Green,team:green}
execute if entity @s[tag=blue] on attacker run return run function game:init/join_team {Team:Blue,team:blue}
execute if entity @s[tag=red] on attacker run return run function game:init/join_team {Team:Red,team:red}




execute if entity @s[tag=clock] run scoreboard players add minutes timer 1

execute if entity @s[tag=clock] on attacker if predicate game:is_sneaking run scoreboard players add minutes timer 1
execute if entity @s[tag=clock] on attacker if predicate game:is_sneaking run scoreboard players add minutes timer 1
execute if entity @s[tag=clock] on attacker if predicate game:is_sneaking run scoreboard players add minutes timer 1
execute if entity @s[tag=clock] on attacker if predicate game:is_sneaking run scoreboard players add minutes timer 1
execute if entity @s[tag=clock] on attacker if predicate game:is_sneaking run scoreboard players add minutes timer 1
execute if entity @s[tag=clock] on attacker if predicate game:is_sneaking run scoreboard players add minutes timer 1
execute if entity @s[tag=clock] on attacker if predicate game:is_sneaking run scoreboard players add minutes timer 1
execute if entity @s[tag=clock] on attacker if predicate game:is_sneaking run scoreboard players add minutes timer 1
execute if entity @s[tag=clock] on attacker if predicate game:is_sneaking run scoreboard players add minutes timer 1




function game:config/timer/time_display









execute as @e[type=interaction] run data remove entity @s attack
