package net.bastianklaus.keepinveverywhere.mixin;

import net.bastianklaus.keepinveverywhere.server.KeepInventoryLogic;
import net.minecraft.entity.player.PlayerEntity;
import org.spongepowered.asm.mixin.Mixin;
import org.spongepowered.asm.mixin.injection.At;
import org.spongepowered.asm.mixin.injection.Inject;
import org.spongepowered.asm.mixin.injection.callback.CallbackInfo;

/**
 * Cancels the on-death inventory drop when our keep-inventory behaviour is active, so the items
 * remain on the dying player and can be copied onto the respawned player (see
 * {@code ServerPlayerEvents.COPY_FROM} in the main initializer).
 */
@Mixin(PlayerEntity.class)
public abstract class PlayerEntityDropMixin {

    @Inject(method = "dropInventory", at = @At("HEAD"), cancellable = true)
    private void keepinveverywhere$cancelDrop(CallbackInfo ci) {
        PlayerEntity self = (PlayerEntity) (Object) this;
        if (!self.getWorld().isClient() && KeepInventoryLogic.shouldKeep(self)) {
            ci.cancel();
        }
    }
}
