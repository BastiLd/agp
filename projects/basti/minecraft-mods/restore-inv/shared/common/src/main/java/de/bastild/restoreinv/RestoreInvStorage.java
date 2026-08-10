package de.bastild.restoreinv;

import net.minecraft.server.network.ServerPlayerEntity;
import net.minecraft.server.MinecraftServer;
import net.minecraft.item.ItemStack;
import net.minecraft.item.Items;
import net.minecraft.nbt.NbtCompound;
import net.minecraft.nbt.NbtIo;
import net.minecraft.registry.RegistryWrapper;
import net.minecraft.screen.SimpleNamedScreenHandlerFactory;
import net.minecraft.screen.GenericContainerScreenHandler;
import net.minecraft.screen.ScreenHandler;
import net.minecraft.text.Text;
import net.minecraft.component.DataComponentTypes;
import net.minecraft.component.type.LoreComponent;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.IOException;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.Duration;
import java.time.Instant;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Zentrale Save-/Restore-Logik. Persistiert pro Spieler:
 *   - aktuelle Inventar-Snapshots fuer 3 Slots (Slot 1 = autosave 1, Slot 2 = autosave 2, Slot 3 = manuell / death),
 *   - Ringpuffer der letzten N Saves pro Slot mit Zeitstempel + Pin-Flag.
 *
 * Globale Konfiguration in restoreinv/config.dat. Pro-Spieler-Preview-Setting
 * ebenfalls in config.dat.
 */
public class RestoreInvStorage {

    private static final Logger LOGGER = LoggerFactory.getLogger("restoreinv");

    // Slot-Belegung: 0 = Auto kurz, 1 = Auto lang, 2 = Manuell, 3 = Tod.
    public static final int SLOT_AUTO1  = 0;
    public static final int SLOT_AUTO2  = 1;
    public static final int SLOT_MANUAL = 2;
    public static final int SLOT_DEATH  = 3;
    public static final int SLOTS = 4;
    public static final int DEFAULT_SAVES_PER_SLOT = 3;
    public static final int MAX_SAVES_PER_SLOT = 9; // GUI-Beschraenkung: 9-breiter Chest
    private static final String SAVE_DIR = "restoreinv";

    /**
     * Format-Version der persistierten Daten. Wird in last_saves.dat (__format) und
     * restoreinv.json (format) geschrieben. Fehlt der Marker, gelten die Daten als
     * Legacy (Format 1) und werden abwaertskompatibel gelesen - es wird nie etwas
     * geloescht, sodass Saves ein Mod-Update immer ueberstehen.
     */
    public static final int CURRENT_DATA_FORMAT = 2;

    /** Sprechender Name eines Slots fuer GUI/Chat (uebersetzbar, client-seitig aufgeloest). */
    public static Text slotName(int slot) {
        switch (slot) {
            case SLOT_AUTO1:  return Text.translatable("restoreinv.slot.auto1");
            case SLOT_AUTO2:  return Text.translatable("restoreinv.slot.auto2");
            case SLOT_MANUAL: return Text.translatable("restoreinv.slot.manual");
            case SLOT_DEATH:  return Text.translatable("restoreinv.slot.death");
            default:          return Text.translatable("restoreinv.slot.generic", slot + 1);
        }
    }

    // ======== Snapshot-Datenstruktur ============================================
    public static final class Save {
        public final ItemStack[] stacks;
        public final long timestampMillis;
        public boolean pinned;

        public Save(ItemStack[] stacks, long timestampMillis, boolean pinned) {
            this.stacks = stacks;
            this.timestampMillis = timestampMillis;
            this.pinned = pinned;
        }

        public Save copyImmutable() {
            ItemStack[] copy = new ItemStack[stacks.length];
            for (int i = 0; i < stacks.length; i++) {
                copy[i] = stacks[i] == null ? ItemStack.EMPTY : stacks[i].copy();
            }
            return new Save(copy, timestampMillis, pinned);
        }
    }

