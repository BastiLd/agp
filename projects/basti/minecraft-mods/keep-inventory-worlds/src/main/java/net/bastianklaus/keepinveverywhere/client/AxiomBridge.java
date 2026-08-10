package net.bastianklaus.keepinveverywhere.client;

import net.bastianklaus.keepinveverywhere.KeepInvEverywhere;
import net.bastianklaus.keepinveverywhere.region.RegionSnapshot;
import net.fabricmc.loader.api.FabricLoader;
import net.minecraft.block.BlockState;
import net.minecraft.nbt.NbtCompound;
import net.minecraft.util.math.BlockPos;

import java.io.ByteArrayOutputStream;
import java.lang.reflect.Field;
import java.lang.reflect.Method;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

/**
 * Read-only bridge to Axiom's current selection, via reflection.
 *
 * <p>Three sources are checked, in order (all verified across Axiom 4.3.3 – 5.x):
 * <ol>
 *   <li><b>The Box-Select tool's pending box</b> — private {@code position}/{@code size} fields,
 *       committed to the clipboard selection only on confirm or tool switch.</li>
 *   <li><b>Any tool's pending region</b> — selection tools (Magic Select, Freehand Select, ...)
 *       keep their in-progress selection in a {@code ChunkedBooleanRegion} field. The bridge scans
 *       the current tool's fields generically for that type and reads
 *       {@code min()/max()/count()/contains(x,y,z)}, so it works for every selection tool without
 *       naming each one.</li>
 *   <li><b>The committed clipboard selection</b> ({@code clipboard.Selection}).</li>
 * </ol>
 * Everything is wrapped in try/catch so an incompatible future Axiom version degrades to
 * "no selection" instead of crashing. {@code /kie debug} prints what each step sees.
 */
public final class AxiomBridge {
    private static final String SELECTION_CLASS = "com.moulberry.axiom.clipboard.Selection";
    private static final String TOOL_MANAGER_CLASS = "com.moulberry.axiom.tools.ToolManager";
    private static final String BOX_SELECT_CLASS = "com.moulberry.axiom.tools.box_select.BoxSelectTool";
    private static final String CHUNKED_REGION_CLASS = "com.moulberry.axiom.render.regions.ChunkedBooleanRegion";
    private static final String MODIFY_SELECTION_CLASS = "com.moulberry.axiom.clipboard.ModifySelection";

    private static boolean initialized;
    private static Method getSelectionBuffer;
    private static Method bufferIsEmpty;
    private static Method bufferMin;
    private static Method bufferMax;
    private static Method bufferSize;
    private static Method bufferContains;
    private static Method getCurrentTool;
    private static Field boxPosition;
    private static Field boxSize;
    private static Class<?> chunkedRegionClass;
    private static Method regionMin;
    private static Method regionMax;
    private static Method regionCount;
    private static Method regionContains;
    private static Field modifySelectionRegion;
    private static Field modifyScaledRegion;
    // Clipboard/placement: the copied blocks themselves (Ctrl+C / the "Confirm/Cancel" box).
    private static Object clipboardInstance;
    private static Method clipIsEmpty;
    private static Method clipGet;
    private static Method coBlockRegion;
    private static Method coBlockEntities;
    private static Method coEntities;
    private static Object placementInstance;
    private static Field plBlockRegion;
    private static Field plBlockEntities;
    private static Field plEntities;
    private static Method cbrMin;
    private static Method cbrMax;
    private static Method cbrCount;
    private static Method cbrIsEmpty;
    private static Method cbrGetOrNull;
    private static Method cbeDecompress;
    private static Class<?> chunkedBlockRegionClass;
    // Builder tools (used WITHOUT the editor: Clone/Move/Stack/... — "Scroll to move" box).
    private static Field btmToolsField;
    private static Method btmGetSelected;
    private static Method btGetBox;
    private static Method axBoxPos1;
    private static Method axBoxPos2;

