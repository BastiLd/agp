

$scoreboard players set y arena $(arena_y)
scoreboard players set Arena wave_number 3

effect give @a minecraft:night_vision infinite 255 true
gamemode spectator @a


$place template game:japan/b1 25 $(arena_y) 25
$place template game:japan/b1a 25 $(arena_y) 73
$place template game:japan/b1b 25 $(arena_y) 121
$place template game:japan/b1c 25 $(arena_y) 169


$place template game:japan/b2 73 $(arena_y) 25
$place template game:japan/b2a 73 $(arena_y) 73
$place template game:japan/b2b 73 $(arena_y) 121
$place template game:japan/b2c 73 $(arena_y) 169


$place template game:japan/b3 121 $(arena_y) 25
$place template game:japan/b3a 121 $(arena_y) 73
$place template game:japan/b3b 121 $(arena_y) 121
$place template game:japan/b3c 121 $(arena_y) 169



$kill @e[tag=$(tag)]
$function game:arena/marker/init_spawn {x:47,offset:12,z:107,tag:$(tag)}
$function game:arena/marker/init_spawn {x:58,offset:4,z:165,tag:$(tag)}
$function game:arena/marker/init_spawn {x:101,offset:7,z:177,tag:$(tag)}
$function game:arena/marker/init_spawn {x:134,offset:3,z:140,tag:$(tag)}
$function game:arena/marker/init_spawn {x:145,offset:8,z:106,tag:$(tag)}
$function game:arena/marker/init_spawn {x:96,offset:7,z:53,tag:$(tag)}
$function game:arena/marker/init_spawn {x:50,offset:8,z:56,tag:$(tag)}
$function game:arena/marker/init_spawn {x:63,offset:3,z:181,tag:$(tag)}
$function game:arena/marker/init_spawn {x:122,offset:7,z:192,tag:$(tag)}
$function game:arena/marker/init_spawn {x:131,offset:9,z:58,tag:$(tag)}
$function game:arena/marker/init_spawn {x:73,offset:4,z:61,tag:$(tag)}
$function game:arena/marker/init_spawn {x:130,offset:6,z:91,tag:$(tag)}
$function game:arena/marker/init_spawn {x:79,offset:6,z:83,tag:$(tag)}
$function game:arena/marker/init_spawn {x:107,offset:3,z:83,tag:$(tag)}






gamemode spectator @a


