# Timer function
execute if score #timer timer matches 1.. run scoreboard players remove #timer timer 1
execute if score #timer timer matches 0 run function timer:stop
execute if score #timer timer matches 1.. run function timer:update_display
execute if score #timer timer matches 1.. run function timer:display 