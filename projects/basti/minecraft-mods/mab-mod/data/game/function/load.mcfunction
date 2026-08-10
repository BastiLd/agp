gamerule sendCommandFeedback false
gamerule commandBlockOutput false
tellraw @a [{"text":"[Datapack by Pious880]","color":"dark_aqua","bold":true}]
tellraw @a [{"text":"\n"}]
tellraw @a [{"text":"Thank you for downloading my Datapack!","color":"dark_aqua"}]
tellraw @a {"click_event":{"action":"open_url","url":"https://www.spigotmc.org/resources/randomizer-1-21-x.125971/"},"color":"gray","hover_event":{"action":"show_text","value":[{"text":"Download Randomizer"}]},"text":"Tip: To make it more fun, download a randomizer (click)"}
tellraw @a [{"text":"\n"}]
tellraw @a {"click_event":{"action":"run_command","command":"/function game:init/init"},"color":"dark_aqua","bold":true,"hover_event":{"action":"show_text","value":[{"text":"Start"}]},"text":"[Click this text to start configure!]"}
