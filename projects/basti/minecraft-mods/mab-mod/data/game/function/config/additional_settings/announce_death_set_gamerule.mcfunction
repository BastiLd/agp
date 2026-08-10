execute if score announce_death config matches 0 in the_nether run gamerule showDeathMessages true
execute if score announce_death config matches 0 in overworld run gamerule showDeathMessages true
execute if score announce_death config matches 0 in the_end run gamerule showDeathMessages true

execute if score announce_death config matches 1 in the_nether run gamerule showDeathMessages false
execute if score announce_death config matches 1 in overworld run gamerule showDeathMessages false
execute if score announce_death config matches 1 in the_end run gamerule showDeathMessages false

#announceAdvancements