    // --- background watcher state ---------------------------------------------------------
    // Axiom resets tool selections when the editor is closed (which happens the moment the
    // user opens chat or our GUI). So we watch the selection every tick and remember the last
    // one we ever saw; saving falls back to that remembered selection.
    private static SelectionMask lastSeen;
    private static String lastSeenSignature;
    private static String pendingSignature;
    private static int pendingStableTicks;

    private AxiomBridge() {
    }

    /** A cheap live view of whichever selection source is currently non-empty. */
    private record LiveProbe(Object target, Method contains, BlockPos min, BlockPos max, int count) {
        String signature() {
            return min.toShortString() + "|" + max.toShortString() + "|" + count;
        }

        long volume() {
            return (long) (max.getX() - min.getX() + 1)
                    * (max.getY() - min.getY() + 1)
                    * (max.getZ() - min.getZ() + 1);
        }
    }

    /** A captured, immutable snapshot of the Axiom selection shape. */
    public record SelectionMask(BlockPos min, BlockPos max, long[] mask, int blockCount) {
        public int sizeX() {
            return max.getX() - min.getX() + 1;
        }

        public int sizeY() {
            return max.getY() - min.getY() + 1;
        }

        public int sizeZ() {
            return max.getZ() - min.getZ() + 1;
        }
    }

    public static boolean isAxiomLoaded() {
        return FabricLoader.getInstance().isModLoaded("axiom");
    }

