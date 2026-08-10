package net.bastianklaus.keepinveverywhere.net;

import net.bastianklaus.keepinveverywhere.KeepInvEverywhere;
import net.fabricmc.fabric.api.networking.v1.PayloadTypeRegistry;
import net.minecraft.network.RegistryByteBuf;
import net.minecraft.network.codec.PacketCodec;
import net.minecraft.network.codec.PacketCodecs;
import net.minecraft.network.packet.CustomPayload;
import net.minecraft.util.Identifier;

/**
 * Networking is intentionally minimal: only <b>loading</b> requires the server (it must set the
 * survival inventory authoritatively). Listing, saving and editing slots are done client-side
 * directly against {@link net.bastianklaus.keepinveverywhere.data.SlotStore}.
 */
public final class ModNetworking {
    private ModNetworking() {
    }

    private static Identifier id(String path) {
        return Identifier.of(KeepInvEverywhere.MOD_ID, path);
    }

    /** C2S: "apply the saved slot with this name to my inventory". */
    public record LoadRequest(String name) implements CustomPayload {
        public static final CustomPayload.Id<LoadRequest> ID = new CustomPayload.Id<>(id("load_request"));
        public static final PacketCodec<RegistryByteBuf, LoadRequest> CODEC =
                PacketCodec.tuple(PacketCodecs.STRING, LoadRequest::name, LoadRequest::new);

        @Override
        public CustomPayload.Id<? extends CustomPayload> getId() {
            return ID;
        }
    }

    /** S2C: result of a load (success + translatable message key + restored/skipped counts). */
    public record LoadResult(boolean success, String messageKey, int restored, int skipped) implements CustomPayload {
        public static final CustomPayload.Id<LoadResult> ID = new CustomPayload.Id<>(id("load_result"));
        public static final PacketCodec<RegistryByteBuf, LoadResult> CODEC = PacketCodec.tuple(
                PacketCodecs.BOOL, LoadResult::success,
                PacketCodecs.STRING, LoadResult::messageKey,
                PacketCodecs.VAR_INT, LoadResult::restored,
                PacketCodecs.VAR_INT, LoadResult::skipped,
                LoadResult::new);

        @Override
        public CustomPayload.Id<? extends CustomPayload> getId() {
            return ID;
        }
    }

    public static void registerPayloads() {
        PayloadTypeRegistry.playC2S().register(LoadRequest.ID, LoadRequest.CODEC);
        PayloadTypeRegistry.playS2C().register(LoadResult.ID, LoadResult.CODEC);
    }
}