    // ======== State =============================================================
    private final Map<UUID, ItemStack[][]> playerInventories = new ConcurrentHashMap<>();
    private final Map<UUID, List<List<Save>>> lastSaves = new ConcurrentHashMap<>();
    private final Map<UUID, Boolean> previewEnabled = new ConcurrentHashMap<>();
    /** Pre-Restore-Snapshot je Spieler fuer /restoreinv undo. */
    private final Map<UUID, ItemStack[]> undoSnapshots = new ConcurrentHashMap<>();

    /** Single-Thread-Executor: NBT-Serialisierung + Datei-I/O laufen abseits des Server-Threads. */
    private final java.util.concurrent.ExecutorService ioExecutor =
            java.util.concurrent.Executors.newSingleThreadExecutor(r -> {
                Thread t = new Thread(r, "RestoreInv-IO");
                t.setDaemon(true);
                return t;
            });

    // ======== Globale Settings ==================================================
    public int autoSaveInterval1 = 1;
    public int autoSaveInterval2 = 5;
    public boolean showSaveMessages = true;
    public boolean playRestoreSound = true;
    public boolean requireOpForRestore = false;
    public boolean autoSaveOnDeath = true;
    public int savesPerSlot = DEFAULT_SAVES_PER_SLOT;

    // ============================================================================
    // NBT-Serialisierung laeuft ueber PlatformCompat (versionsspezifisch).
    // ============================================================================
    private static NbtCompound writeStacksToNbt(ItemStack[] inv, RegistryWrapper.WrapperLookup lookup) {
        return PlatformCompat.writeStacks(inv, lookup);
    }

    private static ItemStack[] readStacksFromNbt(NbtCompound nbt, RegistryWrapper.WrapperLookup lookup) {
        return PlatformCompat.readStacks(nbt, lookup);
    }

    // ============================================================================
    // Inventar-Snapshot machen / wiederherstellen
    // ============================================================================
    public void saveInventory(ServerPlayerEntity player, int slot) {
        if (slot < 0 || slot >= SLOTS) return;

        UUID playerId = player.getUuid();
        ItemStack[][] inventories = playerInventories.computeIfAbsent(playerId, k -> new ItemStack[SLOTS][]);

        ItemStack[] combined = PlatformCompat.captureInventory(player.getInventory());
        inventories[slot] = combined;

        // Ringpuffer: neuesten Save vorne anhaengen, gepinnte Saves NIE rauskippen.
        List<List<Save>> slotSaves = lastSaves.computeIfAbsent(playerId, k -> new ArrayList<>(SLOTS));
        while (slotSaves.size() <= slot) {
            slotSaves.add(new ArrayList<>());
        }
        List<Save> savesList = slotSaves.get(slot);
        ItemStack[] copy = new ItemStack[combined.length];
        for (int i = 0; i < combined.length; i++) copy[i] = combined[i].copy();
        savesList.add(0, new Save(copy, System.currentTimeMillis(), false));
        trimRingBuffer(savesList);

        RegistryWrapper.WrapperLookup lookup = PlatformCompat.registryLookup(player);
        saveToFile(playerId, slot, combined, lookup);
        saveLastSavesToFile(playerId, lookup);

        if (showSaveMessages) {
            player.sendMessage(Text.translatable("restoreinv.msg.saved", slotName(slot)), false);
        }
    }

    private void trimRingBuffer(List<Save> savesList) {
        // Entfernt von hinten (= aelteste) so lange wir ueber dem Limit sind und
        // ueberspringt gepinnte Eintraege. Wenn ALLE gepinnt sind und voll: keine Aenderung.
        int limit = Math.max(1, Math.min(MAX_SAVES_PER_SLOT, savesPerSlot));
        for (int i = savesList.size() - 1; i >= 0 && savesList.size() > limit; i--) {
            Save candidate = savesList.get(i);
            if (!candidate.pinned) {
                savesList.remove(i);
            }
        }
    }

    /** Wendet das aktuelle savesPerSlot-Limit sofort auf alle vorhandenen Ringpuffer an. */
    public void trimAllBuffers() {
        for (List<List<Save>> slots : lastSaves.values()) {
            for (List<Save> list : slots) {
                trimRingBuffer(list);
            }
        }
    }