    private static boolean ensureInit() {
        if (initialized) {
            return getSelectionBuffer != null;
        }
        initialized = true;
        if (!isAxiomLoaded()) {
            return false;
        }
        try {
            Class<?> selection = Class.forName(SELECTION_CLASS);
            getSelectionBuffer = selection.getMethod("getSelectionBuffer");
            Class<?> buffer = getSelectionBuffer.getReturnType();
            bufferIsEmpty = buffer.getMethod("isEmpty");
            bufferMin = buffer.getMethod("min");
            bufferMax = buffer.getMethod("max");
            bufferSize = buffer.getMethod("size");
            bufferContains = buffer.getMethod("contains", int.class, int.class, int.class);
        } catch (Throwable t) {
            KeepInvEverywhere.LOGGER.warn("Axiom is installed but its selection API is incompatible", t);
            getSelectionBuffer = null;
            return false;
        }
        // Tool-state access is optional: committed selections keep working without it.
        try {
            Class<?> toolManager = Class.forName(TOOL_MANAGER_CLASS);
            getCurrentTool = toolManager.getMethod("getCurrentTool");
        } catch (Throwable t) {
            KeepInvEverywhere.LOGGER.warn("Axiom ToolManager not readable (only committed selections will work)", t);
            getCurrentTool = null;
        }
        try {
            Class<?> boxSelect = Class.forName(BOX_SELECT_CLASS);
            boxPosition = boxSelect.getDeclaredField("position");
            boxPosition.setAccessible(true);
            boxSize = boxSelect.getDeclaredField("size");
            boxSize.setAccessible(true);
        } catch (Throwable t) {
            KeepInvEverywhere.LOGGER.warn("Axiom box-select tool state not readable", t);
            boxPosition = null;
        }
        try {
            chunkedRegionClass = Class.forName(CHUNKED_REGION_CLASS);
            regionMin = chunkedRegionClass.getMethod("min");
            regionMax = chunkedRegionClass.getMethod("max");
            regionCount = chunkedRegionClass.getMethod("count");
            regionContains = chunkedRegionClass.getMethod("contains", int.class, int.class, int.class);
        } catch (Throwable t) {
            KeepInvEverywhere.LOGGER.warn("Axiom ChunkedBooleanRegion not readable", t);
            chunkedRegionClass = null;
        }
        // The "modify selection" state ("Scroll to move / Click to Extend"): after making a
        // selection Axiom parks it in these static fields — it never reaches the Selection
        // buffer until the user finishes the modify mode.
        try {
            Class<?> modify = Class.forName(MODIFY_SELECTION_CLASS);
            modifySelectionRegion = modify.getDeclaredField("selectionRegion");
            modifySelectionRegion.setAccessible(true);
            modifyScaledRegion = modify.getDeclaredField("scaledSelectionRegion");
            modifyScaledRegion.setAccessible(true);
        } catch (Throwable t) {
            KeepInvEverywhere.LOGGER.warn("Axiom ModifySelection state not readable", t);
            modifySelectionRegion = null;
        }
        // Clipboard + placement: lets us read the copied blocks (incl. chest contents) directly,
        // without any selection — covers the Ctrl+C → "Confirm/Cancel placement" workflow.
        // Builder tools (Clone/Move/Stack/... used without the editor): every tool exposes its
        // current box via the public BuilderTool#getBox().
        try {
            Class<?> btm = Class.forName("com.moulberry.axiom.buildertools.BuilderToolManager");
            btmToolsField = btm.getDeclaredField("tools");
            btmToolsField.setAccessible(true);
            btmGetSelected = btm.getMethod("getToolSlotSelected");
            Class<?> bt = Class.forName("com.moulberry.axiom.buildertools.BuilderTool");
            btGetBox = bt.getMethod("getBox");
            Class<?> axBox = Class.forName("com.moulberry.axiom.utils.Box");
            axBoxPos1 = axBox.getMethod("pos1");
            axBoxPos2 = axBox.getMethod("pos2");
        } catch (Throwable t) {
            KeepInvEverywhere.LOGGER.warn("Axiom builder tools not readable", t);
            btmToolsField = null;
        }
        try {
            Class<?> cbr = Class.forName("com.moulberry.axiom.render.regions.ChunkedBlockRegion");
            chunkedBlockRegionClass = cbr;
            cbrMin = cbr.getMethod("min");
            cbrMax = cbr.getMethod("max");
            cbrCount = cbr.getMethod("count");
            cbrIsEmpty = cbr.getMethod("isEmpty");
            cbrGetOrNull = cbr.getMethod("getBlockStateOrNull", int.class, int.class, int.class);

            Class<?> clipboard = Class.forName("com.moulberry.axiom.clipboard.Clipboard");
            clipboardInstance = clipboard.getField("INSTANCE").get(null);
            clipIsEmpty = clipboard.getMethod("isEmpty");
            clipGet = clipboard.getMethod("getClipboard");
            Class<?> co = Class.forName("com.moulberry.axiom.clipboard.ClipboardObject");
            coBlockRegion = co.getMethod("blockRegion");
            coBlockEntities = co.getMethod("blockEntities");
            coEntities = co.getMethod("entities");

            Class<?> cbe = Class.forName("com.moulberry.axiom.world_modification.CompressedBlockEntity");
            cbeDecompress = cbe.getMethod("decompress");

            Class<?> placement = Class.forName("com.moulberry.axiom.clipboard.Placement");
            placementInstance = placement.getField("INSTANCE").get(null);
            plBlockRegion = placement.getDeclaredField("blockRegion");
            plBlockRegion.setAccessible(true);
            plBlockEntities = placement.getDeclaredField("blockEntities");
            plBlockEntities.setAccessible(true);
            plEntities = placement.getDeclaredField("entities");
            plEntities.setAccessible(true);
        } catch (Throwable t) {
            KeepInvEverywhere.LOGGER.warn("Axiom clipboard state not readable", t);
            cbrGetOrNull = null;
        }
        return true;
    }

    /** Probe a static ChunkedBooleanRegion field; null if absent/empty. */
    private static LiveProbe probeStaticRegion(Field field) {
        if (field == null || chunkedRegionClass == null) {
            return null;
        }
        try {
            Object region = field.get(null);
            if (region == null) {
                return null;
            }
            int count = (Integer) regionCount.invoke(region);
            if (count <= 0) {
                return null;
            }
            BlockPos min = (BlockPos) regionMin.invoke(region);
            BlockPos max = (BlockPos) regionMax.invoke(region);
            if (min == null || max == null) {
                return null;
            }
            return new LiveProbe(region, regionContains, min, max, count);
        } catch (Throwable t) {
            return null;
        }
    }

