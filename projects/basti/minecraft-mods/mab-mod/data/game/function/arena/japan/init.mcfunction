tellraw @a {"text":"\n\n\n\n\n\n\n\n\n\n\n\n\n! Please look, if the arenas were build correctly.\n! If not, just click the text again.\n","bold":true}
execute if entity @a[team=green] run function game:arena/init_spawn_arena {arena_y:100,tag:"spawn_greens_enemies",Team:Green,arena:japan}
execute if entity @a[team=blue] run function game:arena/init_spawn_arena {arena_y:150,tag:"spawn_blues_enemies",Team:Blue,arena:japan}
execute if entity @a[team=yellow] run function game:arena/init_spawn_arena {arena_y:200,tag:"spawn_yellows_enemies",Team:Yellow,arena:japan}
execute if entity @a[team=red] run function game:arena/init_spawn_arena {arena_y:250,tag:"spawn_reds_enemies",Team:Red,arena:japan}





tellraw @a {text:""}
tellraw @a {"click_event":{"action":"run_command","command":"/function game:init/finale"},"text":"Click here to start the battle"}



execute unless score debug arena matches 1 run return fail
function game:arena/japan/spawn_arena {arena_y:100,tag:"spawn_greens_enemies"}
function game:arena/japan/spawn_arena {arena_y:150,tag:"spawn_blues_enemies"}
function game:arena/japan/spawn_arena {arena_y:200,tag:"spawn_yellows_enemies"}
function game:arena/japan/spawn_arena {arena_y:250,tag:"spawn_reds_enemies"}