    public void restoreInventory(ServerPlayerEntity player, int slot) {
        if (slot < 0 || slot >= SLOTS) return;
        UUID playerId = player.getUuid();
        ItemStack[][] inventories = playerInventories.get(playerId);
        if (inventories == null || inventories[slot] == null) {
            ItemStack[] loaded = loadFromFile(playerId, slot, PlatformCompat.registryLookup(player));
            if (loaded == null) return;
            inventories = playerInventories.computeIfAbsent(playerId, k -> new ItemStack[SLOTS][]);
            inventories[slot] = loaded;
        }
        ItemStack[] saved = inventories[slot];
        if (saved == null) return;
        captureUndo(player);
        applyToPlayer(player, saved);
        playRestoreSoundIfEnabled(player);
    }

    public void restoreInventoryFromSave(ServerPlayerEntity player, int slot, int saveIndex) {
        UUID playerId = player.getUuid();
        List<List<Save>> slotSaves = lastSaves.get(playerId);
        if (slotSaves == null || slot < 0 || slot >= slotSaves.size()) return;
        List<Save> savesList = slotSaves.get(slot);
        if (savesList == null || saveIndex < 0 || saveIndex >= savesList.size()) return;
        Save s = savesList.get(saveIndex);
        if (s == null || s.stacks == null) return;
        captureUndo(player);
        applyToPlayer(player, s.stacks);
        playRestoreSoundIfEnabled(player);
    }

    /** Sichert das aktuelle Inventar, damit ein Restore via {@link #restoreUndo} ruecknehmbar ist. */
    private void captureUndo(ServerPlayerEntity player) {
        undoSnapshots.put(player.getUuid(), PlatformCompat.captureInventory(player.getInventory()));
    }

    /** Macht den letzten Restore rueckgaengig. true, wenn ein Undo-Snapshot vorlag. */
    public boolean restoreUndo(ServerPlayerEntity player) {
        ItemStack[] snap = undoSnapshots.remove(player.getUuid());
        if (snap == null) return false;
        applyToPlayer(player, snap);
        playRestoreSoundIfEnabled(player);
        return true;
    }

    public java.util.Set<UUID> getKnownPlayers() {
        return lastSaves.keySet();
    }

