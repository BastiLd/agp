package net.bastianklaus.keepinveverywhere.region;

import com.mojang.serialization.DataResult;
import net.minecraft.block.BlockState;
import net.minecraft.nbt.NbtCompound;
import net.minecraft.nbt.NbtDouble;
import net.minecraft.nbt.NbtElement;
import net.minecraft.nbt.NbtList;
import net.minecraft.nbt.NbtOps;
import net.minecraft.registry.RegistryOps;
import net.minecraft.registry.RegistryWrapper;
import net.minecraft.util.math.BlockPos;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

/**
 * A saved world region: blocks (palette + per-position varint indices), an optional shape mask
 * for non-box selections, block entity NBT (chest contents, sign text, ...) and optionally
 * entity NBT. There is no size limit; memory/duration scale with the selection.
 *
 * <p>Iteration order over the bounding box is always y → z → x. Positions excluded by the mask
 * are untouched on paste. Block states are serialized via {@link BlockState#CODEC}; states or
 * block entities that no longer exist in the running version are skipped and counted.
 */
public final class RegionSnapshot {
    private static final int FORMAT_VERSION = 1;

    public int sizeX;
    public int sizeY;
    public int sizeZ;
    /** Bitset over sizeX*sizeY*sizeZ in y,z,x order; null means "the whole box". */
    public long[] mask;
    /** Decoded palette; entries may be null after loading if the state no longer exists. */
    public List<BlockState> palette = new ArrayList<>();
    /** One varint palette index per masked position, in iteration order. */
    public byte[] indices = new byte[0];
    /** Block entity NBT with relative x/y/z. */
    public List<NbtCompound> blockEntities = new ArrayList<>();
    /** Entity NBT with relative Pos. */
    public List<NbtCompound> entities = new ArrayList<>();

    public long volume() {
        return (long) sizeX * sizeY * sizeZ;
    }

    public boolean isMasked(long boxIndex) {
        if (mask == null) {
            return true;
        }
        return (mask[(int) (boxIndex >>> 6)] & (1L << (boxIndex & 63))) != 0;
    }

    public int blockCount() {
        if (mask == null) {
            return (int) volume();
        }
        int n = 0;
        for (long word : mask) {
            n += Long.bitCount(word);
        }
        return n;
    }

    public static BlockPos relative(NbtCompound nbt) {
        return new BlockPos(nbt.getInt("x"), nbt.getInt("y"), nbt.getInt("z"));
    }

    // ---------------------------------------------------------------- NBT

    public NbtCompound toNbt(RegistryWrapper.WrapperLookup registries) {
        RegistryOps<NbtElement> ops = RegistryOps.of(NbtOps.INSTANCE, registries);
        NbtCompound root = new NbtCompound();
        root.putInt("format", FORMAT_VERSION);
        root.putInt("sx", sizeX);
        root.putInt("sy", sizeY);
        root.putInt("sz", sizeZ);
        if (mask != null) {
            root.putLongArray("mask", mask);
        }

        NbtList paletteNbt = new NbtList();
        for (BlockState state : palette) {
            NbtElement el = BlockState.CODEC.encodeStart(ops, state).result().orElseGet(NbtCompound::new);
            paletteNbt.add(el);
        }
        root.put("palette", paletteNbt);
        root.putByteArray("indices", indices);

        NbtList beList = new NbtList();
        beList.addAll(blockEntities);
        root.put("block_entities", beList);

        NbtList entityList = new NbtList();
        entityList.addAll(entities);
        root.put("entities", entityList);
        return root;
    }

    /** Decode; palette entries that fail to parse become null (their blocks are skipped on paste). */
    public static RegionSnapshot fromNbt(NbtCompound root, RegistryWrapper.WrapperLookup registries) {
        RegistryOps<NbtElement> ops = RegistryOps.of(NbtOps.INSTANCE, registries);
        RegionSnapshot snap = new RegionSnapshot();
        snap.sizeX = root.getInt("sx");
        snap.sizeY = root.getInt("sy");
        snap.sizeZ = root.getInt("sz");
        snap.mask = root.contains("mask") ? root.getLongArray("mask") : null;
        snap.indices = root.getByteArray("indices");

        NbtList paletteNbt = root.getList("palette", NbtElement.COMPOUND_TYPE);
        for (int i = 0; i < paletteNbt.size(); i++) {
            DataResult<BlockState> parsed = BlockState.CODEC.parse(ops, paletteNbt.get(i));
            Optional<BlockState> result = parsed.result();
            snap.palette.add(result.orElse(null));
        }

        NbtList beList = root.getList("block_entities", NbtElement.COMPOUND_TYPE);
        for (int i = 0; i < beList.size(); i++) {
            snap.blockEntities.add(beList.getCompound(i));
        }
        NbtList entityList = root.getList("entities", NbtElement.COMPOUND_TYPE);
        for (int i = 0; i < entityList.size(); i++) {
            snap.entities.add(entityList.getCompound(i));
        }
        return snap;
    }

    // ---------------------------------------------------------------- varint helpers

    public static void writeVarInt(ByteArrayOutputStream out, int value) {
        while ((value & ~0x7F) != 0) {
            out.write((value & 0x7F) | 0x80);
            value >>>= 7;
        }
        out.write(value);
    }

    public static int readVarInt(ByteArrayInputStream in) {
        int value = 0;
        int shift = 0;
        int b;
        do {
            b = in.read();
            value |= (b & 0x7F) << shift;
            shift += 7;
        } while ((b & 0x80) != 0);
        return value;
    }

    // ---------------------------------------------------------------- entity pos helpers

    /** Replace an entity NBT's absolute "Pos" with coordinates relative to {@code origin}. */
    public static void makePosRelative(NbtCompound entityNbt, BlockPos origin) {
        NbtList pos = entityNbt.getList("Pos", NbtElement.DOUBLE_TYPE);
        if (pos.size() == 3) {
            NbtList rel = new NbtList();
            rel.add(NbtDouble.of(pos.getDouble(0) - origin.getX()));
            rel.add(NbtDouble.of(pos.getDouble(1) - origin.getY()));
            rel.add(NbtDouble.of(pos.getDouble(2) - origin.getZ()));
            entityNbt.put("Pos", rel);
        }
        // Drop the UUID so pasting the same region twice never collides.
        entityNbt.remove("UUID");
    }

    /** Resolve a relative "Pos" back to absolute coordinates at {@code origin}. */
    public static void makePosAbsolute(NbtCompound entityNbt, BlockPos origin) {
        NbtList pos = entityNbt.getList("Pos", NbtElement.DOUBLE_TYPE);
        if (pos.size() == 3) {
            NbtList abs = new NbtList();
            abs.add(NbtDouble.of(pos.getDouble(0) + origin.getX()));
            abs.add(NbtDouble.of(pos.getDouble(1) + origin.getY()));
            abs.add(NbtDouble.of(pos.getDouble(2) + origin.getZ()));
            entityNbt.put("Pos", abs);
        }
    }
}
