scoreboard players set Arena wave_number 2
$scoreboard players set y arena $(arena_y)

gamemode spectator @a

effect give @a minecraft:night_vision infinite 255 true

#blue arena
$execute run place template game:village/v1a 0 $(arena_y) 0
$execute run place template game:village/v2a 48 $(arena_y) 0
$execute run place template game:village/v3a 96 $(arena_y) 0

$execute run place template game:village/v1b 0 $(arena_y) 48
$execute run place template game:village/v2b 48 $(arena_y) 48
$execute run place template game:village/v3b 96 $(arena_y) 48

$execute run place template game:village/v1c 0 $(arena_y) 96
$execute run place template game:village/v2c 48 $(arena_y) 96
$execute run place template game:village/v3c 96 $(arena_y) 96

$kill @e[tag=$(tag)]

$function game:arena/marker/init_spawn {x:69,offset:24,z:50,tag:$(tag)}
$function game:arena/marker/init_spawn {x:93,offset:11,z:87,tag:$(tag)}
$function game:arena/marker/init_spawn {x:46,offset:14,z:103,tag:$(tag)}
$function game:arena/marker/init_spawn {x:8,offset:12,z:93,tag:$(tag)}
$function game:arena/marker/init_spawn {x:36,offset:10,z:39,tag:$(tag)}
$function game:arena/marker/init_spawn {x:94,offset:13,z:14,tag:$(tag)}
$function game:arena/marker/init_spawn {x:114,offset:22,z:117,tag:$(tag)}
$function game:arena/marker/init_spawn {x:72,offset:14,z:18,tag:$(tag)}
$function game:arena/marker/init_spawn {x:112,offset:15,z:27,tag:$(tag)}
$function game:arena/marker/init_spawn {x:67,offset:15,z:93,tag:$(tag)}
$function game:arena/marker/init_spawn {x:53,offset:14,z:46,tag:$(tag)}
$function game:arena/marker/init_spawn {x:91,offset:25,z:60,tag:$(tag)}
$function game:arena/marker/init_spawn {x:23,offset:6,z:24,tag:$(tag)}
$function game:arena/marker/init_spawn {x:52,offset:19,z:80,tag:$(tag)}
$function game:arena/marker/init_spawn {x:18,offset:9,z:60,tag:$(tag)}
$function game:arena/marker/init_spawn {x:113,offset:18,z:53,tag:$(tag)}

#summon marker 69 124 50 {Invulnerable:1b,Invisible:1b,Tags:["spawn_blues_mobs"]}
#summon marker 93 111 87 {Invulnerable:1b,Invisible:1b,Tags:["spawn_blues_mobs"]}
#summon marker 46 114 103 {Invulnerable:1b,Invisible:1b,Tags:["spawn_blues_mobs"]}
#summon marker 8 112 93 {Invulnerable:1b,Invisible:1b,Tags:["spawn_blues_mobs"]}
#summon marker 36 110 39 {Invulnerable:1b,Invisible:1b,Tags:["spawn_blues_mobs"]}
#summon marker 94 113 14 {Invulnerable:1b,Invisible:1b,Tags:["spawn_blues_mobs"]}
#summon marker 114 122 117 {Invulnerable:1b,Invisible:1b,Tags:["spawn_blues_mobs"]}
#
#summon marker 72 114 18 {Invulnerable:1b,Invisible:1b,Tags:["spawn_blues_mobs"]}
#summon marker 112 115 27 {Invulnerable:1b,Invisible:1b,Tags:["spawn_blues_mobs"]}
#summon marker 67 115 93 {Invulnerable:1b,Invisible:1b,Tags:["spawn_blues_mobs"]}
#summon marker 53 114 46 {Invulnerable:1b,Invisible:1b,Tags:["spawn_blues_mobs"]}
#summon marker 91 125 60 {Invulnerable:1b,Invisible:1b,Tags:["spawn_blues_mobs"]}
#summon marker 23 106 24 {Invulnerable:1b,Invisible:1b,Tags:["spawn_blues_mobs"]}
#summon marker 52 119 80 {Invulnerable:1b,Invisible:1b,Tags:["spawn_blues_mobs"]}
#summon marker 18 109 60 {Invulnerable:1b,Invisible:1b,Tags:["spawn_blues_mobs"]}
#summon marker 113 118 53 {Invulnerable:1b,Invisible:1b,Tags:["spawn_blues_mobs"]}