    /** Sauberes Herunterfahren des I/O-Threads (auf SERVER_STOPPING aufrufen). */
    public void shutdown() {
        ioExecutor.shutdown();
        try {
            ioExecutor.awaitTermination(10, java.util.concurrent.TimeUnit.SECONDS);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
    }

    private void playRestoreSoundIfEnabled(ServerPlayerEntity player) {
        if (!playRestoreSound) return;
        try {
            player.playSound(net.minecraft.sound.SoundEvents.ENTITY_PLAYER_LEVELUP, 1.0f, 1.0f);
        } catch (Throwable t) {
            // Defensive - falls Sound-API spaeter umzieht, keine Crashes.
        }
    }

    private static void applyToPlayer(ServerPlayerEntity player, ItemStack[] saved) {
        PlatformCompat.applyInventory(player, saved);
    }

    // ============================================================================
    // Pin / Unpin
    // ============================================================================
    public void togglePin(ServerPlayerEntity player, int slot, int saveIndex) {
        UUID playerId = player.getUuid();
        List<List<Save>> slotSaves = lastSaves.get(playerId);
        if (slotSaves == null || slot < 0 || slot >= slotSaves.size()) return;
        List<Save> savesList = slotSaves.get(slot);
        if (savesList == null || saveIndex < 0 || saveIndex >= savesList.size()) return;
        Save s = savesList.get(saveIndex);
        s.pinned = !s.pinned;
        saveLastSavesToFile(playerId, PlatformCompat.registryLookup(player));
        if (showSaveMessages) {
            player.sendMessage(Text.translatable("restoreinv.msg.pin", slotName(slot), saveIndex + 1,
                    Text.translatable(s.pinned ? "restoreinv.state.pinned" : "restoreinv.state.unpinned")), false);
        }
    }

    public boolean isPinned(UUID playerId, int slot, int saveIndex) {
        List<List<Save>> slotSaves = lastSaves.get(playerId);
        if (slotSaves == null || slot < 0 || slot >= slotSaves.size()) return false;
        List<Save> savesList = slotSaves.get(slot);
        if (savesList == null || saveIndex < 0 || saveIndex >= savesList.size()) return false;
        return savesList.get(saveIndex).pinned;
    }

    // ============================================================================
    // Persistierung pro Spieler (slot_n.dat + last_saves.dat)
    // ============================================================================
    private void saveToFile(UUID playerId, int slot, ItemStack[] inventory, RegistryWrapper.WrapperLookup lookup) {
        // Serialisierung + Datei-I/O abseits des Server-Threads. 'inventory' ist eine
        // frische Kopie aus captureInventory und wird nicht weiter mutiert -> thread-safe.
        ioExecutor.submit(() -> {
            try {
                Path saveDir = Paths.get(SAVE_DIR);
                if (!java.nio.file.Files.exists(saveDir)) java.nio.file.Files.createDirectories(saveDir);
                Path playerDir = saveDir.resolve(playerId.toString());
                if (!java.nio.file.Files.exists(playerDir)) java.nio.file.Files.createDirectories(playerDir);
                Path saveFile = playerDir.resolve("slot_" + slot + ".dat");
                NbtIo.write(writeStacksToNbt(inventory, lookup), saveFile);
            } catch (Throwable e) {
                LOGGER.error("Konnte Slot {} fuer {} nicht speichern", slot, playerId, e);
            }
        });
    }

    private ItemStack[] loadFromFile(UUID playerId, int slot, RegistryWrapper.WrapperLookup lookup) {
        try {
            Path saveFile = Paths.get(SAVE_DIR, playerId.toString(), "slot_" + slot + ".dat");
            if (!java.nio.file.Files.exists(saveFile)) return null;
            NbtCompound nbt = NbtIo.read(saveFile);
            if (nbt == null) return null;
            return readStacksFromNbt(nbt, lookup);
        } catch (IOException e) {
            LOGGER.error("Konnte Slot {} fuer {} nicht laden", slot, playerId, e);
            return null;
        }
    }

    private void saveLastSavesToFile(UUID playerId, RegistryWrapper.WrapperLookup lookup) {
        // Auf dem Server-Thread eine stabile Momentaufnahme der Save-Listen ziehen
        // (flache Kopie), damit der I/O-Thread nicht ueber veraenderliche Listen iteriert.
        List<List<Save>> source = lastSaves.get(playerId);
        final List<List<Save>> snapshot = new ArrayList<>(SLOTS);
        if (source != null) {
            for (int slot = 0; slot < SLOTS && slot < source.size(); slot++) {
                snapshot.add(new ArrayList<>(source.get(slot)));
            }
        }
        ioExecutor.submit(() -> {
            try {
                Path saveDir = Paths.get(SAVE_DIR);
                if (!java.nio.file.Files.exists(saveDir)) java.nio.file.Files.createDirectories(saveDir);
                Path playerDir = saveDir.resolve(playerId.toString());
                if (!java.nio.file.Files.exists(playerDir)) java.nio.file.Files.createDirectories(playerDir);
                Path lastSavesFile = playerDir.resolve("last_saves.dat");

                NbtCompound nbt = new NbtCompound();
                nbt.putInt("__format", CURRENT_DATA_FORMAT);
                for (int slot = 0; slot < snapshot.size(); slot++) {
                    NbtCompound slotNbt = new NbtCompound();
                    List<Save> savesList = snapshot.get(slot);
                    for (int i = 0; i < savesList.size(); i++) {
                        Save s = savesList.get(i);
                        NbtCompound saveNbt = writeStacksToNbt(s.stacks, lookup);
                        saveNbt.putLong("__ts", s.timestampMillis);
                        saveNbt.putBoolean("__pinned", s.pinned);
                        slotNbt.put("save_" + i, saveNbt);
                    }
                    nbt.put("slot_" + slot, slotNbt);
                }
                NbtIo.write(nbt, lastSavesFile);
            } catch (Throwable e) {
                LOGGER.error("Konnte last_saves fuer {} nicht speichern", playerId, e);
            }
        });
    }

    private void loadLastSavesFromFile(UUID playerId, RegistryWrapper.WrapperLookup lookup) {
        try {
            Path lastSavesFile = Paths.get(SAVE_DIR, playerId.toString(), "last_saves.dat");
            if (!java.nio.file.Files.exists(lastSavesFile)) return;
            NbtCompound nbt = NbtIo.read(lastSavesFile);
            if (nbt == null) return;

            // Format-Marker tolerant lesen (fehlt bei Legacy-Daten -> Format 1).
            // Aktuell sind alle Formate aufwaerts lesbar; absente Slots bleiben leer.
            int format = PlatformCompat.getInt(nbt, "__format", 1);
            if (format > CURRENT_DATA_FORMAT) {
                LOGGER.warn("last_saves.dat von {} hat neueres Format {} (erwartet <= {}). "
                        + "Lese best-effort.", playerId, format, CURRENT_DATA_FORMAT);
            }

            List<List<Save>> slotSaves = new ArrayList<>(SLOTS);
            for (int slot = 0; slot < SLOTS; slot++) {
                slotSaves.add(new ArrayList<>());
                NbtCompound slotNbt = PlatformCompat.getCompound(nbt, "slot_" + slot);
                for (int i = 0; i < MAX_SAVES_PER_SLOT; i++) {
                    String key = "save_" + i;
                    if (!slotNbt.contains(key)) continue;
                    NbtCompound saveNbt = PlatformCompat.getCompound(slotNbt, key);
                    ItemStack[] stacks = readStacksFromNbt(saveNbt, lookup);
                    long ts      = PlatformCompat.getLong(saveNbt, "__ts", 0L);
                    boolean pin  = PlatformCompat.getBoolean(saveNbt, "__pinned", false);
                    slotSaves.get(slot).add(new Save(stacks, ts, pin));
                }
            }
            lastSaves.put(playerId, slotSaves);
        } catch (IOException e) {
            LOGGER.error("Konnte last_saves fuer {} nicht laden", playerId, e);
        }
    }

    // ============================================================================
    // Globale Konfiguration  (editierbares JSON unter config/restoreinv.json)
    // ============================================================================
    private static final com.google.gson.Gson GSON =
            new com.google.gson.GsonBuilder().setPrettyPrinting().create();

    private static Path configJsonPath() {
        return net.fabricmc.loader.api.FabricLoader.getInstance().getConfigDir().resolve("restoreinv.json");
    }

    public void saveConfig() {
        try {
            com.google.gson.JsonObject root = new com.google.gson.JsonObject();
            root.addProperty("format", CURRENT_DATA_FORMAT);
            root.addProperty("autoSaveInterval1", autoSaveInterval1);
            root.addProperty("autoSaveInterval2", autoSaveInterval2);
            root.addProperty("showSaveMessages", showSaveMessages);
            root.addProperty("playRestoreSound", playRestoreSound);
            root.addProperty("requireOpForRestore", requireOpForRestore);
            root.addProperty("autoSaveOnDeath", autoSaveOnDeath);
            root.addProperty("savesPerSlot", savesPerSlot);

            com.google.gson.JsonObject prev = new com.google.gson.JsonObject();
            for (Map.Entry<UUID, Boolean> e : previewEnabled.entrySet()) {
                prev.addProperty(e.getKey().toString(), e.getValue());
            }
            root.add("previewEnabled", prev);

            Path f = configJsonPath();
            java.nio.file.Files.createDirectories(f.getParent());
            try (java.io.Writer w = java.nio.file.Files.newBufferedWriter(f)) {
                GSON.toJson(root, w);
            }
        } catch (Throwable e) {
            LOGGER.error("Konnte Konfiguration nicht speichern", e);
        }
    }

    public void loadConfig(MinecraftServer server) {
        Path json = configJsonPath();
        if (java.nio.file.Files.exists(json)) {
            readConfigJson(json);
        } else {
            // Einmalige Migration aus altem binaeren restoreinv/config.dat.
            Path old = Paths.get(SAVE_DIR, "config.dat");
            if (java.nio.file.Files.exists(old)) {
                migrateConfigFromNbt(old);
                saveConfig();
                try {
                    java.nio.file.Files.move(old, old.resolveSibling("config.dat.bak"));
                } catch (IOException ignore) { /* Backup optional */ }
                LOGGER.info("RestoreInv: Konfiguration von config.dat nach {} migriert.", json);
            }
        }
        // Lazy-Load: last_saves werden pro Spieler bei onPlayerJoin geladen
        // (kein Voll-Scan aller UUID-Verzeichnisse beim Start mehr).
    }

    private void readConfigJson(Path json) {
        try (java.io.Reader r = java.nio.file.Files.newBufferedReader(json)) {
            com.google.gson.JsonObject o = GSON.fromJson(r, com.google.gson.JsonObject.class);
            if (o == null) return;
            autoSaveInterval1   = getInt(o, "autoSaveInterval1", 1);
            autoSaveInterval2   = getInt(o, "autoSaveInterval2", 5);
            showSaveMessages    = getBool(o, "showSaveMessages", true);
            playRestoreSound    = getBool(o, "playRestoreSound", true);
            requireOpForRestore = getBool(o, "requireOpForRestore", false);
            autoSaveOnDeath     = getBool(o, "autoSaveOnDeath", true);
            savesPerSlot        = clamp(getInt(o, "savesPerSlot", DEFAULT_SAVES_PER_SLOT), 1, MAX_SAVES_PER_SLOT);

            previewEnabled.clear();
            if (o.has("previewEnabled") && o.get("previewEnabled").isJsonObject()) {
                for (Map.Entry<String, com.google.gson.JsonElement> e : o.getAsJsonObject("previewEnabled").entrySet()) {
                    try {
                        previewEnabled.put(UUID.fromString(e.getKey()), e.getValue().getAsBoolean());
                    } catch (IllegalArgumentException ignore) {}
                }
            }
        } catch (Throwable e) {
            LOGGER.error("Konnte {} nicht lesen", json, e);
        }
    }

    private void migrateConfigFromNbt(Path configFile) {
        try {
            NbtCompound nbt = NbtIo.read(configFile);
            if (nbt == null) return;
            autoSaveInterval1   = PlatformCompat.getInt(nbt, "autoSaveInterval1", 1);
            autoSaveInterval2   = PlatformCompat.getInt(nbt, "autoSaveInterval2", 5);
            showSaveMessages    = PlatformCompat.getBoolean(nbt, "showSaveMessages", true);
            playRestoreSound    = PlatformCompat.getBoolean(nbt, "playRestoreSound", true);
            requireOpForRestore = PlatformCompat.getBoolean(nbt, "requireOpForRestore", false);
            autoSaveOnDeath     = PlatformCompat.getBoolean(nbt, "autoSaveOnDeath", true);
            savesPerSlot        = clamp(PlatformCompat.getInt(nbt, "savesPerSlot", DEFAULT_SAVES_PER_SLOT), 1, MAX_SAVES_PER_SLOT);

            NbtCompound prev = PlatformCompat.getCompound(nbt, "previewEnabled");
            previewEnabled.clear();
            for (String key : prev.getKeys()) {
                try {
                    previewEnabled.put(UUID.fromString(key), PlatformCompat.getBoolean(prev, key, true));
                } catch (IllegalArgumentException ignore) {}
            }
        } catch (IOException e) {
            LOGGER.error("Konnte alte config.dat nicht migrieren", e);
        }
    }

    private static int getInt(com.google.gson.JsonObject o, String key, int def) {
        try { return o.has(key) ? o.get(key).getAsInt() : def; } catch (Throwable t) { return def; }
    }

    private static boolean getBool(com.google.gson.JsonObject o, String key, boolean def) {
        try { return o.has(key) ? o.get(key).getAsBoolean() : def; } catch (Throwable t) { return def; }
    }

    private static int clamp(int v, int lo, int hi) {
        return Math.max(lo, Math.min(hi, v));
    }

    public void onPlayerJoin(UUID playerId, MinecraftServer server) {
        loadLastSavesFromFile(playerId, server.getRegistryManager());
    }

    public int getAutoSaveInterval1() { return autoSaveInterval1; }
    public int getAutoSaveInterval2() { return autoSaveInterval2; }

    public List<ServerPlayerEntity> getOnlinePlayers(MinecraftServer server) {
        return server == null ? Collections.emptyList() : server.getPlayerManager().getPlayerList();
    }

    public List<List<Save>> getLastSaves(UUID playerId) {
        List<List<Save>> slotSaves = lastSaves.get(playerId);
        if (slotSaves == null) {
            slotSaves = new ArrayList<>(SLOTS);
            for (int i = 0; i < SLOTS; i++) slotSaves.add(new ArrayList<>());
        }
        return slotSaves;
    }

    public boolean isPreviewEnabled(UUID playerId) {
        return previewEnabled.getOrDefault(playerId, true);
    }

    public void setPreviewEnabled(UUID playerId, boolean enabled) {
        previewEnabled.put(playerId, enabled);
        saveConfig();
    }

    // ============================================================================
    // Helfer fuer GUI-Tooltips
    // ============================================================================
    /** Uebersetzbare relative Zeitangabe (client-seitig aufgeloest). */
    public static Text formatRelativeTime(long timestampMillis) {
        if (timestampMillis <= 0) return Text.translatable("restoreinv.time.unknown");
        Duration d = Duration.between(Instant.ofEpochMilli(timestampMillis), Instant.now());
        long sec = Math.max(0, d.getSeconds());
        if (sec < 60) return Text.translatable("restoreinv.time.justnow");
        long min = sec / 60;
        if (min < 60) return Text.translatable("restoreinv.time.minutes", min);
        long hr = min / 60;
        if (hr < 24) return Text.translatable("restoreinv.time.hours", hr);
        long day = hr / 24;
        return Text.translatable("restoreinv.time.days", day);
    }

    public static int countNonEmpty(ItemStack[] inv) {
        if (inv == null) return 0;
        int n = 0;
        for (ItemStack s : inv) if (s != null && !s.isEmpty()) n++;
        return n;
    }

    /**
     * Waehlt ein "Top-Tool" zur Anzeige: bevorzugt reparierbare Items (Werkzeuge/Waffen)
     * mit dem hoechsten maxDamage. Nur falls gar kein reparierbares Item existiert,
     * wird das erste beliebige Item genommen (z. B. reine Ressourcen-Inventare).
     */
    public static ItemStack pickHighlight(ItemStack[] inv) {
        if (inv == null) return ItemStack.EMPTY;
        ItemStack best = ItemStack.EMPTY;
        ItemStack fallback = ItemStack.EMPTY;
        for (ItemStack s : inv) {
            if (s == null || s.isEmpty()) continue;
            if (fallback.isEmpty()) fallback = s;
            if (!s.isDamageable()) continue; // nur Werkzeuge/Waffen/Ruestung
            if (best.isEmpty() || s.getMaxDamage() > best.getMaxDamage()) best = s;
        }
        return best.isEmpty() ? fallback : best;
    }

    // ============================================================================
    // Permission-Helfer
    // ============================================================================
    public boolean canRestore(ServerPlayerEntity player) {
        return PermissionGate.canRestore(player, requireOpForRestore);
    }

    // ============================================================================
    // Config-GUI
    // ============================================================================
    public void openConfigScreen(ServerPlayerEntity player) {
        player.openHandledScreen(new SimpleNamedScreenHandlerFactory(
                (syncId, inventory, playerEntity) -> new RestoreInvConfigScreenHandler(syncId, inventory, this, playerEntity),
                Text.translatable("restoreinv.gui.config_title")));

        ScreenHandler screenHandler = player.currentScreenHandler;
        if (screenHandler instanceof GenericContainerScreenHandler container) {
            populateConfigGui(container, player);
        }
    }

    private static Text onOff(boolean on) {
        return Text.translatable(on ? "restoreinv.config.on" : "restoreinv.config.off");
    }

    private void populateConfigGui(GenericContainerScreenHandler container, ServerPlayerEntity opOwner) {
        container.getInventory().setStack(0, labeled(Items.CLOCK,
                Text.translatable("restoreinv.config.slot1", autoSaveInterval1),
                Text.translatable("restoreinv.config.slot1.desc")));

        container.getInventory().setStack(9, labeled(Items.CLOCK,
                Text.translatable("restoreinv.config.slot2", autoSaveInterval2),
                Text.translatable("restoreinv.config.slot2.desc")));

        container.getInventory().setStack(3, labeled(showSaveMessages ? Items.LIME_WOOL : Items.RED_WOOL,
                Text.translatable("restoreinv.config.messages", onOff(showSaveMessages)),
                Text.translatable("restoreinv.config.messages.desc")));

        container.getInventory().setStack(4, labeled(Items.BOOK,
                Text.translatable("restoreinv.gui.last_saves"),
                Text.translatable("restoreinv.config.last_saves.desc")));

        container.getInventory().setStack(7, labeled(playRestoreSound ? Items.NOTE_BLOCK : Items.STRUCTURE_VOID,
                Text.translatable("restoreinv.config.sound", onOff(playRestoreSound)),
                Text.translatable("restoreinv.config.sound.desc")));

        container.getInventory().setStack(8, labeled(autoSaveOnDeath ? Items.TOTEM_OF_UNDYING : Items.SKELETON_SKULL,
                Text.translatable("restoreinv.config.death", onOff(autoSaveOnDeath)),
                Text.translatable("restoreinv.config.death.desc")));

        container.getInventory().setStack(13, labeled(Items.CHEST,
                Text.translatable("restoreinv.config.saves_per_slot", savesPerSlot),
                Text.translatable("restoreinv.config.saves_per_slot.desc", MAX_SAVES_PER_SLOT)));

        container.getInventory().setStack(14, labeled(requireOpForRestore ? Items.IRON_BARS : Items.BARRIER,
                Text.translatable("restoreinv.config.op_only", onOff(requireOpForRestore)),
                Text.translatable("restoreinv.config.op_only.desc")));

        // Admin-Panel-Icon nur fuer Berechtigte
        if (PermissionGate.canAdminister(opOwner)) {
            container.getInventory().setStack(5, labeled(Items.PLAYER_HEAD,
                    Text.translatable("restoreinv.gui.admin_panel"),
                    Text.translatable("restoreinv.config.admin.desc")));
        }

        // +/- Buttons fuer Slot 1/2
        container.getInventory().setStack(1, labeled(Items.EMERALD,
                Text.translatable("restoreinv.config.plus"), Text.translatable("restoreinv.config.slot1_plus.desc")));
        container.getInventory().setStack(2, labeled(Items.REDSTONE,
                Text.translatable("restoreinv.config.minus"), Text.translatable("restoreinv.config.slot1_minus.desc")));
        container.getInventory().setStack(10, labeled(Items.EMERALD,
                Text.translatable("restoreinv.config.plus"), Text.translatable("restoreinv.config.slot2_plus.desc")));
        container.getInventory().setStack(11, labeled(Items.REDSTONE,
                Text.translatable("restoreinv.config.minus"), Text.translatable("restoreinv.config.slot2_minus.desc")));

        // Speichern Button
        container.getInventory().setStack(18, labeled(Items.EMERALD_BLOCK,
                Text.translatable("restoreinv.config.save"),
                Text.translatable("restoreinv.config.save.desc")));
    }

    private static ItemStack labeled(net.minecraft.item.Item item, Text name, Text lore) {
        ItemStack s = new ItemStack(item);
        s.set(DataComponentTypes.CUSTOM_NAME, name);
        s.set(DataComponentTypes.LORE, new LoreComponent(List.of(lore)));
        return s;
    }

    public void updateConfigGUI(GenericContainerScreenHandler container) {
        populateConfigGui(container, null);
    }
}