    private static Object currentTool() {
        if (getCurrentTool == null) {
            return null;
        }
        try {
            return getCurrentTool.invoke(null);
        } catch (Throwable t) {
            return null;
        }
    }

    /** All builder tools, selected one first. */
    private static List<Object> builderTools() {
        List<Object> out = new ArrayList<>();
        if (btmToolsField == null) {
            return out;
        }
        try {
            List<?> tools = (List<?>) btmToolsField.get(null);
            if (tools == null || tools.isEmpty()) {
                return out;
            }
            int sel = (Integer) btmGetSelected.invoke(null);
            if (sel >= 0 && sel < tools.size()) {
                out.add(tools.get(sel));
            }
            for (Object t : tools) {
                if (!out.contains(t)) {
                    out.add(t);
                }
            }
        } catch (Throwable ignored) {
        }
        return out;
    }

    /** The box of a builder tool (Clone/Move/Stack/... — the "Scroll to move" box), or null. */
    private static LiveProbe probeBuilderBox() {
        for (Object tool : builderTools()) {
            try {
                Object box = btGetBox.invoke(tool);
                if (box == null) {
                    continue;
                }
                BlockPos p1 = (BlockPos) axBoxPos1.invoke(box);
                BlockPos p2 = (BlockPos) axBoxPos2.invoke(box);
                if (p1 == null || p2 == null) {
                    continue;
                }
                BlockPos min = new BlockPos(Math.min(p1.getX(), p2.getX()),
                        Math.min(p1.getY(), p2.getY()), Math.min(p1.getZ(), p2.getZ()));
                BlockPos max = new BlockPos(Math.max(p1.getX(), p2.getX()),
                        Math.max(p1.getY(), p2.getY()), Math.max(p1.getZ(), p2.getZ()));
                long volume = (long) (max.getX() - min.getX() + 1)
                        * (max.getY() - min.getY() + 1) * (max.getZ() - min.getZ() + 1);
                return new LiveProbe(null, null, min, max, (int) volume);
            } catch (Throwable ignored) {
            }
        }
        return null;
    }

    /** Cheap probe of whichever selection source is currently non-empty (no mask building). */
    private static LiveProbe probeLive() {
        // 0. Builder-tool box (Clone/Move/... used without the editor — "Scroll to move").
        LiveProbe builder = probeBuilderBox();
        if (builder != null) {
            return builder;
        }
        // 1. The "modify selection" state — where an editor selection lives while the user
        // sees it. Scaled variant wins if present.
        LiveProbe modify = probeStaticRegion(modifyScaledRegion);
        if (modify == null) {
            modify = probeStaticRegion(modifySelectionRegion);
        }
        if (modify != null) {
            return modify;
        }
        Object tool = currentTool();
        // 1. Box-Select tool's pending box.
        if (tool != null && boxPosition != null && tool.getClass().getName().equals(BOX_SELECT_CLASS)) {
            try {
                int[] pos = (int[]) boxPosition.get(tool);
                int[] size = (int[]) boxSize.get(tool);
                if (pos != null && size != null && size[0] > 0 && size[1] > 0 && size[2] > 0) {
                    BlockPos min = new BlockPos(pos[0], pos[1], pos[2]);
                    BlockPos max = new BlockPos(pos[0] + size[0] - 1, pos[1] + size[1] - 1, pos[2] + size[2] - 1);
                    return new LiveProbe(null, null, min, max, (int) ((long) size[0] * size[1] * size[2]));
                }
            } catch (Throwable ignored) {
            }
        }
        // 2. Any tool's pending ChunkedBooleanRegion (Magic Select, Freehand Select, ...).
        if (tool != null && chunkedRegionClass != null) {
            try {
                for (Field field : tool.getClass().getDeclaredFields()) {
                    if (!chunkedRegionClass.isAssignableFrom(field.getType())) {
                        continue;
                    }
                    field.setAccessible(true);
                    Object region = field.get(tool);
                    if (region == null) {
                        continue;
                    }
                    int count = (Integer) regionCount.invoke(region);
                    if (count <= 0) {
                        continue;
                    }
                    BlockPos min = (BlockPos) regionMin.invoke(region);
                    BlockPos max = (BlockPos) regionMax.invoke(region);
                    if (min != null && max != null) {
                        return new LiveProbe(region, regionContains, min, max, count);
                    }
                }
            } catch (Throwable ignored) {
            }
        }
        // 3. Committed clipboard selection.
        try {
            Object buffer = getSelectionBuffer.invoke(null);
            if (buffer != null && !(Boolean) bufferIsEmpty.invoke(buffer)) {
                BlockPos min = (BlockPos) bufferMin.invoke(buffer);
                BlockPos max = (BlockPos) bufferMax.invoke(buffer);
                int count = (Integer) bufferSize.invoke(buffer);
                if (min != null && max != null) {
                    return new LiveProbe(buffer, bufferContains, min, max, count);
                }
            }
        } catch (Throwable ignored) {
        }
        return null;
    }

