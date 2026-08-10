package net.bastianklaus.keepinveverywhere.data;

import com.mojang.serialization.DataResult;
import net.minecraft.entity.player.PlayerInventory;
import net.minecraft.item.ItemStack;
import net.minecraft.nbt.NbtCompound;
import net.minecraft.nbt.NbtElement;
import net.minecraft.nbt.NbtList;
import net.minecraft.nbt.NbtOps;
import net.minecraft.registry.RegistryOps;
import net.minecraft.registry.RegistryWrapper;

import java.util.Optional;

/**
 * A snapshot of all 41 player inventory slots, indexed exactly as
 * {@link PlayerInventory#getStack(int)} / {@link PlayerInventory#setStack(int, ItemStack)}:
 * <ul>
 *   <li>0-35  main inventory (0-8 hotbar)</li>
 *   <li>36-39 armor (feet, legs, chest, head)</li>
 *   <li>40    off-hand</li>
 * </ul>
 * Items are serialized through {@link ItemStack#CODEC} so the full data-component set
 * (durability, enchantments, custom NBT, ...) is preserved and version-robust.
 */
public final class InventorySnapshot {
    public static final int SIZE = 41;
    private static final int FORMAT_VERSION = 1;

    private final ItemStack[] stacks = new ItemStack[SIZE];
    /** Number of stored stacks that could not be decoded into the running version. */
    private int skipped = 0;

    public InventorySnapshot() {
        for (int i = 0; i < SIZE; i++) {
            stacks[i] = ItemStack.EMPTY;
        }
    }

    /** Capture the player's complete inventory (deep copies each stack). */
    public static InventorySnapshot capture(PlayerInventory inventory) {
        InventorySnapshot snap = new InventorySnapshot();
        for (int i = 0; i < SIZE; i++) {
            snap.stacks[i] = inventory.getStack(i).copy();
        }
        return snap;
    }

    /** Overwrite the player's inventory with this snapshot, restoring exact slot positions. */
    public int restoreTo(PlayerInventory inventory) {
        int restored = 0;
        for (int i = 0; i < SIZE; i++) {
            ItemStack st = stacks[i];
            inventory.setStack(i, st == null ? ItemStack.EMPTY : st.copy());
            if (st != null && !st.isEmpty()) {
                restored++;
            }
        }
        return restored;
    }

    public int itemCount() {
        int n = 0;
        for (ItemStack st : stacks) {
            if (st != null && !st.isEmpty()) {
                n++;
            }
        }
        return n;
    }

    public int skipped() {
        return skipped;
    }

    public NbtCompound toNbt(RegistryWrapper.WrapperLookup registries) {
        RegistryOps<NbtElement> ops = RegistryOps.of(NbtOps.INSTANCE, registries);
        NbtList items = new NbtList();
        for (int i = 0; i < SIZE; i++) {
            ItemStack st = stacks[i];
            if (st == null || st.isEmpty()) {
                continue;
            }
            DataResult<NbtElement> encoded = ItemStack.CODEC.encodeStart(ops, st);
            Optional<NbtElement> el = encoded.result();
            if (el.isEmpty()) {
                continue;
            }
            NbtCompound entry = new NbtCompound();
            entry.putInt("slot", i);
            entry.put("item", el.get());
            items.add(entry);
        }
        NbtCompound root = new NbtCompound();
        root.putInt("format", FORMAT_VERSION);
        root.put("items", items);
        return root;
    }

    public static InventorySnapshot fromNbt(NbtCompound root, RegistryWrapper.WrapperLookup registries) {
        RegistryOps<NbtElement> ops = RegistryOps.of(NbtOps.INSTANCE, registries);
        InventorySnapshot snap = new InventorySnapshot();
        NbtList items = root.getList("items", NbtElement.COMPOUND_TYPE);
        for (int i = 0; i < items.size(); i++) {
            NbtCompound entry = items.getCompound(i);
            int slot = entry.getInt("slot");
            NbtElement itemNbt = entry.get("item");
            if (itemNbt == null || slot < 0 || slot >= SIZE) {
                snap.skipped++;
                continue;
            }
            // Gracefully skip items that do not exist in this version (e.g. removed/modded items).
            DataResult<ItemStack> parsed = ItemStack.CODEC.parse(ops, itemNbt);
            Optional<ItemStack> result = parsed.result();
            if (result.isEmpty() || result.get().isEmpty()) {
                snap.skipped++;
                continue;
            }
            snap.stacks[slot] = result.get();
        }
        return snap;
    }
}
