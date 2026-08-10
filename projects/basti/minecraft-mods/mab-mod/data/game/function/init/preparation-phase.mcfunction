$execute as @a[team=$(team)] run function game:init/count_mobs {Team:$(Team)}

$execute if entity @a[team=$(team)] run function game:w_config/new/show/config {team:$(team),Team:$(Team)}