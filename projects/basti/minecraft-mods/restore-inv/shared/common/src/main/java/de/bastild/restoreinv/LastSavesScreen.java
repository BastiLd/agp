package de.bastild.restoreinv;

import net.minecraft.client.gui.screen.ingame.HandledScreen;
import net.minecraft.client.gui.DrawContext;
import net.minecraft.entity.player.PlayerInventory;
import net.minecraft.text.Text;

/**
 * Client-Screen fuer die Last-Saves-Liste.
 * Tooltips werden via ItemStack-LoreComponent vom Server geliefert
 * (siehe {@link LastSavesScreenHandler#makeSaveIcon}). Dadurch ist hier
 * kein Custom-Render mehr noetig.
 */
public class LastSavesScreen extends HandledScreen<LastSavesScreenHandler> {
    public LastSavesScreen(LastSavesScreenHandler handler, PlayerInventory inventory, Text title) {
        super(handler, inventory, title);
    }

    @Override
    protected void drawBackground(DrawContext context, float delta, int mouseX, int mouseY) {
        // Hintergrund kommt vom HandledScreen.
    }
}
