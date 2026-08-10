package com.example.creative;

import net.fabricmc.api.ModInitializer;
import net.fabricmc.fabric.api.event.player.UseItemCallback;
import net.minecraft.entity.player.PlayerEntity;
import net.minecraft.item.ItemStack;
import net.minecraft.item.Items;
import net.minecraft.server.network.ServerPlayerEntity;
import net.minecraft.server.world.ServerWorld;
import net.minecraft.util.ActionResult;
import net.minecraft.util.Hand;
import net.minecraft.util.TypedActionResult;
import net.minecraft.world.World;

/**
 * CreativeMod: OPs im Creative Mode können sich mit Farbstoffen unsichtbar machen, sichtbar werden und NoClip aktivieren.
 * Version 1.0.2
 */
public class CreativeMod implements ModInitializer {
    @Override
    public void onInitialize() {
        UseItemCallback.EVENT.register((player, world, hand) -> {
            // Nur serverseitig, nur OPs, nur Creative Mode
            if (!(player instanceof ServerPlayerEntity serverPlayer))
                return TypedActionResult.pass(ItemStack.EMPTY);
            if (!serverPlayer.isCreative())
                return TypedActionResult.pass(ItemStack.EMPTY);
            if (!serverPlayer.hasPermissionLevel(4))
                return TypedActionResult.pass(ItemStack.EMPTY);

            ItemStack stack = serverPlayer.getStackInHand(hand);
            if (stack.isOf(Items.GRAY_DYE)) {
                // Unsichtbar machen
                setInvisible(serverPlayer, true);
                return TypedActionResult.success(stack, world.isClient());
            } else if (stack.isOf(Items.GREEN_DYE)) {
                // Sichtbar machen (nur Unsichtbarkeit aufheben)
                setInvisibleOnly(serverPlayer, false);
                return TypedActionResult.success(stack, world.isClient());
            } else if (stack.isOf(Items.RED_DYE)) {
                // NoClip toggeln
                toggleNoClip(serverPlayer);
                return TypedActionResult.success(stack, world.isClient());
            }
            return TypedActionResult.pass(ItemStack.EMPTY);
        });
    }

    private static void setInvisible(ServerPlayerEntity player, boolean invisible) {
        player.setInvisible(invisible);
    }

    private static void setInvisibleOnly(ServerPlayerEntity player, boolean invisible) {
        player.setInvisible(invisible);
        // NoClip bleibt wie es ist
    }

    private static void toggleNoClip(ServerPlayerEntity player) {
        player.noClip = !player.noClip;
    }
}