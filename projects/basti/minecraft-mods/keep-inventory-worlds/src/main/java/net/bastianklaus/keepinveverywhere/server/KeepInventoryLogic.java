package net.bastianklaus.keepinveverywhere.server;

import net.bastianklaus.keepinveverywhere.config.ModConfig;
import net.minecraft.entity.player.PlayerEntity;
import net.minecraft.world.GameRules;

/** Shared decision: should this player's inventory survive death? */
public final class KeepInventoryLogic {
    private KeepInventoryLogic() {
    }

    /**
     * True when our independent toggle is on, OR the vanilla {@code keepInventory} gamerule is set.
     * This keeps the mod's behaviour additive and never fights the gamerule.
     */
    public static boolean shouldKeep(PlayerEntity player) {
        if (player == null) {
            return false;
        }
        if (ModConfig.get().keepInventoryEnabled) {
            return true;
        }
        return player.getWorld().getGameRules().getBoolean(GameRules.KEEP_INVENTORY);
    }
}
