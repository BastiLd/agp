# Timer Mod for Minecraft 1.21.1 (Fabric)

A Fabric mod that adds timer commands to Minecraft.

## Commands

- `/timer start` - Start the timer
- `/timer stop` - Stop the timer
- `/timer resume` - Resume the timer
- `/timer set [days] [hours] [minutes] [seconds]` - Set timer time
- `/timer color [color]` - Set display color
- `/timer countdown [days] [hours] [minutes] [seconds]` - Set and start timer
- `/timer help` - Show help

## Building the Mod

### Prerequisites

- Java 17 or higher
- Gradle
- Minecraft 1.21.1 Fabric MDK

### Build Steps

1. **Set up the development environment:**

   ```bash
   # Download the Fabric MDK for 1.21.1
   # Place this mod code in the MDK directory
   ```

2. **Build the mod:**

   ```bash
   ./gradlew build
   ```

3. **Find the built mod:**
   The compiled mod will be in `build/libs/timermod-1.0.0.jar`

4. **Install the mod:**
   - Place the `.jar` file in your Minecraft `mods` folder
   - Make sure you have Fabric Loader 1.21.1 installed

## Development Notes

This mod provides the exact `/timer` commands you requested. The mod structure includes:

- `TimerMod.java` - Main mod class (implements ModInitializer)
- `TimerCommands.java` - Command registration and handling
- `TimerManager.java` - Timer logic and state management

## Usage Examples

```
/timer set 0 0 5 0    # Set 5 minutes
/timer start           # Start the timer
/timer color red       # Change color to red
/timer stop            # Pause the timer
/timer resume          # Resume the timer
/timer countdown 0 0 10 0  # Start 10-minute countdown
```

## Important Notes

- This is a **basic mod structure** - you'll need to compile it yourself
- The mod requires **Fabric Loader 1.21.1** to run
- You need **Java programming knowledge** to complete and compile this mod
- The mod files are provided as a starting point - you may need to adjust imports and dependencies based on your specific Fabric MDK setup

## Next Steps

1. Download the Fabric MDK for Minecraft 1.21.1
2. Replace the example mod files with these timer mod files
3. Adjust the build.gradle and fabric.mod.json as needed
4. Compile using `./gradlew build`
5. Test the mod in a development environment
6. Install the compiled .jar file in your Minecraft mods folder

## Fabric vs Forge

This mod is built for **Fabric**, not Forge. Fabric is a lightweight modding platform that's often preferred for its simplicity and performance.
