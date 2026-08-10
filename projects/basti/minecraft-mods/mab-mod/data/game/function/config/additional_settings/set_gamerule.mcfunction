
#muss umgedreht sein
execute if score keep_inv config matches 0 in the_nether run gamerule keepInventory true
execute if score keep_inv config matches 0 in overworld run gamerule keepInventory true
execute if score keep_inv config matches 0 in the_end run gamerule keepInventory true

execute if score keep_inv config matches 1 in the_nether run gamerule keepInventory false
execute if score keep_inv config matches 1 in overworld run gamerule keepInventory false
execute if score keep_inv config matches 1 in the_end run gamerule keepInventory false

