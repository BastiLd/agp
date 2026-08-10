package net.bastianklaus.keepinveverywhere.client.lang;

import com.google.gson.Gson;
import com.google.gson.reflect.TypeToken;
import net.bastianklaus.keepinveverywhere.KeepInvEverywhere;
import net.bastianklaus.keepinveverywhere.config.LanguageMode;
import net.bastianklaus.keepinveverywhere.config.ModConfig;
import net.minecraft.text.Text;

import java.io.InputStream;
import java.io.InputStreamReader;
import java.lang.reflect.Type;
import java.nio.charset.StandardCharsets;
import java.util.Collections;
import java.util.Map;

/**
 * Localisation helper.
 * <p>In {@link LanguageMode#AUTO} the game's own resource-pack translation is used (so the UI
 * follows the client locale automatically, including German). When the user forces a language,
 * we resolve strings from our own bundled lang maps instead, overriding the game locale.
 */
public final class ModLang {
    private static final Gson GSON = new Gson();
    private static final Type MAP_TYPE = new TypeToken<Map<String, String>>() {}.getType();

    private static final Map<String, String> EN = load("en_us");
    private static final Map<String, String> DE = load("de_de");

    private ModLang() {
    }

    private static Map<String, String> load(String code) {
        String path = "/assets/" + KeepInvEverywhere.MOD_ID + "/lang/" + code + ".json";
        try (InputStream in = ModLang.class.getResourceAsStream(path)) {
            if (in == null) {
                return Collections.emptyMap();
            }
            Map<String, String> map = GSON.fromJson(new InputStreamReader(in, StandardCharsets.UTF_8), MAP_TYPE);
            return map == null ? Collections.emptyMap() : map;
        } catch (Exception e) {
            KeepInvEverywhere.LOGGER.error("Failed to load bundled lang '{}'", code, e);
            return Collections.emptyMap();
        }
    }

    /** Translate a key, honouring the manual language override. */
    public static Text tr(String key, Object... args) {
        LanguageMode mode = ModConfig.get().languageMode;
        if (mode == LanguageMode.AUTO) {
            return Text.translatable(key, args);
        }
        Map<String, String> map = mode == LanguageMode.GERMAN ? DE : EN;
        String pattern = map.getOrDefault(key, key);
        try {
            return Text.literal(args.length == 0 ? pattern : String.format(pattern, args));
        } catch (Exception e) {
            return Text.literal(pattern);
        }
    }
}