    private static SelectionMask buildFromProbe(LiveProbe probe) throws Exception {
        if (probe.contains() == null || probe.count() >= probe.volume()) {
            return new SelectionMask(probe.min(), probe.max(), null, (int) probe.volume());
        }
        return buildMask(probe.target(), probe.contains(), probe.min(), probe.max(), probe.count());
    }

    /**
     * Background watcher, called every client tick. Once a selection has been stable for one
     * second it is captured and remembered, so it survives Axiom clearing its tool state when
     * the editor closes (e.g. the moment the user opens chat or our GUI).
     */
    public static void tickPoll() {
        if (!isAxiomLoaded() || !ensureInit()) {
            return;
        }
        LiveProbe probe = probeLive();
        if (probe == null) {
            pendingSignature = null;
            pendingStableTicks = 0;
            return;
        }
        String sig = probe.signature();
        if (!sig.equals(pendingSignature)) {
            pendingSignature = sig;
            pendingStableTicks = 0;
            return;
        }
        if (++pendingStableTicks == 20 && !sig.equals(lastSeenSignature)) {
            try {
                lastSeen = buildFromProbe(probe);
                lastSeenSignature = sig;
                KeepInvEverywhere.LOGGER.info("Remembered Axiom selection: {} .. {} ({} blocks)",
                        lastSeen.min(), lastSeen.max(), lastSeen.blockCount());
            } catch (Throwable t) {
                KeepInvEverywhere.LOGGER.warn("Failed to remember Axiom selection", t);
            }
        }
    }

    /** Build a SelectionMask from any object exposing contains(int,int,int). */
    private static SelectionMask buildMask(Object target, Method contains, BlockPos min, BlockPos max,
                                           int count) throws Exception {
        int sx = max.getX() - min.getX() + 1;
        int sy = max.getY() - min.getY() + 1;
        int sz = max.getZ() - min.getZ() + 1;
        long volume = (long) sx * sy * sz;
        if (count >= volume) {
            return new SelectionMask(min, max, null, (int) volume);
        }
        long[] mask = new long[(int) ((volume + 63) / 64)];
        int set = 0;
        long index = 0;
        for (int y = min.getY(); y <= max.getY(); y++) {
            for (int z = min.getZ(); z <= max.getZ(); z++) {
                for (int x = min.getX(); x <= max.getX(); x++, index++) {
                    if ((Boolean) contains.invoke(target, x, y, z)) {
                        mask[(int) (index >>> 6)] |= 1L << (index & 63);
                        set++;
                    }
                }
            }
        }
        return new SelectionMask(min, max, mask, set);
    }

