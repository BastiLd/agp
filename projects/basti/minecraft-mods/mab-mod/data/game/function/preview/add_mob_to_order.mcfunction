
$data modify storage $(team)mob_order $(mob) set value $(index)


$execute store result score $(Team)_$(mob) preview run data get storage $(team)mob_order $(mob) 1