package net.bastianklaus.keepinveverywhere.client;

import com.terraformersmc.modmenu.api.ConfigScreenFactory;
import com.terraformersmc.modmenu.api.ModMenuApi;
import net.bastianklaus.keepinveverywhere.client.screen.SlotManagerScreen;

/** Adds an entry in Mod Menu's mod list that opens the slot manager. */
public class ModMenuIntegration implements ModMenuApi {
    @Override
    public ConfigScreenFactory<?> getModConfigScreenFactory() {
        return SlotManagerScreen::new;
    }
}
