# Take it Anywhere

*(formerly KeepInvEverywhere — the internal mod id `keepinveverywhere` is kept so existing
configs and saves keep working.)*

A Fabric mod that lets you **take your inventory AND your builds into any other world**: save
complete inventories into named slots, copy Axiom selections as named builds and paste them
anywhere. It also adds an independent *keep inventory on death* toggle, a clean GUI,
Mod Menu + Cloth Config integration, and English/German localization.

- **Minecraft:** 1.21.1 (Java 21, Fabric)
- **Author:** Bastian Klaus
- **License:** MIT

---

## Features

- **Named slots** — create, rename and delete inventory save slots from the GUI.
- **Save everything** — all **41 slots** (36 main + hotbar, 4 armor, 1 off-hand) are stored with
  exact slot positions, stack counts, durability, enchantments and full item data-components.
  Serialization uses Minecraft's official `ItemStack` codec, so saves are robust.
- **Cross-world load** — slots are stored **globally** in
  `.minecraft/config/keepinveverywhere/slots/`, *not* inside a world save, so you can load a slot
  saved in one world into a completely different world. Every item returns to its original slot
  (Elytra → chestplate slot, off-hand item → off-hand, hotbar positions preserved, …).
- **Keep inventory on death** — an independent toggle (works even when the vanilla `keepInventory`
  game rule is off); the rule is also respected when it *is* on. Optionally keeps XP too.
- **Builds / region copy (with Axiom)** — select an area with [Axiom](https://modrinth.com/mod/axiom)
  (any selection shape, including magic select), save it as a named build, and paste it into a
  completely different world. Includes block states and block entity data (chest contents, sign
  text); entities (armor stands, item frames, animals) can be enabled in Settings (off by default).
  No size limit — pasting is sliced across server ticks (~30 ms per tick) so even huge builds
  never freeze the game. **Selecting requires Axiom** (the GUI tells you so); *pasting* saved
  builds works without Axiom. Single-player only.
- **Polished GUI** — opened with a configurable keybind (default **K**), the **/kie** command,
  a small **KIE button in the pause menu (Esc)**, or from **Mod Menu**.
  Spacing, hover tooltips, and confirmation dialogs for destructive actions.
- **Cloth Config** settings page (toggles + language mode).
- **Localization** — full `en_us` and `de_de`. The UI auto-follows the game language (German →
  German); a manual override in Settings can force English or German regardless of game locale.
- **Robust** — loading into an occupied inventory asks for confirmation; items that don't exist in
  the target version (e.g. removed/modded items) are skipped and counted instead of crashing;
  on a server without the mod the GUI fails safe with a notice.

---

## Build

Requirements: **JDK 21** (the build targets Java 21).

```bash
./gradlew build
```

The finished jar is written to **`build/libs/keepinveverywhere-1.0.0.jar`**
(ignore the `-sources.jar`). The first build downloads Minecraft, Yarn mappings, Fabric API,
Mod Menu and Cloth Config, so it needs network access.

To launch a dev client for testing:

```bash
./gradlew runClient
```

---

## Install

1. Install **Fabric Loader** for Minecraft 1.21.1.
2. Put these jars in your `.minecraft/mods/` folder:
   - `keepinveverywhere-1.0.0.jar`
   - **Fabric API** (required)
   - **Cloth Config** (required — used for settings + persistence)
   - **Mod Menu** (optional — adds a GUI entry in the mods list)
3. Launch the game.

---

## Usage

| Action | How |
| --- | --- |
| Open the GUI | Press **K** (rebind in *Options → Controls*), type **/kie**, click **KIE** in the pause menu, or open it from **Mod Menu** |
| Save inventory | *Save current inventory…* → type a name → confirm |
| Load into another world | Open the GUI in the other world → select a slot → *Load* |
| Rename / Delete | Select a slot → *Rename* / *Delete* (delete asks for confirmation) |
| Keep inventory on death | Toggle the *Keep Inventory* button, or set it in *Settings* |
| Save a build | Make a selection with **Axiom** → GUI → *Builds (Axiom)…* → *Save Axiom selection…* |
| Paste a build in another world | GUI → *Builds (Axiom)…* → select build → *Paste* (centered on you) |
| Change language / options | *Settings* (Cloth Config page) |

Build storage lives in `.minecraft/config/keepinveverywhere/regions/` (global, like the
inventory slots). The Axiom integration reads the selection via reflection from
`com.moulberry.axiom.clipboard.Selection`, which is stable across Axiom 4.3.3 – 5.x; if a future
Axiom version changes it, the mod degrades gracefully to "no selection" instead of crashing.

Notes:
- Saving and editing slots work entirely on the client. **Loading** is applied by the server so it
  works correctly in survival; in single-player this is the integrated server and is automatic.
- On a multiplayer server **without** the mod installed server-side, loading is disabled (the GUI
  shows a notice). Saving/listing still work locally.

---

## Building for other Minecraft versions

This source is written and verified against **1.21.1**. For most 1.21.x releases up to **1.21.4**
you can simply swap the five version values at the top of [`gradle.properties`](gradle.properties)
(`minecraft_version`, `yarn_mappings`, `loader_version`, `fabric_version`, and the
`modmenu_version` / `cloth_config_version`) and rebuild.

**1.21.5 and newer** changed several Mojang NBT/codec APIs (most notably `NbtCompound#getInt` now
returns an `Optional`), so a plain property swap will not compile there without small adjustments in
[`InventorySnapshot.java`](src/main/java/net/bastianklaus/keepinveverywhere/data/InventorySnapshot.java)
(the `getInt`/`getList` calls). The clean way to ship one codebase across that boundary is the
[Stonecutter](https://stonecutter.kikugie.dev/) Gradle plugin, which lets you guard the few
divergent lines with version conditionals and emit a jar per target.

---

## Assumptions

- Full functionality targets **single-player**; multiplayer is fail-safe only (loading needs the mod
  server-side).
- `keepXp` is best-effort and off by default.
- Cloth Config is treated as a required dependency because the config is persisted via its
  AutoConfig serializer.
