package de.bastild.restoreinv;

import net.minecraft.client.gui.screen.ingame.HandledScreen;
import net.minecraft.client.gui.DrawContext;
import net.minecraft.entity.player.PlayerInventory;
import net.minecraft.text.Text;

public class AdminPanelScreen extends HandledScreen<AdminPanelScreenHandler> {
    public AdminPanelScreen(AdminPanelScreenHandler handler, PlayerInventory inventory, Text title) {
        super(handler, inventory, title);
    }

    @Override
    protected void init() {
        super.init();
    }

    @Override
    public void removed() {
        long window = org.lwjgl.glfw.GLFW.glfwGetCurrentContext();
        double[] xpos = new double[1];
        double[] ypos = new double[1];
        org.lwjgl.glfw.GLFW.glfwGetCursorPos(window, xpos, ypos);
        super.removed();
    }

    @Override
    protected void drawBackground(DrawContext context, float delta, int mouseX, int mouseY) {
        // Optional: Custom background rendering
    }
}
