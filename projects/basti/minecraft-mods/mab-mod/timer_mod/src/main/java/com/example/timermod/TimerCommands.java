package com.example.timermod;

import com.mojang.brigadier.CommandDispatcher;
import com.mojang.brigadier.arguments.IntegerArgumentType;
import com.mojang.brigadier.arguments.StringArgumentType;
import net.minecraft.command.CommandRegistryAccess;
import net.minecraft.server.command.CommandManager;
import net.minecraft.server.command.ServerCommandSource;
import net.minecraft.text.Text;
import net.minecraft.server.network.ServerPlayerEntity;

public class TimerCommands {
    
    private static TimerManager timerManager = new TimerManager();
    
    public static void registerCommands(CommandDispatcher<ServerCommandSource> dispatcher) {
        dispatcher.register(CommandManager.literal("timer")
            .then(CommandManager.literal("start")
                .executes(context -> {
                    ServerPlayerEntity player = context.getSource().getPlayer();
                    if (player != null) {
                        return startTimer(player);
                    }
                    return 0;
                }))
            .then(CommandManager.literal("stop")
                .executes(context -> {
                    ServerPlayerEntity player = context.getSource().getPlayer();
                    if (player != null) {
                        return stopTimer(player);
                    }
                    return 0;
                }))
            .then(CommandManager.literal("resume")
                .executes(context -> {
                    ServerPlayerEntity player = context.getSource().getPlayer();
                    if (player != null) {
                        return resumeTimer(player);
                    }
                    return 0;
                }))
            .then(CommandManager.literal("set")
                .then(CommandManager.argument("days", IntegerArgumentType.integer(0))
                .then(CommandManager.argument("hours", IntegerArgumentType.integer(0, 23))
                .then(CommandManager.argument("minutes", IntegerArgumentType.integer(0, 59))
                .then(CommandManager.argument("seconds", IntegerArgumentType.integer(0, 59))
                .executes(context -> {
                    ServerPlayerEntity player = context.getSource().getPlayer();
                    if (player != null) {
                        int days = IntegerArgumentType.getInteger(context, "days");
                        int hours = IntegerArgumentType.getInteger(context, "hours");
                        int minutes = IntegerArgumentType.getInteger(context, "minutes");
                        int seconds = IntegerArgumentType.getInteger(context, "seconds");
                        return setTimer(player, days, hours, minutes, seconds);
                    }
                    return 0;
                }))))
            .then(CommandManager.literal("color")
                .then(CommandManager.argument("color", StringArgumentType.word())
                .executes(context -> {
                    ServerPlayerEntity player = context.getSource().getPlayer();
                    if (player != null) {
                        String color = StringArgumentType.getString(context, "color");
                        return setColor(player, color);
                    }
                    return 0;
                })))
            .then(CommandManager.literal("countdown")
                .then(CommandManager.argument("days", IntegerArgumentType.integer(0))
                .then(CommandManager.argument("hours", IntegerArgumentType.integer(0, 23))
                .then(CommandManager.argument("minutes", IntegerArgumentType.integer(0, 59))
                .then(CommandManager.argument("seconds", IntegerArgumentType.integer(0, 59))
                .executes(context -> {
                    ServerPlayerEntity player = context.getSource().getPlayer();
                    if (player != null) {
                        int days = IntegerArgumentType.getInteger(context, "days");
                        int hours = IntegerArgumentType.getInteger(context, "hours");
                        int minutes = IntegerArgumentType.getInteger(context, "minutes");
                        int seconds = IntegerArgumentType.getInteger(context, "seconds");
                        return countdown(player, days, hours, minutes, seconds);
                    }
                    return 0;
                }))))
            .then(CommandManager.literal("help")
                .executes(context -> {
                    ServerPlayerEntity player = context.getSource().getPlayer();
                    if (player != null) {
                        return showHelp(player);
                    }
                    return 0;
                })));
    }
    
    private static int startTimer(ServerPlayerEntity player) {
        if (timerManager.isRunning()) {
            player.sendMessage(Text.literal("Timer is already running!").formatted(net.minecraft.util.Formatting.RED));
            return 0;
        }
        
        if (!timerManager.isSet()) {
            player.sendMessage(Text.literal("Please set a timer first using /timer set!").formatted(net.minecraft.util.Formatting.RED));
            return 0;
        }
        
        timerManager.start();
        player.sendMessage(Text.literal("Timer started!").formatted(net.minecraft.util.Formatting.GREEN));
        return 1;
    }
    
    private static int stopTimer(ServerPlayerEntity player) {
        if (!timerManager.isRunning()) {
            player.sendMessage(Text.literal("Timer is not running!").formatted(net.minecraft.util.Formatting.RED));
            return 0;
        }
        
        timerManager.stop();
        player.sendMessage(Text.literal("Timer stopped!").formatted(net.minecraft.util.Formatting.YELLOW));
        return 1;
    }
    
    private static int resumeTimer(ServerPlayerEntity player) {
        if (timerManager.isRunning()) {
            player.sendMessage(Text.literal("Timer is already running!").formatted(net.minecraft.util.Formatting.RED));
            return 0;
        }
        
        if (!timerManager.isSet()) {
            player.sendMessage(Text.literal("No timer to resume!").formatted(net.minecraft.util.Formatting.RED));
            return 0;
        }
        
        timerManager.resume();
        player.sendMessage(Text.literal("Timer resumed!").formatted(net.minecraft.util.Formatting.GREEN));
        return 1;
    }
    
    private static int setTimer(ServerPlayerEntity player, int days, int hours, int minutes, int seconds) {
        timerManager.stop();
        timerManager.set(days, hours, minutes, seconds);
        
        String timeStr = formatTime(days, hours, minutes, seconds);
        player.sendMessage(Text.literal("Timer set to " + timeStr).formatted(net.minecraft.util.Formatting.GREEN));
        return 1;
    }
    
    private static int setColor(ServerPlayerEntity player, String color) {
        if (timerManager.setColor(color)) {
            player.sendMessage(Text.literal("Timer color set to " + color).formatted(net.minecraft.util.Formatting.GREEN));
        } else {
            player.sendMessage(Text.literal("Invalid color! Available: dark_green, green, blue, light_blue, red, yellow, orange, purple, pink, white, gray, dark_gray, black").formatted(net.minecraft.util.Formatting.YELLOW));
        }
        return 1;
    }
    
    private static int countdown(ServerPlayerEntity player, int days, int hours, int minutes, int seconds) {
        timerManager.stop();
        timerManager.set(days, hours, minutes, seconds);
        timerManager.start();
        
        String timeStr = formatTime(days, hours, minutes, seconds);
        player.sendMessage(Text.literal("Countdown started for " + timeStr + "!").formatted(net.minecraft.util.Formatting.GREEN));
        return 1;
    }
    
    private static int showHelp(ServerPlayerEntity player) {
        player.sendMessage(Text.literal("=== Timer Commands ===").formatted(net.minecraft.util.Formatting.GOLD, net.minecraft.util.Formatting.BOLD));
        player.sendMessage(Text.literal("/timer start - Start the timer"));
        player.sendMessage(Text.literal("/timer resume - Resume a paused timer"));
        player.sendMessage(Text.literal("/timer stop - Stop/pause the timer"));
        player.sendMessage(Text.literal("/timer set [d] [h] [m] [s] - Set timer time"));
        player.sendMessage(Text.literal("/timer color [color] - Set display color"));
        player.sendMessage(Text.literal("/timer countdown [d] [h] [m] [s] - Set and start timer"));
        player.sendMessage(Text.literal("/timer help - Show this help"));
        return 1;
    }
    
    private static String formatTime(int days, int hours, int minutes, int seconds) {
        StringBuilder sb = new StringBuilder();
        if (days > 0) sb.append(days).append("d ");
        if (hours > 0 || days > 0) sb.append(hours).append("h ");
        if (minutes > 0 || hours > 0 || days > 0) sb.append(minutes).append("m ");
        sb.append(seconds).append("s");
        return sb.toString();
    }
}
