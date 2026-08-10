package de.bastild.restoreinv;

import net.fabricmc.api.ModInitializer;
import net.fabricmc.fabric.api.command.v2.CommandRegistrationCallback;
import net.fabricmc.fabric.api.event.lifecycle.v1.ServerLifecycleEvents;
import net.fabricmc.fabric.api.event.lifecycle.v1.ServerTickEvents;
import net.fabricmc.fabric.api.entity.event.v1.ServerLivingEntityEvents;
import net.fabricmc.fabric.api.networking.v1.ServerPlayConnectionEvents;

import net.minecraft.server.MinecraftServer;
import net.minecraft.server.command.CommandManager;
import net.minecraft.server.command.ServerCommandSource;
import net.minecraft.server.network.ServerPlayerEntity;
import net.minecraft.text.Text;

public class RestoreInvMod implements ModInitializer {

    public static final String MOD_ID = "restoreinv";
    private static final org.slf4j.Logger LOGGER = org.slf4j.LoggerFactory.getLogger(MOD_ID);

    private final RestoreInvStorage storage = new RestoreInvStorage();
    private MinecraftServer currentServer;

    // Tick-Counter pro Slot, damit Auto-Save serverseitig laeuft.
    private long ticksUntilSlot1 = 0;
    private long ticksUntilSlot2 = 0;

