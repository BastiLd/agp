$execute if score display_$(Team)Team wave_number matches 1 run execute if score battle timer matches 1 run title @a[team=$(team)] actionbar {"text":"Wave 1","bold":true,"color":"$(opponent)"}
$execute if score display_$(Team)Team wave_number matches 2 run execute if score battle timer matches 1 run title @a[team=$(team)] actionbar {"text":"Wave 2","bold":true,"color":"$(opponent)"}
$execute if score display_$(Team)Team wave_number matches 3 run execute if score battle timer matches 1 run title @a[team=$(team)] actionbar {"text":"Wave 3","bold":true,"color":"$(opponent)"}

