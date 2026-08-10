execute as @a[scores={died=1..}] run function game:init/player_died/player_died

execute if score game_config bool matches 1 run function game:config/testfor_change



execute if score start timer matches 1 if score minutes timer matches ..-1 if score battle timer matches 0 run function game:init/init_preparation-phase

execute unless score BlueTeam wave_number matches 1.. unless score YellowTeam wave_number matches 1.. unless score RedTeam wave_number matches 1.. run execute if score start timer matches 0 run title @a actionbar {"text":"Timer paused!","bold":true,"color":"dark_green"}

execute if score start timer matches -1 run function game:all_teams/actionbar_mob_count


execute unless score debug arena matches 1 if entity @a[team=green] if score battle timer matches 1 as @r run function game:spawn_waves/new/init_spawn_waves {Team:Green,team:green,op1:yellow,op2:red,op3:blue,Op1:Yellow,Op2:Red,Op3:Blue}
execute unless score debug arena matches 1 if entity @a[team=yellow] if score battle timer matches 1 as @r run function game:spawn_waves/new/init_spawn_waves {Team:Yellow,team:yellow,op1:green,op2:red,op3:blue,Op1:Green,Op2:Red,Op3:Blue}
execute unless score debug arena matches 1 if entity @a[team=blue] if score battle timer matches 1 as @r run function game:spawn_waves/new/init_spawn_waves {Team:Blue,team:blue,op1:yellow,op2:red,op3:green,Op1:Yellow,Op2:Red,Op3:Green}
execute unless score debug arena matches 1 if entity @a[team=red] if score battle timer matches 1 as @r run function game:spawn_waves/new/init_spawn_waves {Team:Red,team:red,op1:yellow,op2:green,op3:blue,Op1:Yellow,Op2:Green,Op3:Blue}


execute if score debug arena matches 1 if score battle timer matches 1 run function game:all_teams/spawn_waves


execute as @a[team=blue] if items entity @s weapon.mainhand clock[custom_name=[{"text":"Mob Radar","italic":false,"color":"light_purple","bold":true}],lore=[[{"text":"Shows particles towards the nearest mob. ","italic":false}]],rarity=epic,enchantment_glint_override=true] run function game:init/mob_locator {team_mobs:blues_enemies}
execute as @a[team=red] if items entity @s weapon.mainhand clock[custom_name=[{"text":"Mob Radar","italic":false,"color":"light_purple","bold":true}],lore=[[{"text":"Shows particles towards the nearest mob. ","italic":false}]],rarity=epic,enchantment_glint_override=true] run function game:init/mob_locator {team_mobs:reds_enemies}
execute as @a[team=green] if items entity @s weapon.mainhand clock[custom_name=[{"text":"Mob Radar","italic":false,"color":"light_purple","bold":true}],lore=[[{"text":"Shows particles towards the nearest mob. ","italic":false}]],rarity=epic,enchantment_glint_override=true] run function game:init/mob_locator {team_mobs:greens_enemies}
execute as @a[team=yellow] if items entity @s weapon.mainhand clock[custom_name=[{"text":"Mob Radar","italic":false,"color":"light_purple","bold":true}],lore=[[{"text":"Shows particles towards the nearest mob. ","italic":false}]],rarity=epic,enchantment_glint_override=true] run function game:init/mob_locator {team_mobs:yellows_enemies}



execute if score Arena wave_number matches 1.. run function game:all_teams/init_keep_mobs_in_arena
