                                                                                                                                                                                                                                                      
$execute at @e[tag=spawn_$(team)s_enemies,limit=1,sort=random] if score $(Opponent)TeamWave$(wave)_for_$(team) $(mob) matches 1.. run summon $(mob) ~ ~ ~ {Team:$(team)s_enemies,Tags:["w$(wave)_$(opponent)s_mobs_for_$(team)","in_$(team)_arena"],PersistenceRequired:1b,IsImmuneToZombification:1}
$execute if score $(Opponent)TeamWave$(wave)_for_$(team) $(mob) matches 1.. run scoreboard players remove $(Opponent)TeamWave$(wave)_for_$(team) $(mob) 1

#special mobs with items in der hand WOW
item replace entity @e[type=minecraft:bogged,nbt=!{equipment:{mainhand:{id:"minecraft:bow"}}}] weapon.mainhand with minecraft:bow
item replace entity @e[type=minecraft:skeleton,nbt=!{equipment:{mainhand:{id:"minecraft:bow"}}}] weapon.mainhand with minecraft:bow
item replace entity @e[type=minecraft:stray,nbt=!{equipment:{mainhand:{id:"minecraft:bow"}}}] weapon.mainhand with minecraft:bow
item replace entity @e[type=minecraft:piglin] weapon.mainhand with minecraft:golden_sword
item replace entity @e[type=minecraft:piglin_brute] weapon.mainhand with minecraft:golden_axe
item replace entity @e[type=minecraft:pillager,nbt=!{equipment:{mainhand:{id:"minecraft:crossbow"}}}] weapon.mainhand with minecraft:crossbow
item replace entity @e[type=minecraft:vindicator] weapon.mainhand with minecraft:iron_axe
item replace entity @e[type=minecraft:wither_skeleton] weapon.mainhand with minecraft:stone_sword
item replace entity @e[type=minecraft:zombified_piglin] weapon.mainhand with minecraft:golden_sword