    /** [region, blockEntities(Long2ObjectMap), entities(List)] of placement or clipboard, or null. */
    private static Object[] activeClipboardContent() {
        if (cbrGetOrNull == null) {
            return null;
        }
        try {
            // Active placement first (matches what the user sees, including rotation/flip).
            if (placementInstance != null) {
                Object region = plBlockRegion.get(placementInstance);
                if (region != null && !(Boolean) cbrIsEmpty.invoke(region)) {
                    return new Object[]{region, plBlockEntities.get(placementInstance), plEntities.get(placementInstance)};
                }
            }
            if (clipboardInstance != null && !(Boolean) clipIsEmpty.invoke(clipboardInstance)) {
                Object co = clipGet.invoke(clipboardInstance);
                if (co != null) {
                    Object region = coBlockRegion.invoke(co);
                    if (region != null && !(Boolean) cbrIsEmpty.invoke(region)) {
                        return new Object[]{region, coBlockEntities.invoke(co), coEntities.invoke(co)};
                    }
                }
            }
            // Blocks carried by a builder tool (e.g. a picked-up Clone): generic field scan.
            if (chunkedBlockRegionClass != null) {
                for (Object tool : builderTools()) {
                    Object region = null;
                    Object beMap = null;
                    for (Field field : tool.getClass().getDeclaredFields()) {
                        if (chunkedBlockRegionClass.isAssignableFrom(field.getType())) {
                            field.setAccessible(true);
                            Object r = field.get(tool);
                            if (r != null && !(Boolean) cbrIsEmpty.invoke(r)) {
                                region = r;
                            }
                        } else if (Map.class.isAssignableFrom(field.getType())) {
                            field.setAccessible(true);
                            Object m = field.get(tool);
                            if (m instanceof Map<?, ?> map && !map.isEmpty()
                                    && map.values().iterator().next().getClass().getName().endsWith("CompressedBlockEntity")) {
                                beMap = m;
                            }
                        }
                    }
                    if (region != null) {
                        return new Object[]{region, beMap, null};
                    }
                }
            }
        } catch (Throwable ignored) {
        }
        return null;
    }

    public static boolean hasClipboard() {
        return ensureInit() && activeClipboardContent() != null;
    }

