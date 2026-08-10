package net.bastianklaus.keepinveverywhere.mixin.client;

import net.bastianklaus.keepinveverywhere.client.lang.ModLang;
import net.bastianklaus.keepinveverywhere.client.screen.SlotManagerScreen;
import net.minecraft.client.gui.screen.GameMenuScreen;
import net.minecraft.client.gui.screen.Screen;
import net.minecraft.client.gui.tooltip.Tooltip;
import net.minecraft.client.gui.widget.ButtonWidget;
import net.minecraft.text.Text;
import org.spongepowered.asm.mixin.Mixin;
import org.spongepowered.asm.mixin.injection.At;
import org.spongepowered.asm.mixin.injection.Inject;
import org.spongepowered.asm.mixin.injection.callback.CallbackInfo;

/**
 * Adds a small "KIE" button to the top-left of the pause menu (Esc) so the mod's screen is
 * reachable without Mod Menu. Placed in the corner to avoid colliding with the vanilla layout.
 */
@Mixin(GameMenuScreen.class)
public abstract class GameMenuScreenMixin extends Screen {

    protected GameMenuScreenMixin(Text title) {
        super(title);
    }

    @Inject(method = "init", at = @At("TAIL"))
    private void keepinveverywhere$addButton(CallbackInfo ci) {
        GameMenuScreen self = (GameMenuScreen) (Object) this;
        addDrawableChild(ButtonWidget.builder(Text.literal("TIA"),
                        b -> this.client.setScreen(new SlotManagerScreen(self)))
                .dimensions(4, 4, 40, 20)
                .tooltip(Tooltip.of(ModLang.tr("keepinveverywhere.tooltip.pause_button")))
                .build());
    }
}
