# Load function
function timer:setup
tellraw @a {"text":"Timer datapack loaded!","color":"green","bold":true}
tellraw @a {"text":"Use /timer start to start the timer","color":"yellow","bold":true}
tellraw @a {"text":"Available commands:","color":"yellow","bold":true}
tellraw @a {"text":"/timer start - Start 5-minute timer","color":"yellow","bold":true}
tellraw @a {"text":"/timer stop - Stop the timer","color":"yellow","bold":true}
tellraw @a {"text":"/timer reset - Reset timer to 0","color":"yellow","bold":true}
tellraw @a {"text":"/timer reverse - Reverse timer direction","color":"yellow","bold":true}
tellraw @a {"text":"/timer color - Change color theme","color":"yellow","bold":true}
tellraw @a {"text":"/timer set <seconds> - Set custom time","color":"yellow","bold":true} 