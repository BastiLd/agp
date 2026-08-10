scoreboard objectives add died deathCount
scoreboard objectives add timer dummy
scoreboard objectives add wave_number dummy
scoreboard players set start timer 0
scoreboard players set battle timer 0
scoreboard players add minutes timer 1
scoreboard objectives add config dummy
scoreboard players set 1 config 1
scoreboard players set 2 config 2
scoreboard players set 3 config 3
scoreboard players set 5 config 5
scoreboard objectives add preview dummy
scoreboard objectives add bool dummy
scoreboard objectives add wave_selection dummy
scoreboard objectives add wave_config dummy
#fight agains own mobs = f_a_o_m
scoreboard players set f_a_o_m config 0
scoreboard players set keep_inv config 1
scoreboard players set battle_started config 0
scoreboard players set announce_death config 0
scoreboard players set announceadvancements config 0

execute in the_nether run gamerule announceAdvancements false
execute in overworld run gamerule announceAdvancements false
execute in the_end run gamerule announceAdvancements false
execute in the_nether run gamerule showDeathMessages false
execute in overworld run gamerule showDeathMessages false
execute in the_end run gamerule showDeathMessages false
execute in the_nether run gamerule keepInventory true
execute in overworld run gamerule keepInventory true
execute in the_end run gamerule keepInventory true


scoreboard objectives add teams dummy
scoreboard objectives add arena dummy


function game:init/teams {Team:Blue,team:blue}
function game:init/teams {Team:Red,team:red}
function game:init/teams {Team:Yellow,team:yellow}
function game:init/teams {Team:Green,team:green}

function game:init/mobs_scoreboards {mob:allay}
function game:init/mobs_scoreboards {mob:"allay"}
function game:init/mobs_scoreboards {mob:"axolotl"}
function game:init/mobs_scoreboards {mob:"bat"}
function game:init/mobs_scoreboards {mob:"bee"}
function game:init/mobs_scoreboards {mob:"blaze"}
function game:init/mobs_scoreboards {mob:"camel"}
function game:init/mobs_scoreboards {mob:"cat"}
function game:init/mobs_scoreboards {mob:"cave_spider"}
function game:init/mobs_scoreboards {mob:"chicken"}
function game:init/mobs_scoreboards {mob:"cod"}
function game:init/mobs_scoreboards {mob:"cow"}
function game:init/mobs_scoreboards {mob:"creeper"}
function game:init/mobs_scoreboards {mob:"dolphin"}
function game:init/mobs_scoreboards {mob:"donkey"}
function game:init/mobs_scoreboards {mob:"drowned"}
function game:init/mobs_scoreboards {mob:"elder_guardian"}
function game:init/mobs_scoreboards {mob:"enderman"}
function game:init/mobs_scoreboards {mob:"endermite"}
function game:init/mobs_scoreboards {mob:"evoker"}
function game:init/mobs_scoreboards {mob:"fox"}
function game:init/mobs_scoreboards {mob:"frog"}
function game:init/mobs_scoreboards {mob:"ghast"}
function game:init/mobs_scoreboards {mob:"glow_squid"}
function game:init/mobs_scoreboards {mob:"goat"}
function game:init/mobs_scoreboards {mob:"guardian"}
function game:init/mobs_scoreboards {mob:"horse"}
function game:init/mobs_scoreboards {mob:"hoglin"}
function game:init/mobs_scoreboards {mob:"husk"}
function game:init/mobs_scoreboards {mob:"iron_golem"}
function game:init/mobs_scoreboards {mob:"llama"}
function game:init/mobs_scoreboards {mob:"magma_cube"}
function game:init/mobs_scoreboards {mob:"mooshroom"}
function game:init/mobs_scoreboards {mob:"mule"}
function game:init/mobs_scoreboards {mob:"ocelot"}
function game:init/mobs_scoreboards {mob:"panda"}
function game:init/mobs_scoreboards {mob:"parrot"}
function game:init/mobs_scoreboards {mob:"phantom"}
function game:init/mobs_scoreboards {mob:"pig"}
function game:init/mobs_scoreboards {mob:"piglin"}
function game:init/mobs_scoreboards {mob:"piglin_brute"}
function game:init/mobs_scoreboards {mob:"pillager"}
function game:init/mobs_scoreboards {mob:"polar_bear"}
function game:init/mobs_scoreboards {mob:"pufferfish"}
function game:init/mobs_scoreboards {mob:"rabbit"}
function game:init/mobs_scoreboards {mob:"ravager"}
function game:init/mobs_scoreboards {mob:"salmon"}
function game:init/mobs_scoreboards {mob:"sheep"}
function game:init/mobs_scoreboards {mob:"shulker"}
function game:init/mobs_scoreboards {mob:"silverfish"}
function game:init/mobs_scoreboards {mob:"skeleton"}
function game:init/mobs_scoreboards {mob:"skeleton_horse "}
function game:init/mobs_scoreboards {mob:"slime"}
function game:init/mobs_scoreboards {mob:"snow_golem"}
function game:init/mobs_scoreboards {mob:"sniffer"}
function game:init/mobs_scoreboards {mob:"spider"}
function game:init/mobs_scoreboards {mob:"squid"}
function game:init/mobs_scoreboards {mob:"stray"}
function game:init/mobs_scoreboards {mob:"strider"}
function game:init/mobs_scoreboards {mob:"tadpole"}
function game:init/mobs_scoreboards {mob:"trader_llama"}
function game:init/mobs_scoreboards {mob:"tropical_fish"}
function game:init/mobs_scoreboards {mob:"turtle"}
function game:init/mobs_scoreboards {mob:"villager"}
function game:init/mobs_scoreboards {mob:"vindicator"}
function game:init/mobs_scoreboards {mob:"wandering_trader"}
function game:init/mobs_scoreboards {mob:"warden"}
function game:init/mobs_scoreboards {mob:"witch"}
function game:init/mobs_scoreboards {mob:"wither"}
function game:init/mobs_scoreboards {mob:"wither_skeleton"}
function game:init/mobs_scoreboards {mob:"wolf"}
function game:init/mobs_scoreboards {mob:"zoglin"}
function game:init/mobs_scoreboards {mob:"zombie"}
function game:init/mobs_scoreboards {mob:"zombie_horse"}
function game:init/mobs_scoreboards {mob:"zombie_villager"}
function game:init/mobs_scoreboards {mob:"zombified_piglin"}
function game:init/mobs_scoreboards {mob:"breeze"}
function game:init/mobs_scoreboards {mob:"bogged"}
function game:init/mobs_scoreboards {mob:"armadillo"}
function game:init/mobs_scoreboards {mob:"creaking"}
