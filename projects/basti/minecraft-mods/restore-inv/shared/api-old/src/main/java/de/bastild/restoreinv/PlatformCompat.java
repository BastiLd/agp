package de.bastild.restoreinv;

import com.mojang.authlib.GameProfile;
import net.minecraft.entity.player.PlayerInventory;
import net.minecraft.inventory.Inventories;
import net.minecraft.item.ItemStack;
import net.minecraft.nbt.NbtCompound;
import net.minecraft.registry.RegistryWrapper;
import net.minecraft.server.MinecraftServer;
import net.minecraft.server.network.ServerPlayerEntity;
import net.minecraft.util.collection.DefaultedList;

/**
 * Versions-spezifische Bruecke fuer Minecraft 1.21 - 1.21.4 (alte
 * {@code Inventories.writeNbt/readNbt}-API). Die gesamte API-Divergenz
 * gegenueber dem neuen Tree ({@code shared/api-new}) steckt ausschliesslich in
 * dieser Klasse; der restliche Code liegt einmalig in {@code shared/common}.
 */
public final class PlatformCompat {

    private static final int ARMOR_SLOTS = 4;

    private PlatformCompat() {}

    public static MinecraftServer serverOf(ServerPlayerEntity player) {
        return player.getServer();
    }

    public static RegistryWrapper.WrapperLookup registryLookup(ServerPlayerEntity player) {
        return player.getServer().getRegistryManager();
    }

    public static boolean isOperator(ServerPlayerEntity player) {
        MinecraftServer s = serverOf(player);
        if (s == null) return false;
        return s.getPlayerManager().isOperator(player.getGameProfile());
    }

    public static String profileName(GameProfile profile) {
        if (profile == null) return null;
        try {
            return (String) profile.getClass().getMethod("name").invoke(profile);
        } catch (Throwable ignore) { /* fall through */ }
        try {
            return (String) profile.getClass().getMethod("getName").invoke(profile);
        } catch (Throwable ignore) { /* fall through */ }
        return null;
    }

    // ======== Inventar-Snapshot (altes Layout: [inv.size()][4 armor][1 offhand]) ========
    public static ItemStack[] captureInventory(PlayerInventory inv) {
        // 1.21.1: getInventory().size() inkl. Hotbar + Armor + Offhand. Armor via getArmorStack.
        int total = inv.size();
        ItemStack[] mainInv = new ItemStack[total];
        for (int i = 0; i < total; i++) {
            mainInv[i] = inv.getStack(i).copy();
        }
        ItemStack[] armor = new ItemStack[ARMOR_SLOTS];
        for (int i = 0; i < ARMOR_SLOTS; i++) {
            armor[i] = inv.getArmorStack(i).copy();
        }
        ItemStack offhand = inv.getStack(total - 1).copy();

        ItemStack[] combined = new ItemStack[mainInv.length + armor.length + 1];
        System.arraycopy(mainInv, 0, combined, 0, mainInv.length);
        System.arraycopy(armor,   0, combined, mainInv.length, armor.length);
        combined[combined.length - 1] = offhand;
        return combined;
    }

    public static void applyInventory(ServerPlayerEntity player, ItemStack[] saved) {
        PlayerInventory inv = player.getInventory();
        int mainInvSize = inv.size() - 1; // -1 for offhand
        for (int i = 0; i < mainInvSize && i < saved.length; i++) {
            inv.setStack(i, saved[i].copy());
        }
        // Armor liegt 'mainInvSize' Eintraege weiter im combined-Array
        for (int i = 0; i < ARMOR_SLOTS; i++) {
            int target = mainInvSize + i;
            int sourceIndex = mainInvSize + i;
            if (target < inv.size() && sourceIndex < saved.length) {
                inv.setStack(target, saved[sourceIndex].copy());
            }
        }
        if (saved.length > 0 && inv.size() > 0) {
            inv.setStack(inv.size() - 1, saved[saved.length - 1].copy());
        }
    }

    // ======== NBT (Inventories.writeNbt / readNbt) ========
    public static NbtCompound writeStacks(ItemStack[] inv, RegistryWrapper.WrapperLookup lookup) {
        NbtCompound nbt = new NbtCompound();
        DefaultedList<ItemStack> list = DefaultedList.ofSize(inv.length, ItemStack.EMPTY);
        for (int i = 0; i < inv.length; i++) {
            list.set(i, inv[i]);
        }
        Inventories.writeNbt(nbt, list, lookup);
        return nbt;
    }

    public static ItemStack[] readStacks(NbtCompound nbt, RegistryWrapper.WrapperLookup lookup) {
        int size = nbt.contains("Items") ? nbt.getList("Items", 10).size() : 0;
        DefaultedList<ItemStack> list = DefaultedList.ofSize(size, ItemStack.EMPTY);
        Inventories.readNbt(nbt, list, lookup);
        return list.toArray(new ItemStack[0]);
    }

    // ======== NBT-Getter (alte API: 1-arg, kein Default; getCompound) ========
    public static int getInt(NbtCompound nbt, String key, int def) {
        return nbt.contains(key) ? nbt.getInt(key) : def;
    }

    public static long getLong(NbtCompound nbt, String key, long def) {
        return nbt.contains(key) ? nbt.getLong(key) : def;
    }

    public static boolean getBoolean(NbtCompound nbt, String key, boolean def) {
        return nbt.contains(key) ? nbt.getBoolean(key) : def;
    }

    public static NbtCompound getCompound(NbtCompound nbt, String key) {
        return nbt.getCompound(key);
    }
}
