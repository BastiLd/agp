package de.bastild.restoreinv;

import net.minecraft.client.gui.screen.ingame.HandledScreen;
import net.minecraft.client.gui.DrawContext;
import net.minecraft.entity.player.PlayerInventory;
import net.minecraft.text.Text;

/**
 * Client-Screen fuer die "Spieler-Saves" Liste (Admin-Pfad).
 * Tooltips werden ueber die ItemStack-LoreComponent vom Server geliefert,
 * deshalb braucht dieser Screen keine eigene Hover-Render-Logik mehr.
 */
public class PlayerSavesScreen extends HandledScreen<PlayerSavesScreenHandler> {
    public PlayerSavesScreen(PlayerSavesScreenHandler handler, PlayerInventory inventory, Text title) {
        super(handler, inventory, title);
    }

    @Override
    protected void drawBackground(DrawContext context, float delta, int mouseX, int mouseY) {
        // Hintergrund kommt vom HandledScreen-Parent.
    }
}
