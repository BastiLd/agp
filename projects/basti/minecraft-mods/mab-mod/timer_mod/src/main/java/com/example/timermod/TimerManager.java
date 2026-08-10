package com.example.timermod;

import net.minecraft.text.Text;
import net.minecraft.server.network.ServerPlayerEntity;
import net.minecraft.sound.SoundEvents;
import net.minecraft.sound.SoundCategory;
import net.minecraft.util.Formatting;

import java.util.HashMap;
import java.util.Map;

public class TimerManager {
    
    private static TimerManager instance;
    private int days = 0;
    private int hours = 0;
    private int minutes = 0;
    private int seconds = 0;
    private boolean running = false;
    private String color = "dark_green";
    private int tickCounter = 0;
    
    private static final Map<String, Formatting> VALID_COLORS = new HashMap<>();
    
    static {
        VALID_COLORS.put("dark_green", Formatting.DARK_GREEN);
        VALID_COLORS.put("green", Formatting.GREEN);
        VALID_COLORS.put("blue", Formatting.BLUE);
        VALID_COLORS.put("light_blue", Formatting.AQUA);
        VALID_COLORS.put("red", Formatting.RED);
        VALID_COLORS.put("yellow", Formatting.YELLOW);
        VALID_COLORS.put("orange", Formatting.GOLD);
        VALID_COLORS.put("purple", Formatting.LIGHT_PURPLE);
        VALID_COLORS.put("pink", Formatting.LIGHT_PURPLE);
        VALID_COLORS.put("white", Formatting.WHITE);
        VALID_COLORS.put("gray", Formatting.GRAY);
        VALID_COLORS.put("dark_gray", Formatting.DARK_GRAY);
        VALID_COLORS.put("black", Formatting.BLACK);
    }
    
    public TimerManager() {
        instance = this;
    }
    
    public static TimerManager getInstance() {
        if (instance == null) {
            instance = new TimerManager();
        }
        return instance;
    }
    
    public void set(int days, int hours, int minutes, int seconds) {
        this.days = Math.max(0, days);
        this.hours = Math.max(0, Math.min(23, hours));
        this.minutes = Math.max(0, Math.min(59, minutes));
        this.seconds = Math.max(0, Math.min(59, seconds));
    }
    
    public void start() {
        if (isSet()) {
            running = true;
            tickCounter = 0;
        }
    }
    
    public void stop() {
        running = false;
    }
    
    public void resume() {
        if (isSet()) {
            running = true;
        }
    }
    
    public boolean isRunning() {
        return running;
    }
    
    public boolean isSet() {
        return days > 0 || hours > 0 || minutes > 0 || seconds > 0;
    }
    
    public boolean setColor(String color) {
        if (VALID_COLORS.containsKey(color.toLowerCase())) {
            this.color = color.toLowerCase();
            return true;
        }
        return false;
    }
    
    public void onServerTick() {
        if (running) {
            tickCounter++;
            
            // Countdown every 20 ticks (1 second)
            if (tickCounter >= 20) {
                tickCounter = 0;
                countdown();
            }
        }
    }
    
    private void countdown() {
        if (seconds > 0) {
            seconds--;
        } else if (minutes > 0) {
            minutes--;
            seconds = 59;
        } else if (hours > 0) {
            hours--;
            minutes = 59;
            seconds = 59;
        } else if (days > 0) {
            days--;
            hours = 23;
            minutes = 59;
            seconds = 59;
        } else {
            // Timer finished
            running = false;
            notifyTimerFinished();
        }
        
        // Update display
        updateDisplay();
    }
    
    private void updateDisplay() {
        // This would send the timer display to all players
        // In a real implementation, you'd use packets to send to clients
        String timeStr = formatTime();
        // Send actionbar message to all players
        // This is a simplified version - in reality you'd need to handle this differently
    }
    
    private void notifyTimerFinished() {
        // Play sound and show message to all players
        // In a real implementation, you'd iterate through all players
        // and send them the finished message and sound
    }
    
    private String formatTime() {
        StringBuilder sb = new StringBuilder();
        if (days > 0) sb.append(days).append("d ");
        if (hours > 0 || days > 0) sb.append(hours).append("h ");
        if (minutes > 0 || hours > 0 || days > 0) sb.append(minutes).append("m ");
        sb.append(seconds).append("s");
        return sb.toString();
    }
    
    public int getDays() { return days; }
    public int getHours() { return hours; }
    public int getMinutes() { return minutes; }
    public int getSeconds() { return seconds; }
    public String getColor() { return color; }
}
