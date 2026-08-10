package com.example.mixin;

import net.minecraft.client.MinecraftClient;
import net.minecraft.client.Mouse;
import net.minecraft.entity.player.PlayerInventory;
import net.minecraft.item.ItemStack;
import org.spongepowered.asm.mixin.Mixin;
import org.spongepowered.asm.mixin.injection.At;
import org.spongepowered.asm.mixin.injection.Inject;
import org.spongepowered.asm.mixin.injection.callback.CallbackInfoReturnable;

@Mixin(Mouse.class)
public class MouseMixin {
    private int scrollIndex = 0; // 0 = Hotbar, 1 = InvRow1, 2 = InvRow2
    private int lastHotbarSlot = 0;

    @Inject(method = "method_1598", at = @At("HEAD"), cancellable = true)
    private void onMouseScroll(long window, double horizontal, double vertical, CallbackInfoReturnable<Boolean> cir) {
        MinecraftClient client = MinecraftClient.getInstance();
        if (client.currentScreen == null && vertical != 0) {
            PlayerInventory inv = client.player.getInventory();
            int hotbarSlot = inv.selectedSlot;
            if (hotbarSlot != lastHotbarSlot) {
                scrollIndex = 0;
                lastHotbarSlot = hotbarSlot;
            }
            int col = hotbarSlot;
            int[] slots = { hotbarSlot, col + 9, col + 18 };
            int steps = (int) Math.abs(vertical);
            boolean up = vertical > 0;
            for (int i = 0; i < steps; i++) {
                if (up) {
                    scrollIndex = (scrollIndex + 2) % 3;
                } else {
                    scrollIndex = (scrollIndex + 1) % 3;
                }
                int from = slots[scrollIndex];
                int to = slots[0];
                ItemStack tmp = inv.getStack(from).copy();
                inv.setStack(from, inv.getStack(to));
                inv.setStack(to, tmp);
            }
            cir.setReturnValue(true);
        }
    }
}