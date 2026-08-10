# Prompt: KeepInventory Fabric Mod (cross-world inventory slots)

You are an expert Minecraft mod developer. Build a complete, compiling Fabric mod in Java.

## Target / build
- Mod loader: Fabric (Fabric Loader + Fabric API).
- Primary Minecraft version: 1.21.1, Java 21, Gradle with Fabric Loom, Yarn mappings.
- IMPORTANT versioning goal: ship ONE jar that supports as wide a Minecraft version range as is technically feasible. If a single jar cannot safely span the needed versions (due to mapping/data-component changes), fall back to a MAXIMUM of 3 jars (one per version range), but never more. Always include working 1.21.1 support.
- 1.21.x uses the Data Components system (not legacy NBT tags). Serialize ItemStacks via official codecs / DataComponent serialization so saves are robust and version-safe.
- Output the built jar(s) in build/libs and include exact build instructions (./gradlew build).

## Core features
1. KeepInventory toggle: let the player enable/disable a vanilla-style "keep inventory on death" behavior from the mod's GUI (independent toggle, also reflect/respect the keepInventory gamerule where relevant). Persist the setting.
2. Polished UI/UX/GUI: a clean, modern, intuitive screen. Opened via a configurable keybind AND reachable from a menu. Good spacing, clear buttons, hover tooltips, confirmation dialogs for destructive actions. Integrate with Mod Menu, and use Cloth Config (or an equivalent clean config screen) if helpful.
3. Named slots: the player can create, rename, and delete named inventory save slots from the GUI.
4. Save inventory: save the player's COMPLETE current inventory into a named slot — all 41 slots (36 main inventory incl. hotbar, offhand, 4 armor slots), preserving exact slot position, stack counts, durability, enchantments and full item components/NBT.
5. Cross-world load: in a DIFFERENT world, load a saved slot and restore every item to its ORIGINAL slot — e.g. the Elytra goes back in the chestplate slot, the item that was in the off-hand returns to the off-hand, hotbar items keep their positions, etc.

## Cross-world persistence
- Store slot data GLOBALLY (e.g. .minecraft/config/<modid>/slots/), NOT inside per-world saves, so snapshots are available across all single-player worlds.

## Localization
- Default language: English (en_us).
- Auto-detect the game language: if the client locale is German, switch the mod's UI to de_de; otherwise stay English.
- Also provide a manual language setting in the mod config so the user can force English or German regardless of game locale.
- Provide complete lang files: en_us.json and de_de.json.

## Robustness / edge cases
- On load into a full/occupied inventory: warn and ask before overwriting.
- Gracefully skip items that don't exist in the target version (e.g. modded items) instead of crashing.
- Don't crash on multiplayer servers; focus functionality on single-player but fail safe elsewhere.

## Deliverables
- Full source tree (fabric.mod.json, mixins if needed, build.gradle, gradle wrapper, assets/lang files).
- Clear README: how to build, where the jar lands, how to install, how to use each feature.
- Code should compile and run. State any assumptions you make.
