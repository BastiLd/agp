package net.bastianklaus.keepinveverywhere.region;

import net.bastianklaus.keepinveverywhere.KeepInvEverywhere;
import net.minecraft.block.Block;
import net.minecraft.block.BlockState;
import net.minecraft.block.entity.BlockEntity;
import net.minecraft.entity.Entity;
import net.minecraft.entity.EntityType;
import net.minecraft.entity.player.PlayerEntity;
import net.minecraft.nbt.NbtCompound;
import net.minecraft.server.MinecraftServer;
import net.minecraft.server.network.ServerPlayerEntity;
import net.minecraft.server.world.ServerWorld;
import net.minecraft.util.math.BlockPos;
import net.minecraft.util.math.Box;
import net.minecraft.util.math.ChunkPos;
import net.minecraft.world.World;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.util.ArrayDeque;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

/**
 * Region copy/paste, sliced across ticks (~30 ms budget per tick) so even huge regions never
 * freeze the game.
 *
 * <p>Two queues exist: the <b>server</b> queue (ticked via {@code ServerTickEvents}) handles
 * pasting and full-data copies in single-player; the <b>client</b> queue (ticked via
 * {@code ClientTickEvents}) handles copies on multiplayer servers, where the client can read the
 * synced world but has no integrated server. Copies only need read access, so a {@link World}
 * (server or client) is sufficient; pasting requires a {@link ServerWorld}.
 */
public final class RegionJobs {
    private static final long TICK_BUDGET_NANOS = 30_000_000L;
    private static final int PLACE_FLAGS = Block.NOTIFY_LISTENERS | Block.FORCE_STATE | Block.SKIP_DROPS;

    private static final ArrayDeque<Job> SERVER_QUEUE = new ArrayDeque<>();
    private static final ArrayDeque<Job> CLIENT_QUEUE = new ArrayDeque<>();

    private RegionJobs() {
    }

    /** Outcome handed to the completion callback (runs on the queue's thread). */
    public record Result(boolean success, int processed, int skipped, long millis) {
    }

    public interface Callback {
        void done(Result result);
    }

    private interface Job {
        /** @return true when finished */
        boolean step(long deadlineNanos);
    }

    public static boolean isBusy() {
        return !SERVER_QUEUE.isEmpty() || !CLIENT_QUEUE.isEmpty();
    }

    public static void tick(MinecraftServer server) {
        tickQueue(SERVER_QUEUE);
    }

    /** Ticked from the client entrypoint; drives multiplayer copies. */
    public static void tickClient() {
        tickQueue(CLIENT_QUEUE);
    }

    private static void tickQueue(ArrayDeque<Job> queue) {
        Job job = queue.peek();
        if (job == null) {
            return;
        }
        try {
            if (job.step(System.nanoTime() + TICK_BUDGET_NANOS)) {
                queue.poll();
            }
        } catch (Exception e) {
            KeepInvEverywhere.LOGGER.error("Region job failed", e);
            queue.poll();
        }
    }

    // ---------------------------------------------------------------- copy

    /**
     * Queue a copy of the masked box into a named region file. Call from the thread owning
     * {@code world}: a {@link ServerWorld} on the server thread ({@code onClientThread=false},
     * full data incl. chest contents) or the client world on the client thread
     * ({@code onClientThread=true}, synced data only — works on any server).
     */
    public static void startCopy(World world, String name, BlockPos min, BlockPos max, long[] mask,
                                 boolean includeEntities, boolean onClientThread, Callback callback) {
        CopyJob job = new CopyJob(world, name, min, max, mask, includeEntities, callback);
        (onClientThread ? CLIENT_QUEUE : SERVER_QUEUE).add(job);
    }

