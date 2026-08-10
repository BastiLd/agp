# Timer Datapack

A standalone timer datapack for Minecraft that provides countdown functionality with customizable colors.

## Installation

1. Download the `timer_datapack` folder
2. Place it in your world's `datapacks` folder
3. Run `/reload` in-game or restart the server
4. The timer system will automatically load

## Commands

The timer provides the following commands:

### `/timer start`
Starts the timer countdown. The timer must be set first using `/timer set`.

### `/timer resume`
Resumes a paused timer.

### `/timer stop`
Stops/pauses the current timer.

### `/timer set [days] [hours] [minutes] [seconds]`
Sets the timer to a specific time.
- All parameters are optional
- Example: `/timer set 1 2 30 45` sets 1 day, 2 hours, 30 minutes, 45 seconds
- Example: `/timer set 0 0 5 0` sets 5 minutes

### `/timer color [color]`
Sets the color of the timer display.
- Available colors: `dark_green`, `green`, `blue`, `light_blue`, `red`, `yellow`, `orange`, `purple`, `pink`, `white`, `gray`, `dark_gray`, `black`
- Example: `/timer color red`

### `/timer countdown [days] [hours] [minutes] [seconds]`
Sets a timer and starts it immediately.
- Same parameters as `/timer set`
- Example: `/timer countdown 0 0 10 0` starts a 10-minute countdown

## Setting Up Commands

To use the timer commands, you need to set up command blocks or use function calls:

### Method 1: Function Calls (Recommended)

```mcfunction
# Start timer
function timer:start

# Resume timer
function timer:resume

# Stop timer
function timer:stop

# Set timer (5 minutes)
scoreboard players set days timer 0
scoreboard players set hours timer 0
scoreboard players set minutes timer 5
scoreboard players set seconds timer 0
function timer:set

# Set color
scoreboard players set color timer_color red
function timer:color

# Start countdown (10 minutes)
scoreboard players set days timer 0
scoreboard players set hours timer 0
scoreboard players set minutes timer 10
scoreboard players set seconds timer 0
function timer:countdown
```

### Method 2: Parameter-Based Functions

```mcfunction
# Set timer with parameters
function timer:commands/set_with_params {days:0,hours:0,minutes:5,seconds:0}

# Start countdown with parameters
function timer:commands/countdown_with_params {days:0,hours:0,minutes:10,seconds:0}

# Set color with parameters
function timer:commands/color_with_params {color:red}
```

## Features

- **Countdown Display**: Shows time remaining in the actionbar
- **Color Customization**: Change the display color
- **Pause/Resume**: Stop and resume timers
- **Multiple Time Units**: Support for days, hours, minutes, and seconds
- **Automatic Formatting**: Displays only relevant time units
- **Sound Notification**: Plays a sound when timer finishes

## Technical Details

The timer uses scoreboards to track time:
- `timer` objective: Stores days, hours, minutes, seconds
- `timer_state` objective: Tracks if timer is running (1) or stopped (0)
- `timer_color` objective: Stores the display color

## Example Usage

1. Set a 5-minute timer:
   ```mcfunction
   scoreboard players set days timer 0
   scoreboard players set hours timer 0
   scoreboard players set minutes timer 5
   scoreboard players set seconds timer 0
   function timer:set
   ```

2. Start the timer:
   ```mcfunction
   function timer:start
   ```

3. Change color to red:
   ```mcfunction
   scoreboard players set color timer_color red
   function timer:color
   ```

4. Pause the timer:
   ```mcfunction
   function timer:stop
   ```

5. Resume the timer:
   ```mcfunction
   function timer:resume
   ```

6. Start a 10-minute countdown immediately:
   ```mcfunction
   scoreboard players set days timer 0
   scoreboard players set hours timer 0
   scoreboard players set minutes timer 10
   scoreboard players set seconds timer 0
   function timer:countdown
   ```

## Notes

- The timer will automatically stop when it reaches zero
- Invalid time values are automatically corrected
- The timer displays in the actionbar for all players
- When the timer finishes, it shows a "Timer Finished!" message and plays a sound
- You can also use `function timer:help` to see all available commands

## Command Block Setup

To use actual `/timer` commands, you can set up command blocks:

1. Place a command block
2. Set it to "Always Active" and "Repeat"
3. Enter the command: `function timer:command_handler`
4. The command block will handle `/timer` commands automatically
