package de.bastild.restoreinv;

import com.mojang.authlib.GameProfile;
import net.minecraft.entity.player.PlayerInventory;
import net.minecraft.inventory.Inventories;
import net.minecraft.item.ItemStack;
import net.minecraft.nbt.NbtCompound;
import net.minecraft.nbt.NbtList;
import net.minecraft.registry.RegistryWrapper;
import net.minecraft.server.MinecraftServer;
import net.minecraft.server.PlayerConfigEntry;
import net.minecraft.server.network.ServerPlayerEntity;
import net.minecraft.storage.NbtReadView;
import net.minecraft.storage.NbtWriteView;
import net.minecraft.storage.ReadView;
import net.minecraft.util.ErrorReporter;
import net.minecraft.util.collection.DefaultedList;

/**
 * Versions-spezifische Bruecke fuer Minecraft 1.21.9+ (neue NBT-/Storage-API).
 * Die gesamte API-Divergenz gegenueber dem alten Tree ({@code shared/api-old})
 * steckt ausschliesslich in dieser Klasse; der restliche Code liegt einmalig in
 * {@code shared/common}.
 */
public final class PlatformCompat {

    private static final int ARMOR_SLOTS = 4;

    private PlatformCompat() {}

    public static MinecraftServer serverOf(ServerPlayerEntity player) {
        return player.getEntityWorld().getServer();
    }

    public static RegistryWrapper.WrapperLookup registryLookup(ServerPlayerEntity player) {
        return player.getEntityWorld().getRegistryManager();
    }

    public static boolean isOperator(ServerPlayerEntity player) {
        MinecraftServer s = serverOf(player);
        if (s == null) return false;
        return s.getPlayerManager().isOperator(new PlayerConfigEntry(player.getGameProfile()));
    }

    public static String profileName(GameProfile profile) {
        if (profile == null) return null;
        // GameProfile ist in neueren Authlib-Versionen ein Record mit name(),
        // in aelteren eine Klasse mit getName(). Beide reflektiv versuchen.
        try {
            return (String) profile.getClass().getMethod("name").invoke(profile);
        } catch (Throwable ignore) { /* fall through */ }
        try {
            return (String) profile.getClass().getMethod("getName").invoke(profile);
        } catch (Throwable ignore) { /* fall through */ }
        return null;
    }

    // ======== Inventar-Snapshot (Layout: [MAIN_SIZE][4 armor][1 offhand]) ========
    public static ItemStack[] captureInventory(PlayerInventory inv) {
        int mainSize = PlayerInventory.MAIN_SIZE;
        ItemStack[] mainInv = new ItemStack[mainSize];
        for (int i = 0; i < mainSize; i++) {
            mainInv[i] = inv.getStack(i).copy();
        }
        ItemStack[] armor = new ItemStack[ARMOR_SLOTS];
        for (int i = 0; i < ARMOR_SLOTS; i++) {
            armor[i] = inv.getStack(mainSize + i).copy();
        }
        ItemStack offhand = inv.getStack(inv.size() - 1).copy();

        ItemStack[] combined = new ItemStack[mainInv.length + armor.length + 1];
        System.arraycopy(mainInv, 0, combined, 0, mainInv.length);
        System.arraycopy(armor,   0, combined, mainInv.length, armor.length);
        combined[combined.length - 1] = offhand;
        return combined;
    }

    public static void applyInventory(ServerPlayerEntity player, ItemStack[] saved) {
        PlayerInventory inv = player.getInventory();
        int mainSize = PlayerInventory.MAIN_SIZE;
        int total = inv.size();
        for (int i = 0; i < mainSize && i < saved.length; i++) {
            inv.setStack(i, saved[i].copy());
        }
        for (int i = 0; i < ARMOR_SLOTS; i++) {
            int target = mainSize + i;
            int sourceIndex = mainSize + i;
            if (target < total && sourceIndex < saved.length) {
                inv.setStack(target, saved[sourceIndex].copy());
            }
        }
        if (saved.length > 0 && total > 0) {
            inv.setStack(total - 1, saved[saved.length - 1].copy());
        }
    }

    // ======== NBT (WriteView / ReadView) ========
    public static NbtCompound writeStacks(ItemStack[] inv, RegistryWrapper.WrapperLookup lookup) {
        DefaultedList<ItemStack> list = DefaultedList.ofSize(inv.length, ItemStack.EMPTY);
        for (int i = 0; i < inv.length; i++) {
            list.set(i, inv[i]);
        }
        NbtWriteView view = NbtWriteView.create(ErrorReporter.EMPTY, lookup);
        Inventories.writeData(view, list);
        return view.getNbt();
    }

    public static ItemStack[] readStacks(NbtCompound nbt, RegistryWrapper.WrapperLookup lookup) {
        int size = nbt.getList(Inventories.ITEMS_NBT_KEY).map(NbtList::size).orElse(0);
        if (size == 0) {
            size = nbt.getList("Items").map(NbtList::size).orElse(0);
        }
        DefaultedList<ItemStack> list = DefaultedList.ofSize(size, ItemStack.EMPTY);
        ReadView view = NbtReadView.create(ErrorReporter.EMPTY, lookup, nbt);
        Inventories.readData(view, list);
        return list.toArray(new ItemStack[0]);
    }

    // ======== NBT-Getter (neue API: 2-arg mit Default / getCompoundOrEmpty) ========
    public static int getInt(NbtCompound nbt, String key, int def) {
        return nbt.getInt(key, def);
    }

    public static long getLong(NbtCompound nbt, String key, long def) {
        return nbt.getLong(key, def);
    }

    public static boolean getBoolean(NbtCompound nbt, String key, boolean def) {
        return nbt.getBoolean(key, def);
    }

    public static NbtCompound getCompound(NbtCompound nbt, String key) {
        return nbt.getCompoundOrEmpty(key);
    }
}
