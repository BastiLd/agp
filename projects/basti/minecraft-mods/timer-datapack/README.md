# Minecraft Timer Datapack (BastiGHG Style)

This datapack adds a timer functionality to Minecraft, exactly like BastiGHG's timer system.

## Installation

1. Download the datapack
2. Place it in your world's `datapacks` folder
3. In-game, type `/reload` to load the datapack

## Commands

### Timer Commands

- `/timer start` - Starts a 5-minute (300 seconds) timer
- `/timer stop` - Stops the timer
- `/timer reset` - Resets the timer to 0
- `/timer reverse` - Reverses the timer direction
- `/timer color` - Cycles through different color themes:
  - Gold/Yellow (Default)
  - Aqua/Light Purple
  - Green/Lime
  - Red/Dark Red
  - Blue/Dark Purple
  - Light Blue/Cyan
- `/timer set <seconds>` - Sets a custom time (e.g., `/timer set 120` for 2 minutes)

## Features

- Visual timer display in Xd Xh Xm Xs format in the action bar
- Multiple color themes with bold "glow" effect
- Automatic countdown
- Ability to reverse timer direction
- Custom time setting
- Notification when timer finishes
- Easy to use with simple commands

## Example Usage

1. Start a 5-minute timer:

   ```
   /timer start
   ```

2. Change color theme:

   ```
   /timer color
   ```

3. Set custom time (e.g., 2 minutes):

   ```
   /timer set 120
   ```

4. Reverse timer:

   ```
   /timer reverse
   ```

5. Stop timer:

   ```
   /timer stop
   ```

6. Reset timer:
   ```
   /timer reset
   ```

## Technical Details

The timer uses scoreboard objectives to track time and runs every game tick. The timer is displayed to all players in real-time in days:hours:minutes:seconds format.
