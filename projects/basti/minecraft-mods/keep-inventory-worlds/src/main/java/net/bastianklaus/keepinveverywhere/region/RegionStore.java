package net.bastianklaus.keepinveverywhere.region;

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
 * Global, cross-world storage for saved regions (builds), mirroring
 * {@link net.bastianklaus.keepinveverywhere.data.SlotStore} but under
 * {@code config/keepinveverywhere/regions/}.
 */
public final class RegionStore {
    private static final Gson GSON = new GsonBuilder().setPrettyPrinting().create();
    private static final Type INDEX_TYPE = new TypeToken<LinkedHashMap<String, IndexEntry>>() {}.getType();

    private RegionStore() {
    }

    public static final class IndexEntry {
        public String displayName;
        public long createdEpochMs;
        public int blockCount;
        public int sizeX;
        public int sizeY;
        public int sizeZ;
    }

    private static Path rootDir() {
        return FabricLoader.getInstance().getConfigDir().resolve(KeepInvEverywhere.MOD_ID).resolve("regions");
    }

    private static Path indexFile() {
        return rootDir().resolve("index.json");
    }

    private static Path regionFile(String fileName) {
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
            KeepInvEverywhere.LOGGER.error("Failed to read region index", e);
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
            KeepInvEverywhere.LOGGER.error("Failed to write region index", e);
        }
    }

    public static synchronized List<RegionMeta> list() {
        Map<String, IndexEntry> index = readIndex();
        List<RegionMeta> out = new ArrayList<>();
        for (Map.Entry<String, IndexEntry> e : index.entrySet()) {
            IndexEntry v = e.getValue();
            out.add(new RegionMeta(e.getKey(), v.displayName, v.createdEpochMs,
                    v.blockCount, v.sizeX, v.sizeY, v.sizeZ));
        }
        out.sort(Comparator.comparingLong(RegionMeta::createdEpochMs).reversed());
        return out;
    }

    public static synchronized boolean exists(String displayName) {
        return findByDisplayName(readIndex(), displayName) != null;
    }

    public static synchronized RegionMeta save(String displayName, RegionSnapshot snapshot,
                                               RegistryWrapper.WrapperLookup registries) throws IOException {
        Map<String, IndexEntry> index = readIndex();
        String existingKey = findByDisplayName(index, displayName);
        String fileName = existingKey != null ? existingKey : uniqueFileName(index, displayName);

        Files.createDirectories(rootDir());
        NbtIo.writeCompressed(snapshot.toNbt(registries), regionFile(fileName));

        IndexEntry entry = new IndexEntry();
        entry.displayName = displayName;
        entry.createdEpochMs = System.currentTimeMillis();
        entry.blockCount = snapshot.blockCount();
        entry.sizeX = snapshot.sizeX;
        entry.sizeY = snapshot.sizeY;
        entry.sizeZ = snapshot.sizeZ;
        index.put(fileName, entry);
        writeIndex(index);
        return new RegionMeta(fileName, displayName, entry.createdEpochMs,
                entry.blockCount, entry.sizeX, entry.sizeY, entry.sizeZ);
    }

    public static synchronized RegionSnapshot load(String displayName, RegistryWrapper.WrapperLookup registries) {
        Map<String, IndexEntry> index = readIndex();
        String key = findByDisplayName(index, displayName);
        if (key == null) {
            return null;
        }
        Path file = regionFile(key);
        if (!Files.exists(file)) {
            return null;
        }
        try {
            NbtCompound root = NbtIo.readCompressed(file, NbtSizeTracker.ofUnlimitedBytes());
            return RegionSnapshot.fromNbt(root, registries);
        } catch (Exception e) {
            KeepInvEverywhere.LOGGER.error("Failed to read region '{}'", displayName, e);
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
            Files.deleteIfExists(regionFile(key));
        } catch (IOException e) {
            KeepInvEverywhere.LOGGER.error("Failed to delete region file for '{}'", displayName, e);
        }
        index.remove(key);
        writeIndex(index);
        return true;
    }

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
            base = "region";
        }
        String candidate = base;
        int n = 1;
        while (index.containsKey(candidate)) {
            candidate = base + "_" + n++;
        }
        return candidate;
    }
}