    /**
     * Build a snapshot directly from the copied blocks in Axiom's placement/clipboard —
     * full data including chest contents, no selection and no world read needed.
     */
    public static Optional<RegionSnapshot> captureClipboardSnapshot() {
        if (!ensureInit()) {
            return Optional.empty();
        }
        Object[] content = activeClipboardContent();
        if (content == null) {
            return Optional.empty();
        }
        try {
            Object region = content[0];
            BlockPos min = (BlockPos) cbrMin.invoke(region);
            BlockPos max = (BlockPos) cbrMax.invoke(region);

            RegionSnapshot snap = new RegionSnapshot();
            snap.sizeX = max.getX() - min.getX() + 1;
            snap.sizeY = max.getY() - min.getY() + 1;
            snap.sizeZ = max.getZ() - min.getZ() + 1;
            long volume = snap.volume();
            long[] mask = new long[(int) ((volume + 63) / 64)];
            Map<BlockState, Integer> paletteLookup = new HashMap<>();
            ByteArrayOutputStream indices = new ByteArrayOutputStream();
            long index = 0;
            long set = 0;
            for (int y = min.getY(); y <= max.getY(); y++) {
                for (int z = min.getZ(); z <= max.getZ(); z++) {
                    for (int x = min.getX(); x <= max.getX(); x++, index++) {
                        BlockState state = (BlockState) cbrGetOrNull.invoke(region, x, y, z);
                        if (state == null) {
                            continue;
                        }
                        mask[(int) (index >>> 6)] |= 1L << (index & 63);
                        set++;
                        Integer paletteIdx = paletteLookup.get(state);
                        if (paletteIdx == null) {
                            paletteIdx = snap.palette.size();
                            snap.palette.add(state);
                            paletteLookup.put(state, paletteIdx);
                        }
                        RegionSnapshot.writeVarInt(indices, paletteIdx);
                    }
                }
            }
            snap.mask = set >= volume ? null : mask;
            snap.indices = indices.toByteArray();

            // Block entities: Long2ObjectMap<CompressedBlockEntity> keyed by packed BlockPos.
            if (content[1] instanceof Map<?, ?> beMap) {
                for (Map.Entry<?, ?> e : beMap.entrySet()) {
                    try {
                        BlockPos pos = BlockPos.fromLong((Long) e.getKey());
                        NbtCompound nbt = (NbtCompound) cbeDecompress.invoke(e.getValue());
                        nbt.putInt("x", pos.getX() - min.getX());
                        nbt.putInt("y", pos.getY() - min.getY());
                        nbt.putInt("z", pos.getZ() - min.getZ());
                        snap.blockEntities.add(nbt);
                    } catch (Throwable t) {
                        KeepInvEverywhere.LOGGER.warn("Skipping unreadable clipboard block entity", t);
                    }
                }
            }
            if (content[2] instanceof List<?> entityList) {
                for (Object o : entityList) {
                    if (o instanceof NbtCompound nbt) {
                        NbtCompound copy = nbt.copy();
                        RegionSnapshot.makePosRelative(copy, min);
                        snap.entities.add(copy);
                    }
                }
            }
            KeepInvEverywhere.LOGGER.info("Captured Axiom clipboard: {} blocks, {} block entities, {} entities",
                    set, snap.blockEntities.size(), snap.entities.size());
            return Optional.of(snap);
        } catch (Throwable t) {
            KeepInvEverywhere.LOGGER.error("Failed to capture Axiom clipboard", t);
            return Optional.empty();
        }
    }

    /** True if there is a live selection, a remembered one, or copied blocks in the clipboard. */
    public static boolean hasSelection() {
        if (!ensureInit()) {
            return false;
        }
        return probeLive() != null || lastSeen != null || activeClipboardContent() != null;
    }

    /** The live selection only (built fresh), or empty. */
    public static Optional<SelectionMask> captureLive() {
        if (!ensureInit()) {
            return Optional.empty();
        }
        LiveProbe probe = probeLive();
        if (probe == null) {
            return Optional.empty();
        }
        try {
            return Optional.of(buildFromProbe(probe));
        } catch (Throwable t) {
            KeepInvEverywhere.LOGGER.warn("Failed to capture live Axiom selection", t);
            return Optional.empty();
        }
    }

    /** The last selection the background watcher saw, or null. */
    public static SelectionMask getRemembered() {
        return lastSeen;
    }

    /**
     * Capture the selection to save (run on the client thread): the live selection if one
     * exists, otherwise the last selection the background watcher remembered.
     */
    public static Optional<SelectionMask> captureSelection() {
        if (!ensureInit()) {
            return Optional.empty();
        }
        LiveProbe probe = probeLive();
        if (probe != null) {
            try {
                SelectionMask live = buildFromProbe(probe);
                KeepInvEverywhere.LOGGER.info("Using live Axiom selection: {} .. {} ({} blocks)",
                        live.min(), live.max(), live.blockCount());
                return Optional.of(live);
            } catch (Throwable t) {
                KeepInvEverywhere.LOGGER.warn("Failed to capture live Axiom selection", t);
            }
        }
        if (lastSeen != null) {
            KeepInvEverywhere.LOGGER.info("Using remembered Axiom selection: {} .. {} ({} blocks)",
                    lastSeen.min(), lastSeen.max(), lastSeen.blockCount());
            return Optional.of(lastSeen);
        }
        return Optional.empty();
    }

