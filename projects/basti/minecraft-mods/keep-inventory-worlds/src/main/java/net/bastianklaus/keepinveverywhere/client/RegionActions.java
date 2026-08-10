package net.bastianklaus.keepinveverywhere.client;

import net.bastianklaus.keepinveverywhere.KeepInvEverywhere;
import net.bastianklaus.keepinveverywhere.client.lang.ModLang;
import net.bastianklaus.keepinveverywhere.config.ModConfig;
import net.bastianklaus.keepinveverywhere.region.RegionJobs;
import net.bastianklaus.keepinveverywhere.region.RegionSnapshot;
import net.bastianklaus.keepinveverywhere.region.RegionStore;
import net.minecraft.client.MinecraftClient;
import net.minecraft.server.MinecraftServer;
import net.minecraft.server.network.ServerPlayerEntity;
import net.minecraft.text.Text;
import net.minecraft.util.math.BlockPos;

/**
 * Client glue for the region (build) feature. Regions can be huge, so nothing goes through
 * network packets.
 *
 * <p><b>Copying</b> works everywhere: in single-player the copy runs on the integrated server
 * (full data incl. chest contents); on multiplayer servers it reads the synced client world
 * directly (blocks, signs etc. — container contents are not synced to clients, and the area must
 * be loaded). <b>Pasting</b> modifies the world and therefore needs the integrated server
 * (single-player / hosting only).
 */
public final class RegionActions {
    private RegionActions() {
    }

    /** Saving a selection only needs a loaded world. */
    public static boolean saveAvailable() {
        return MinecraftClient.getInstance().player != null;
    }

    /** Pasting needs the integrated server (single-player or hosting a LAN world). */
    public static boolean pasteAvailable() {
        MinecraftClient client = MinecraftClient.getInstance();
        return client.player != null && client.getServer() != null;
    }

    public static boolean busy() {
        return RegionJobs.isBusy();
    }

    /** Capture the current Axiom selection/clipboard and save it under the given name. */
    public static void saveSelection(String name) {
        MinecraftClient client = MinecraftClient.getInstance();
        if (client.player == null || client.world == null) {
            return;
        }
        // Priority: live selection (reads the world) → clipboard/placement (the copied blocks
        // themselves, incl. chest contents) → last remembered selection from the watcher.
        var selection = AxiomBridge.captureLive();
        if (selection.isEmpty()) {
            var clipboard = AxiomBridge.captureClipboardSnapshot();
            if (clipboard.isPresent()) {
                RegionSnapshot snap = clipboard.get();
                try {
                    RegionStore.save(name, snap, client.world.getRegistryManager());
                    tellPlayer(ModLang.tr("keepinveverywhere.message.region_saved",
                            name, snap.blockCount(), "0.0"));
                } catch (Exception e) {
                    KeepInvEverywhere.LOGGER.error("Failed to save clipboard region '{}'", name, e);
                    tellPlayer(ModLang.tr("keepinveverywhere.message.region_error"));
                }
                return;
            }
            var remembered = AxiomBridge.getRemembered();
            if (remembered != null) {
                selection = java.util.Optional.of(remembered);
            }
        }
        if (selection.isEmpty()) {
            tellPlayer(ModLang.tr("keepinveverywhere.message.no_selection"));
            return;
        }
        var sel = selection.get();
        boolean includeEntities = ModConfig.get().copyEntities;
        tellPlayer(ModLang.tr("keepinveverywhere.message.region_saving", sel.blockCount()));

        RegionJobs.Callback callback = result -> {
            Text msg;
            if (!result.success()) {
                msg = ModLang.tr("keepinveverywhere.message.region_error");
            } else if (result.skipped() > 0) {
                msg = ModLang.tr("keepinveverywhere.message.region_saved_skipped",
                        name, result.processed(), result.skipped(), formatSeconds(result.millis()));
            } else {
                msg = ModLang.tr("keepinveverywhere.message.region_saved",
                        name, result.processed(), formatSeconds(result.millis()));
            }
            tellPlayerAnyThread(msg);
        };

        MinecraftServer server = client.getServer();
        if (server != null) {
            // Single-player: copy on the server thread with full data (chest contents etc.).
            server.execute(() -> {
                ServerPlayerEntity player = server.getPlayerManager().getPlayer(client.player.getUuid());
                if (player != null) {
                    RegionJobs.startCopy(player.getServerWorld(), name, sel.min(), sel.max(), sel.mask(),
                            includeEntities, false, callback);
                }
            });
        } else {
            // Multiplayer server: read the synced client world (works without server-side mod).
            tellPlayer(ModLang.tr("keepinveverywhere.message.mp_copy_hint"));
            RegionJobs.startCopy(client.world, name, sel.min(), sel.max(), sel.mask(),
                    includeEntities, true, callback);
        }
    }

    /** Queue pasting the named region, centered horizontally on the player (single-player only). */
    public static void paste(String name) {
        MinecraftClient client = MinecraftClient.getInstance();
        MinecraftServer server = client.getServer();
        if (server == null || client.player == null) {
            return;
        }
        var playerUuid = client.player.getUuid();
        boolean includeEntities = ModConfig.get().copyEntities;
        server.execute(() -> {
            ServerPlayerEntity player = server.getPlayerManager().getPlayer(playerUuid);
            if (player == null) {
                return;
            }
            RegionSnapshot snapshot = RegionStore.load(name, player.getRegistryManager());
            if (snapshot == null) {
                player.sendMessage(ModLang.tr("keepinveverywhere.message.not_found"), false);
                return;
            }
            BlockPos p = player.getBlockPos();
            BlockPos targetMin = new BlockPos(p.getX() - snapshot.sizeX / 2, p.getY(), p.getZ() - snapshot.sizeZ / 2);
            player.sendMessage(ModLang.tr("keepinveverywhere.message.region_pasting",
                    name, snapshot.blockCount()), false);
            RegionJobs.startPaste(player, snapshot, targetMin, includeEntities, result -> {
                Text msg = result.skipped() > 0
                        ? ModLang.tr("keepinveverywhere.message.region_pasted_skipped",
                                result.processed(), result.skipped(), formatSeconds(result.millis()))
                        : ModLang.tr("keepinveverywhere.message.region_pasted",
                                result.processed(), formatSeconds(result.millis()));
                player.sendMessage(msg, false);
            });
        });
    }

    private static void tellPlayer(Text message) {
        var player = MinecraftClient.getInstance().player;
        if (player != null) {
            player.sendMessage(message, false);
        }
    }

    /** Safe from both the client and the server thread (used by copy callbacks). */
    private static void tellPlayerAnyThread(Text message) {
        MinecraftClient client = MinecraftClient.getInstance();
        client.execute(() -> {
            if (client.player != null) {
                client.player.sendMessage(message, false);
            }
        });
    }

    private static String formatSeconds(long millis) {
        return String.format("%.1f", millis / 1000.0);
    }
}
