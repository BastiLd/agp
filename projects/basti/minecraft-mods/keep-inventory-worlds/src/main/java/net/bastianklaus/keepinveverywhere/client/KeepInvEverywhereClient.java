package net.bastianklaus.keepinveverywhere.client;

import com.mojang.brigadier.Command;
import net.bastianklaus.keepinveverywhere.client.lang.ModLang;
import net.bastianklaus.keepinveverywhere.client.screen.SlotManagerScreen;
import net.bastianklaus.keepinveverywhere.net.ModNetworking;
import net.bastianklaus.keepinveverywhere.region.RegionJobs;
import net.fabricmc.api.ClientModInitializer;
import net.fabricmc.fabric.api.client.command.v2.ClientCommandManager;
import net.fabricmc.fabric.api.client.command.v2.ClientCommandRegistrationCallback;
import net.fabricmc.fabric.api.client.event.lifecycle.v1.ClientTickEvents;
import net.fabricmc.fabric.api.client.keybinding.v1.KeyBindingHelper;
import net.fabricmc.fabric.api.client.networking.v1.ClientPlayNetworking;
import net.minecraft.client.MinecraftClient;
import net.minecraft.client.option.KeyBinding;
import net.minecraft.client.util.InputUtil;
import net.minecraft.text.Text;
import org.lwjgl.glfw.GLFW;

/**
 * Client entrypoint: registers the open-GUI keybind, the {@code /kie} client command and the
 * load-result receiver.
 */
public class KeepInvEverywhereClient implements ClientModInitializer {
    public static final String KEY_CATEGORY = "key.categories.keepinveverywhere";
    public static KeyBinding openMenuKey;

    /** Set by the /kie command; the screen is opened one tick later (after the chat screen closed). */
    private static boolean pendingMenuOpen = false;

    @Override
    public void onInitializeClient() {
        openMenuKey = KeyBindingHelper.registerKeyBinding(new KeyBinding(
                "key.keepinveverywhere.open_menu",
                InputUtil.Type.KEYSYM,
                GLFW.GLFW_KEY_K,
                KEY_CATEGORY
        ));

        ClientCommandRegistrationCallback.EVENT.register((dispatcher, registryAccess) -> {
            for (String alias : new String[]{"kie", "tia"}) {
                dispatcher.register(ClientCommandManager.literal(alias)
                        .executes(ctx -> {
                            pendingMenuOpen = true;
                            return Command.SINGLE_SUCCESS;
                        })
                        .then(ClientCommandManager.literal("debug").executes(ctx -> {
                            for (String line : AxiomBridge.debugReport()) {
                                ctx.getSource().sendFeedback(Text.literal(line));
                            }
                            return Command.SINGLE_SUCCESS;
                        })));
            }
        });

        // Drives multiplayer region copies (client-side world reads, sliced per tick).
        ClientTickEvents.END_CLIENT_TICK.register(client -> RegionJobs.tickClient());

        // Watches the Axiom selection and remembers the last one seen — Axiom clears its tool
        // state when the editor closes, which happens before the user can reach our GUI.
        ClientTickEvents.END_CLIENT_TICK.register(client -> {
            if (client.player != null) {
                AxiomBridge.tickPoll();
            }
        });

        ClientTickEvents.END_CLIENT_TICK.register(client -> {
            while (openMenuKey.wasPressed()) {
                if (client.currentScreen == null) {
                    client.setScreen(new SlotManagerScreen(null));
                }
            }
            if (pendingMenuOpen) {
                pendingMenuOpen = false;
                if (client.currentScreen == null) {
                    client.setScreen(new SlotManagerScreen(null));
                }
            }
        });

        ClientPlayNetworking.registerGlobalReceiver(ModNetworking.LoadResult.ID, (payload, context) -> {
            context.client().execute(() -> onLoadResult(context.client(), payload));
        });
    }

    private static void onLoadResult(MinecraftClient client, ModNetworking.LoadResult result) {
        if (client.player == null) {
            return;
        }
        Text message;
        if (result.success()) {
            if (result.skipped() > 0) {
                message = ModLang.tr("keepinveverywhere.message.loaded_skipped", result.restored(), result.skipped());
            } else {
                message = ModLang.tr(result.messageKey(), result.restored());
            }
        } else {
            message = ModLang.tr(result.messageKey());
        }
        client.player.sendMessage(message, false);
    }
}
