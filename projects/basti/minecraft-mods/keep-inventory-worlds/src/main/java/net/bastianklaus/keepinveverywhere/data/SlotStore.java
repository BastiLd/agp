package net.bastianklaus.keepinveverywhere.data;

import com.google.gson.Gson;
import com.google.gson.GsonBuilder;
import com.google.gson.reflect.TypeToken;
import net.bastianklaus.keepinveverywhere.KeepInvEverywhere;
import net.fabricmc.loader.api.FabricLoader;
import net.minecraft.nbt.NbtCompound;
import net.minecraft.nbt.NbtIo;
import net.minecraft.nbt.NbtSizeTracker;
import net.minecraft.registry.RegistryWrapper;

import java.io.IOException;
import java.io.Reader;
import java.io.Writer;
import java.lang.reflect.Type;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Global, cross-world storage for named inventory slots.
 * <p>Lives under {@code <.minecraft>/config/keepinveverywhere/slots/} so snapshots are shared
 * across every single-player world. Each slot is one compressed NBT file; {@code index.json}
 * maps the sanitized file stem to the user-facing display name and metadata.
 */
public final class SlotStore {
    private static final Gson GSON = new GsonBuilder().setPrettyPrinting().create();
    private static final Type INDEX_TYPE = new TypeToken<LinkedHashMap<String, IndexEntry>>() {}.getType();

    private SlotStore() {
    }

    /** Mutable index record (kept simple for Gson). */
    public static final class IndexEntry {
        public String displayName;
        public long createdEpochMs;
        public int itemCount;
    }

    private static Path rootDir() {
        return FabricLoader.getInstance().getConfigDir().resolve(KeepInvEverywhere.MOD_ID).resolve("slots");
    }

    private static Path indexFile() {
        return rootDir().resolve("index.json");
    }

    private static Path slotFile(String fileName) {
        return rootDir().resolve(fileName + ".dat");
    }

    private static synchronized Map<String, IndexEntry> readIndex() {
        Path file = indexFile();
        if (!Files.exists(file)) {
            return new LinkedHashMap<>();
        }
        try (Reader reader = Files.newBufferedReader(file, StandardCharsets.UTF_8)) {
            Map<String, IndexEntry> map = GSON.fromJson(reader, INDEX_TYPE);
            return map == null ? new LinkedHashMap<>() : map;
        } catch (Exception e) {
            KeepInvEverywhere.LOGGER.error("Failed to read slot index", e);
            return new LinkedHashMap<>();
        }
    }

    private static synchronized void writeIndex(Map<String, IndexEntry> index) {
        try {
            Files.createDirectories(rootDir());
            try (Writer writer = Files.newBufferedWriter(indexFile(), StandardCharsets.UTF_8)) {
                GSON.toJson(index, INDEX_TYPE, writer);
            }
        } catch (IOException e) {
            KeepInvEverywhere.LOGGER.error("Failed to write slot index", e);
        }
    }

    /** All saved slots, newest first. */
    public static synchronized List<SlotMeta> list() {
        Map<String, IndexEntry> index = readIndex();
        List<SlotMeta> out = new ArrayList<>();
        for (Map.Entry<String, IndexEntry> e : index.entrySet()) {
            IndexEntry v = e.getValue();
            out.add(new SlotMeta(e.getKey(), v.displayName, v.createdEpochMs, v.itemCount));
        }
        out.sort(Comparator.comparingLong(SlotMeta::createdEpochMs).reversed());
        return out;
    }

    public static synchronized boolean exists(String displayName) {
        return findByDisplayName(readIndex(), displayName) != null;
    }

    /** Save (or overwrite) a snapshot under the given display name. Returns the stored metadata. */
    public static synchronized SlotMeta save(String displayName, InventorySnapshot snapshot,
                                             RegistryWrapper.WrapperLookup registries) throws IOException {
        Map<String, IndexEntry> index = readIndex();
        String existingKey = findByDisplayName(index, displayName);
        String fileName = existingKey != null ? existingKey : uniqueFileName(index, displayName);

        Files.createDirectories(rootDir());
        NbtIo.writeCompressed(snapshot.toNbt(registries), slotFile(fileName));

        IndexEntry entry = new IndexEntry();
        entry.displayName = displayName;
        entry.createdEpochMs = System.currentTimeMillis();
        entry.itemCount = snapshot.itemCount();
        index.put(fileName, entry);
        writeIndex(index);
        return new SlotMeta(fileName, displayName, entry.createdEpochMs, entry.itemCount);
    }

    /** Load a snapshot by display name, or {@code null} if it does not exist / cannot be read. */
    public static synchronized InventorySnapshot load(String displayName, RegistryWrapper.WrapperLookup registries) {
        Map<String, IndexEntry> index = readIndex();
        String key = findByDisplayName(index, displayName);
        if (key == null) {
            return null;
        }
        Path file = slotFile(key);
        if (!Files.exists(file)) {
            return null;
        }
        try {
            NbtCompound root = NbtIo.readCompressed(file, NbtSizeTracker.ofUnlimitedBytes());
            return InventorySnapshot.fromNbt(root, registries);
        } catch (Exception e) {
            KeepInvEverywhere.LOGGER.error("Failed to read slot '{}'", displayName, e);
            return null;
        }
    }

    public static synchronized boolean delete(String displayName) {
        Map<String, IndexEntry> index = readIndex();
        String key = findByDisplayName(index, displayName);
        if (key == null) {
            return false;
        }
        try {
            Files.deleteIfExists(slotFile(key));
        } catch (IOException e) {
            KeepInvEverywhere.LOGGER.error("Failed to delete slot file for '{}'", displayName, e);
        }
        index.remove(key);
        writeIndex(index);
        return true;
    }

    /** Rename a slot's display name (the on-disk file keeps its stem). */
    public static synchronized boolean rename(String oldDisplayName, String newDisplayName) {
        Map<String, IndexEntry> index = readIndex();
        String key = findByDisplayName(index, oldDisplayName);
        if (key == null || findByDisplayName(index, newDisplayName) != null) {
            return false;
        }
        index.get(key).displayName = newDisplayName;
        writeIndex(index);
        return true;
    }

    private static String findByDisplayName(Map<String, IndexEntry> index, String displayName) {
        for (Map.Entry<String, IndexEntry> e : index.entrySet()) {
            if (e.getValue().displayName.equalsIgnoreCase(displayName)) {
                return e.getKey();
            }
        }
        return null;
    }

    private static String uniqueFileName(Map<String, IndexEntry> index, String displayName) {
        String base = displayName.toLowerCase().replaceAll("[^a-z0-9_-]", "_");
        if (base.isBlank()) {
            base = "slot";
        }
        String candidate = base;
        int n = 1;
        while (index.containsKey(candidate)) {
            candidate = base + "_" + n++;
        }
        return candidate;
    }
}