    private static final class CopyJob implements Job {
        private final World world;
        private final String name;
        private final BlockPos min;
        private final RegionSnapshot snapshot = new RegionSnapshot();
        private final Map<BlockState, Integer> paletteLookup = new HashMap<>();
        private final ByteArrayOutputStream indexStream = new ByteArrayOutputStream();
        private final boolean includeEntities;
        private final Callback callback;
        private final long startMs = System.currentTimeMillis();
        private long cursor = 0;
        private int skippedUnloaded = 0;
        private long cachedChunkKey = Long.MIN_VALUE;
        private boolean cachedChunkLoaded = false;

        CopyJob(World world, String name, BlockPos min, BlockPos max,
                long[] mask, boolean includeEntities, Callback callback) {
            this.world = world;
            this.name = name;
            this.min = min;
            this.includeEntities = includeEntities;
            this.callback = callback;
            snapshot.sizeX = max.getX() - min.getX() + 1;
            snapshot.sizeY = max.getY() - min.getY() + 1;
            snapshot.sizeZ = max.getZ() - min.getZ() + 1;
            snapshot.mask = mask;
        }

        private boolean isLoaded(int blockX, int blockZ) {
            long key = ChunkPos.toLong(blockX >> 4, blockZ >> 4);
            if (key != cachedChunkKey) {
                cachedChunkKey = key;
                cachedChunkLoaded = world.getChunkManager().isChunkLoaded(blockX >> 4, blockZ >> 4);
            }
            return cachedChunkLoaded;
        }

        @Override
        public boolean step(long deadlineNanos) {
            long volume = snapshot.volume();
            BlockPos.Mutable pos = new BlockPos.Mutable();
            while (cursor < volume) {
                if (System.nanoTime() >= deadlineNanos) {
                    return false;
                }
                long i = cursor++;
                if (!snapshot.isMasked(i)) {
                    continue;
                }
                int x = (int) (i % snapshot.sizeX);
                int z = (int) ((i / snapshot.sizeX) % snapshot.sizeZ);
                int y = (int) (i / ((long) snapshot.sizeX * snapshot.sizeZ));
                pos.set(min.getX() + x, min.getY() + y, min.getZ() + z);

                if (!isLoaded(pos.getX(), pos.getZ())) {
                    skippedUnloaded++;
                }
                BlockState state = world.getBlockState(pos);
                Integer paletteIdx = paletteLookup.get(state);
                if (paletteIdx == null) {
                    paletteIdx = snapshot.palette.size();
                    snapshot.palette.add(state);
                    paletteLookup.put(state, paletteIdx);
                }
                RegionSnapshot.writeVarInt(indexStream, paletteIdx);

                if (state.hasBlockEntity()) {
                    BlockEntity be = world.getBlockEntity(pos);
                    if (be != null) {
                        NbtCompound nbt = be.createNbtWithIdentifyingData(world.getRegistryManager());
                        nbt.putInt("x", x);
                        nbt.putInt("y", y);
                        nbt.putInt("z", z);
                        snapshot.blockEntities.add(nbt);
                    }
                }
            }

            // Blocks done — entities + file write in one final slice.
            if (includeEntities) {
                Box box = new Box(min.getX(), min.getY(), min.getZ(),
                        min.getX() + snapshot.sizeX, min.getY() + snapshot.sizeY, min.getZ() + snapshot.sizeZ);
                for (Entity entity : world.getOtherEntities(null, box, e -> !(e instanceof PlayerEntity))) {
                    NbtCompound nbt = new NbtCompound();
                    if (entity.saveSelfNbt(nbt)) {
                        RegionSnapshot.makePosRelative(nbt, min);
                        snapshot.entities.add(nbt);
                    }
                }
            }
            snapshot.indices = indexStream.toByteArray();

            boolean ok;
            try {
                RegionStore.save(name, snapshot, world.getRegistryManager());
                ok = true;
            } catch (Exception e) {
                KeepInvEverywhere.LOGGER.error("Failed to write region '{}'", name, e);
                ok = false;
            }
            callback.done(new Result(ok, snapshot.blockCount(), skippedUnloaded, System.currentTimeMillis() - startMs));
            return true;
        }
    }

    // ---------------------------------------------------------------- paste

