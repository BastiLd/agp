

$scoreboard players set y arena $(arena_y)
scoreboard players set Arena wave_number 1

effect give @a minecraft:night_vision infinite 255 true
gamemode spectator @a


$place template game:arena/a1 25 $(arena_y) 25
$place template game:arena/a1a 25 $(arena_y) 73
$place template game:arena/a1b 25 $(arena_y) 121
$place template game:arena/a1c 25 $(arena_y) 169


$place template game:arena/a2 73 $(arena_y) 25
$place template game:arena/a2a 73 $(arena_y) 73
$place template game:arena/a2b 73 $(arena_y) 121
$place template game:arena/a2c 73 $(arena_y) 169


$place template game:arena/a3 121 $(arena_y) 25
$place template game:arena/a3a 121 $(arena_y) 73
$place template game:arena/a3b 121 $(arena_y) 121
$place template game:arena/a3c 121 $(arena_y) 169


$kill @e[tag=$(tag)]
$function game:arena/marker/init_spawn {x:44,offset:8,z:66,tag:$(tag)}

$function game:arena/marker/init_spawn {x:49,offset:7,z:121,tag:$(tag)}

$function game:arena/marker/init_spawn {x:149,offset:3,z:165,tag:$(tag)}
$function game:arena/marker/init_spawn {x:100,offset:7,z:55,tag:$(tag)}
$function game:arena/marker/init_spawn {x:103,offset:3,z:164,tag:$(tag)}
$function game:arena/marker/init_spawn {x:77,offset:7,z:107,tag:$(tag)}
$function game:arena/marker/init_spawn {x:51,offset:3,z:173,tag:$(tag)}
$function game:arena/marker/init_spawn {x:144,offset:3,z:139,tag:$(tag)}
$function game:arena/marker/init_spawn {x:143,offset:10,z:50,tag:$(tag)}
$function game:arena/marker/init_spawn {x:122,offset:7,z:189,tag:$(tag)}
$function game:arena/marker/init_spawn {x:100,offset:7,z:131,tag:$(tag)}









gamemode spectator @a


