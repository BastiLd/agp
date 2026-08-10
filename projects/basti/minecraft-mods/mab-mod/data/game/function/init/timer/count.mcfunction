
execute if score start timer matches 1 run scoreboard players remove seconds timer 1

execute if score start timer matches 1 run execute if score seconds timer matches ..0 run scoreboard players remove minutes timer 1
execute if score start timer matches 1 run execute if score seconds timer matches ..0 run scoreboard players set seconds timer 59





execute if score minutes timer matches ..9 if score seconds timer matches ..9 run title @a actionbar ["",{"text":"0","bold":true,"color":"dark_green"},{"score":{"name":"minutes","objective":"timer"},"bold":true,"color":"dark_green"},{"text":":","bold":true,"color":"dark_green"},{"text":"0","bold":true,"color":"dark_green"},{"score":{"name":"seconds","objective":"timer"},"bold":true,"color":"dark_green"}]
execute if score minutes timer matches ..9 if score seconds timer matches 10.. run title @a actionbar ["",{"text":"0","bold":true,"color":"dark_green"},{"score":{"name":"minutes","objective":"timer"},"bold":true,"color":"dark_green"},{"text":":","bold":true,"color":"dark_green"},{"score":{"name":"seconds","objective":"timer"},"bold":true,"color":"dark_green"}]
execute if score minutes timer matches 10.. if score seconds timer matches ..9 run title @a actionbar ["",{"score":{"name":"minutes","objective":"timer"},"bold":true,"color":"dark_green"},{"text":":","bold":true,"color":"dark_green"},{"text":"0","bold":true,"color":"dark_green"},{"score":{"name":"seconds","objective":"timer"},"bold":true,"color":"dark_green"}]
execute if score minutes timer matches 10.. if score seconds timer matches 10.. run title @a actionbar ["",{"score":{"name":"minutes","objective":"timer"},"bold":true,"color":"dark_green"},{"text":":","bold":true,"color":"dark_green"},{"score":{"name":"seconds","objective":"timer"},"bold":true,"color":"dark_green"}]




execute if score start timer matches 1 run schedule function game:init/timer/count 1s