    /** Step-by-step status report for the {@code /kie debug} command. */
    public static List<String> debugReport() {
        List<String> out = new ArrayList<>();
        out.add("Axiom loaded: " + isAxiomLoaded());
        if (!isAxiomLoaded()) {
            return out;
        }
        out.add("Selection API init: " + (ensureInit() ? "OK" : "FAILED (see log)"));
        if (!ensureInit()) {
            return out;
        }
        try {
            LiveProbe builder = probeBuilderBox();
            out.add("Builder-tool box: " + (builder == null ? "none"
                    : builder.min().toShortString() + " .. " + builder.max().toShortString()));
        } catch (Throwable t) {
            out.add("Builder-tool box: ERROR " + t.getClass().getSimpleName());
        }
        try {
            Object[] content = activeClipboardContent();
            if (content == null) {
                out.add("Clipboard/placement: empty");
            } else {
                out.add("Clipboard/placement: count=" + cbrCount.invoke(content[0])
                        + " min=" + cbrMin.invoke(content[0]) + " max=" + cbrMax.invoke(content[0]));
            }
        } catch (Throwable t) {
            out.add("Clipboard/placement: ERROR " + t.getClass().getSimpleName());
        }
        try {
            LiveProbe modify = probeStaticRegion(modifySelectionRegion);
            LiveProbe scaled = probeStaticRegion(modifyScaledRegion);
            out.add("ModifySelection region: " + (modify == null ? "empty"
                    : modify.min().toShortString() + " .. " + modify.max().toShortString() + " count=" + modify.count())
                    + (scaled != null ? " (scaled: count=" + scaled.count() + ")" : ""));
        } catch (Throwable t) {
            out.add("ModifySelection region: ERROR " + t.getClass().getSimpleName());
        }
        Object tool = currentTool();
        out.add("Current tool: " + (tool == null ? "none" : tool.getClass().getSimpleName()));
        try {
            if (tool != null && boxPosition != null && tool.getClass().getName().equals(BOX_SELECT_CLASS)) {
                out.add("  box position: " + Arrays.toString((int[]) boxPosition.get(tool)));
                out.add("  box size: " + Arrays.toString((int[]) boxSize.get(tool)));
            }
            if (tool != null && chunkedRegionClass != null) {
                for (Field field : tool.getClass().getDeclaredFields()) {
                    if (chunkedRegionClass.isAssignableFrom(field.getType())) {
                        field.setAccessible(true);
                        Object region = field.get(tool);
                        out.add("  region field '" + field.getName() + "': " + (region == null ? "null"
                                : "count=" + regionCount.invoke(region)));
                    }
                }
            }
        } catch (Throwable t) {
            out.add("  tool state: ERROR " + t.getClass().getSimpleName() + ": " + t.getMessage());
        }
        try {
            Object buffer = getSelectionBuffer.invoke(null);
            if (buffer == null) {
                out.add("Committed selection: null buffer");
            } else {
                boolean empty = (Boolean) bufferIsEmpty.invoke(buffer);
                out.add("Committed selection: " + buffer.getClass().getSimpleName() + ", empty=" + empty);
                if (!empty) {
                    out.add("  min=" + bufferMin.invoke(buffer) + " max=" + bufferMax.invoke(buffer)
                            + " count=" + bufferSize.invoke(buffer));
                }
            }
        } catch (Throwable t) {
            out.add("Committed selection: ERROR " + t.getClass().getSimpleName() + ": " + t.getMessage());
        }
        out.add("Remembered selection: " + (lastSeen == null ? "none"
                : lastSeen.min().toShortString() + " .. " + lastSeen.max().toShortString()
                        + " (" + lastSeen.blockCount() + " blocks)"));
        SelectionMask result = captureSelection().orElse(null);
        out.add("=> captureSelection: " + (result == null ? "EMPTY"
                : result.min().toShortString() + " .. " + result.max().toShortString()
                        + " (" + result.blockCount() + " blocks)"));
        return out;
    }
}
