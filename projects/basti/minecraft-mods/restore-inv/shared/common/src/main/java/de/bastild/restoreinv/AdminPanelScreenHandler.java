package de.bastild.restoreinv;

import net.minecraft.entity.player.PlayerEntity;
import net.minecraft.entity.player.PlayerInventory;
import net.minecraft.inventory.SimpleInventory;
import net.minecraft.item.ItemStack;
import net.minecraft.item.Items;
import net.minecraft.screen.GenericContainerScreenHandler;
import net.minecraft.screen.ScreenHandlerType;
import net.minecraft.screen.slot.SlotActionType;
import net.minecraft.screen.SimpleNamedScreenHandlerFactory;
import net.minecraft.server.MinecraftServer;
import net.minecraft.text.Text;
import net.minecraft.component.DataComponentTypes;
import net.minecraft.component.type.LoreComponent;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

public class AdminPanelScreenHandler extends GenericContainerScreenHandler {
    public final RestoreInvStorage storage;
    public final PlayerEntity player;
    private final List<UUID> slotToUuid = new ArrayList<>();

    public AdminPanelScreenHandler(int syncId, PlayerInventory playerInventory, RestoreInvStorage storage,
            PlayerEntity player) {
        super(ScreenHandlerType.GENERIC_9X3, syncId, playerInventory, new SimpleInventory(9 * 3), 3);
        this.storage = storage;
        this.player = player;
        populate();
    }

    private void populate() {
        ItemStack back = new ItemStack(Items.ARROW);
        back.set(DataComponentTypes.CUSTOM_NAME, Text.translatable("restoreinv.gui.back"));
        this.getInventory().setStack(0, back);

        slotToUuid.clear();
        int idx = 1;
        for (UUID uuid : storage.getKnownPlayers()) {
            if (idx >= this.getInventory().size()) break;
            ItemStack head = new ItemStack(Items.PLAYER_HEAD);
            String name = resolveDisplayName(uuid);
            head.set(DataComponentTypes.CUSTOM_NAME, Text.literal(name));
            head.set(DataComponentTypes.LORE, new LoreComponent(List.of(
                    Text.translatable("restoreinv.gui.player_uuid", uuid.toString()),
                    Text.translatable("restoreinv.gui.player_saves_hint"))));
            this.getInventory().setStack(idx, head);
            slotToUuid.add(uuid);
            idx++;
        }
    }

    private String resolveDisplayName(UUID uuid) {
        if (player instanceof net.minecraft.server.network.ServerPlayerEntity sp) {
            MinecraftServer s = PlatformCompat.serverOf(sp);
            if (s != null) {
                net.minecraft.server.network.ServerPlayerEntity online = s.getPlayerManager().getPlayer(uuid);
                if (online != null) {
                    String n = PlatformCompat.profileName(online.getGameProfile());
                    if (n != null && !n.isEmpty()) return n;
                }
            }
        }
        return uuid.toString().substring(0, 8);
    }

    @Override
    public void onSlotClick(int slotIndex, int button, SlotActionType actionType, PlayerEntity player) {
        // Admin-Panel ist rein administrativ: nur Berechtigte duerfen interagieren.
        if (!(player instanceof net.minecraft.server.network.ServerPlayerEntity admin)
                || !PermissionGate.canAdminister(admin)) {
            return;
        }
        if (slotIndex == 0) {
            if (player instanceof net.minecraft.server.network.ServerPlayerEntity sp) {
                storage.openConfigScreen(sp);
            }
            return;
        }
        int listIndex = slotIndex - 1;
        if (listIndex < 0 || listIndex >= slotToUuid.size()) return;
        UUID target = slotToUuid.get(listIndex);
        if (player instanceof net.minecraft.server.network.ServerPlayerEntity sp) {
            sp.openHandledScreen(new SimpleNamedScreenHandlerFactory(
                    (syncId, inv, p) -> new PlayerSavesScreenHandler(syncId, inv, storage, p, target),
                    Text.translatable("restoreinv.gui.player_saves")));
        }
    }
}
