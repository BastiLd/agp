package de.bastild.restoreinv;

import net.minecraft.client.gui.screen.ingame.HandledScreen;
import net.minecraft.client.gui.DrawContext;
import net.minecraft.entity.player.PlayerInventory;
import net.minecraft.text.Text;

public class RestoreInvConfigScreen extends HandledScreen<RestoreInvConfigScreenHandler> {
    public RestoreInvConfigScreen(RestoreInvConfigScreenHandler handler, PlayerInventory inventory, Text title) {
        super(handler, inventory, title);
    }

    @Override
    protected void drawBackground(DrawContext context, float delta, int mouseX, int mouseY) {
        // Hintergrund vom Parent.
    }
}