    /** Queue pasting a loaded snapshot with its min corner at {@code targetMin}. Server thread only. */
    public static void startPaste(ServerPlayerEntity player, RegionSnapshot snapshot, BlockPos targetMin,
                                  boolean includeEntities, Callback callback) {
        SERVER_QUEUE.add(new PasteJob(player, snapshot, targetMin, includeEntities, callback));
    }

    private static final class PasteJob implements Job {
        private final ServerPlayerEntity player;
        private final RegionSnapshot snapshot;
        private final BlockPos targetMin;
        private final boolean includeEntities;
        private final Callback callback;
        private final ByteArrayInputStream indexStream;
        private final long startMs = System.currentTimeMillis();
        private long cursor = 0;
        private int placed = 0;
        private int skipped = 0;
        private int blockEntityCursor = 0;
        private boolean blocksDone = false;

        PasteJob(ServerPlayerEntity player, RegionSnapshot snapshot, BlockPos targetMin,
                 boolean includeEntities, Callback callback) {
            this.player = player;
            this.snapshot = snapshot;
            this.targetMin = targetMin;
            this.includeEntities = includeEntities;
            this.callback = callback;
            this.indexStream = new ByteArrayInputStream(snapshot.indices);
        }

        @Override
        public boolean step(long deadlineNanos) {
            ServerWorld world = player.getServerWorld();
            long volume = snapshot.volume();
            BlockPos.Mutable pos = new BlockPos.Mutable();

            if (!blocksDone) {
                while (cursor < volume) {
                    if (System.nanoTime() >= deadlineNanos) {
                        return false;
                    }
                    long i = cursor++;
                    if (!snapshot.isMasked(i)) {
                        continue;
                    }
                    int paletteIdx = RegionSnapshot.readVarInt(indexStream);
                    BlockState state = paletteIdx >= 0 && paletteIdx < snapshot.palette.size()
                            ? snapshot.palette.get(paletteIdx) : null;
                    if (state == null) {
                        skipped++; // block does not exist in this version
                        continue;
                    }
                    int x = (int) (i % snapshot.sizeX);
                    int z = (int) ((i / snapshot.sizeX) % snapshot.sizeZ);
                    int y = (int) (i / ((long) snapshot.sizeX * snapshot.sizeZ));
                    pos.set(targetMin.getX() + x, targetMin.getY() + y, targetMin.getZ() + z);
                    if (world.setBlockState(pos, state, PLACE_FLAGS)) {
                        placed++;
                    } else {
                        skipped++; // e.g. outside world height
                    }
                }
                blocksDone = true;
            }

            // Block entity data (chest contents, sign text, ...).
            while (blockEntityCursor < snapshot.blockEntities.size()) {
                if (System.nanoTime() >= deadlineNanos) {
                    return false;
                }
                NbtCompound nbt = snapshot.blockEntities.get(blockEntityCursor++);
                BlockPos rel = RegionSnapshot.relative(nbt);
                pos.set(targetMin.getX() + rel.getX(), targetMin.getY() + rel.getY(), targetMin.getZ() + rel.getZ());
                BlockEntity be = world.getBlockEntity(pos);
                if (be != null) {
                    try {
                        be.read(nbt, world.getRegistryManager());
                        be.markDirty();
                    } catch (Exception e) {
                        KeepInvEverywhere.LOGGER.warn("Skipping incompatible block entity at {}", pos, e);
                    }
                }
            }

            if (includeEntities) {
                for (NbtCompound stored : snapshot.entities) {
                    NbtCompound nbt = stored.copy();
                    RegionSnapshot.makePosAbsolute(nbt, targetMin);
                    try {
                        Optional<Entity> entity = EntityType.getEntityFromNbt(nbt, world);
                        entity.ifPresent(world::spawnEntity);
                    } catch (Exception e) {
                        KeepInvEverywhere.LOGGER.warn("Skipping incompatible entity", e);
                    }
                }
            }

            callback.done(new Result(true, placed, skipped, System.currentTimeMillis() - startMs));
            return true;
        }
    }
}
