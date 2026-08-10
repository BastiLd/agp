package net.bastianklaus.keepinveverywhere.config;

import me.shedaniel.autoconfig.AutoConfig;
import me.shedaniel.autoconfig.ConfigData;
import me.shedaniel.autoconfig.annotation.Config;
import me.shedaniel.autoconfig.annotation.ConfigEntry;
import me.shedaniel.autoconfig.serializer.GsonConfigSerializer;
import net.bastianklaus.keepinveverywhere.KeepInvEverywhere;

/**
 * Global mod settings, persisted by Cloth Config's AutoConfig into
 * {@code config/keepinveverywhere.json} (shared across all worlds).
 */
@Config(name = KeepInvEverywhere.MOD_ID)
public class ModConfig implements ConfigData {

    @ConfigEntry.Gui.Tooltip
    public boolean keepInventoryEnabled = false;

    @ConfigEntry.Gui.Tooltip
    public boolean keepXp = false;

    @ConfigEntry.Gui.Tooltip
    public boolean confirmOnOverwrite = true;

    @ConfigEntry.Gui.Tooltip
    public boolean copyEntities = false;

    @ConfigEntry.Gui.EnumHandler(option = ConfigEntry.Gui.EnumHandler.EnumDisplayOption.BUTTON)
    @ConfigEntry.Gui.Tooltip
    public LanguageMode languageMode = LanguageMode.AUTO;

    /** Register the config holder once (safe on both client and server). */
    public static void init() {
        AutoConfig.register(ModConfig.class, GsonConfigSerializer::new);
    }

    public static ModConfig get() {
        return AutoConfig.getConfigHolder(ModConfig.class).getConfig();
    }

    public static void save() {
        AutoConfig.getConfigHolder(ModConfig.class).save();
    }
}