    @Override
    public void onInitialize() {
        // ===== Server-Start: Config laden, Initial-Saves =====
        ServerLifecycleEvents.SERVER_STARTED.register(server -> {
            currentServer = server;
            storage.loadConfig(server);
            ticksUntilSlot1 = 20L * 60 * Math.max(1, storage.autoSaveInterval1);
            ticksUntilSlot2 = 20L * 60 * Math.max(1, storage.autoSaveInterval2);
            for (ServerPlayerEntity player : storage.getOnlinePlayers(server)) {
                storage.saveInventory(player, RestoreInvStorage.SLOT_AUTO1);
                storage.saveInventory(player, RestoreInvStorage.SLOT_AUTO2);
                storage.onPlayerJoin(player.getUuid(), server);
            }
        });

        ServerLifecycleEvents.SERVER_STOPPING.register(server -> {
            storage.saveConfig();
            storage.shutdown();
            currentServer = null;
        });

        // ===== Spieler-Join: Last-Saves laden =====
        ServerPlayConnectionEvents.JOIN.register((handler, sender, server) -> {
            storage.onPlayerJoin(handler.getPlayer().getUuid(), server);
        });

        // ===== Auto-Save bei Tod (eigener Death-Slot) =====
        ServerLivingEntityEvents.ALLOW_DEATH.register((entity, damageSource, damageAmount) -> {
            if (entity instanceof ServerPlayerEntity sp && storage.autoSaveOnDeath) {
                try {
                    storage.saveInventory(sp, RestoreInvStorage.SLOT_DEATH);
                } catch (Throwable t) {
                    // Defensive: Save-Fehler darf den Tod nicht blockieren.
                    LOGGER.warn("Death-Save fehlgeschlagen", t);
                }
            }
            return true; // Tod nicht verhindern.
        });

        // ===== Server-Tick: Auto-Save Slot 1 + 2 =====
        ServerTickEvents.END_SERVER_TICK.register(server -> {
            if (storage.getOnlinePlayers(server).isEmpty()) {
                return;
            }
            ticksUntilSlot1--;
            ticksUntilSlot2--;
            if (ticksUntilSlot1 <= 0) {
                for (ServerPlayerEntity p : storage.getOnlinePlayers(server)) {
                    storage.saveInventory(p, RestoreInvStorage.SLOT_AUTO1);
                }
                ticksUntilSlot1 = 20L * 60 * Math.max(1, storage.autoSaveInterval1);
            }
            if (ticksUntilSlot2 <= 0) {
                for (ServerPlayerEntity p : storage.getOnlinePlayers(server)) {
                    storage.saveInventory(p, RestoreInvStorage.SLOT_AUTO2);
                }
                ticksUntilSlot2 = 20L * 60 * Math.max(1, storage.autoSaveInterval2);
            }
        });

        // ===== Befehle =====
        CommandRegistrationCallback.EVENT.register((dispatcher, registryAccess, environment) -> {
            com.mojang.brigadier.tree.LiteralCommandNode<ServerCommandSource> root =
                    dispatcher.register(CommandManager.literal("restoreinv")
                    .then(CommandManager.literal("1").executes(ctx -> tryRestore(ctx.getSource(), RestoreInvStorage.SLOT_AUTO1)))
                    .then(CommandManager.literal("2").executes(ctx -> tryRestore(ctx.getSource(), RestoreInvStorage.SLOT_AUTO2)))
                    .then(CommandManager.literal("3").executes(ctx -> tryRestore(ctx.getSource(), RestoreInvStorage.SLOT_MANUAL)))
                    .then(CommandManager.literal("4").executes(ctx -> tryRestore(ctx.getSource(), RestoreInvStorage.SLOT_DEATH)))
                    .then(CommandManager.literal("save").executes(ctx -> {
                        ServerPlayerEntity p = ctx.getSource().getPlayer();
                        if (p != null) {
                            storage.saveInventory(p, RestoreInvStorage.SLOT_MANUAL);
                            ctx.getSource().sendMessage(Text.translatable("restoreinv.msg.saved_manual"));
                        }
                        return 1;
                    }))
                    .then(CommandManager.literal("undo").executes(ctx -> {
                        ServerPlayerEntity p = ctx.getSource().getPlayer();
                        if (p == null) return 0;
                        if (!storage.canRestore(p)) {
                            ctx.getSource().sendError(Text.translatable("restoreinv.msg.no_permission_restore"));
                            return 0;
                        }
                        if (storage.restoreUndo(p)) {
                            ctx.getSource().sendMessage(Text.translatable("restoreinv.msg.undo_done"));
                        } else {
                            ctx.getSource().sendError(Text.translatable("restoreinv.msg.undo_none"));
                        }
                        return 1;
                    }))
                    .then(CommandManager.literal("saves").executes(ctx -> {
                        ServerPlayerEntity p = ctx.getSource().getPlayer();
                        if (p != null) {
                            p.openHandledScreen(new net.minecraft.screen.SimpleNamedScreenHandlerFactory(
                                    (syncId, inv, pl) -> new LastSavesScreenHandler(syncId, inv, storage, pl),
                                    Text.translatable("restoreinv.gui.last_saves")));
                        }
                        return 1;
                    }))
                    .then(CommandManager.literal("config")
                            .requires(src -> PermissionGate.canAdminister(src))
                            .executes(ctx -> {
                                ServerPlayerEntity p = ctx.getSource().getPlayer();
                                if (p != null) storage.openConfigScreen(p);
                                return 1;
                            }))
                    .then(CommandManager.literal("version").executes(ctx -> {
                        String v = net.fabricmc.loader.api.FabricLoader.getInstance()
                                .getModContainer(MOD_ID)
                                .map(c -> c.getMetadata().getVersion().getFriendlyString())
                                .orElse("?");
                        ctx.getSource().sendMessage(Text.translatable("restoreinv.msg.version", v,
                                ctx.getSource().getServer().getVersion()));
                        return 1;
                    })));

            // Aliase: kurzer Name + alter camelCase-Name (Abwaertskompatibilitaet).
            dispatcher.register(CommandManager.literal("rinv").redirect(root));
            dispatcher.register(CommandManager.literal("restoreInv").redirect(root));
        });
    }

    private int tryRestore(ServerCommandSource source, int slot) {
        ServerPlayerEntity p = source.getPlayer();
        if (p == null) return 0;
        if (!storage.canRestore(p)) {
            source.sendError(Text.translatable("restoreinv.msg.no_permission_restore"));
            return 0;
        }
        storage.restoreInventory(p, slot);
        source.sendMessage(Text.translatable("restoreinv.msg.restored_slot", RestoreInvStorage.slotName(slot)));
        return 1;
    }
}
