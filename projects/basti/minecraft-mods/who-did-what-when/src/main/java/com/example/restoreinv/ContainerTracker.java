package com.example.whodidwhatwhen;

import org.bukkit.Bukkit;
import org.bukkit.ChatColor;
import org.bukkit.Material;
import org.bukkit.block.Barrel;
import org.bukkit.block.Block;
import org.bukkit.block.Chest;
import org.bukkit.block.Dispenser;
import org.bukkit.block.Dropper;
import org.bukkit.block.Furnace;
import org.bukkit.block.ShulkerBox;
import org.bukkit.entity.Player;
import org.bukkit.event.EventHandler;
import org.bukkit.event.Listener;
import org.bukkit.event.block.Action;
import org.bukkit.event.block.BlockBreakEvent;
import org.bukkit.event.inventory.InventoryClickEvent;
import org.bukkit.event.inventory.InventoryType;
import org.bukkit.event.player.PlayerInteractEvent;
import org.bukkit.inventory.ItemStack;
import org.bukkit.inventory.DoubleChestInventory;
import org.bukkit.inventory.Inventory;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

public class ContainerTracker implements Listener {

    private static final List<Material> TRACKED_BLOCK_MATERIALS = List.of(
            Material.CHEST,
            Material.BARREL,
            Material.SHULKER_BOX,
            Material.FURNACE,
            Material.DROPPER,
            Material.DISPENSER);

    private static final Map<String, List<ContainerAction>> containerActions = new ConcurrentHashMap<>();
    private static final DateTimeFormatter formatter = DateTimeFormatter.ofPattern("dd.MM.yyyy 'um' HH:mm");

    @EventHandler
    public void onPlayerInteract(PlayerInteractEvent event) {
        Player player = event.getPlayer();
        Block clickedBlock = event.getClickedBlock();

        if (clickedBlock == null) {
            return;
        }

        if (event.getAction() == Action.RIGHT_CLICK_BLOCK) {
            // Debug message (can be removed after testing)
            player.sendMessage(ChatColor.GREEN + "[DEBUG] Block used!" + ChatColor.RESET);

            if (player.getInventory().getItemInMainHand().getType() == Material.WOODEN_PICKAXE && player.isOp()) { // isOp()
                                                                                                                   // for
                                                                                                                   // creative
                                                                                                                   // mode
                                                                                                                   // alternative
                if (TRACKED_BLOCK_MATERIALS.contains(clickedBlock.getType())) {
                    // Prevent chest from opening
                    event.setCancelled(true);

                    // Display history
                    sendMessage(player, clickedBlock);
                }
            }
        }
    }

    @EventHandler
    public void onInventoryClick(InventoryClickEvent event) {
        if (event.getWhoClicked() instanceof Player player) {
            if (event.getClickedInventory() == null || event.getClickedInventory().getType() == InventoryType.PLAYER) {
                return;
            }

            ItemStack clickedItem = event.getCurrentItem();
            ItemStack cursorItem = event.getCursor();
            Inventory clickedInventory = event.getClickedInventory();
            Block block = clickedInventory.getLocation() != null ? clickedInventory.getLocation().getBlock() : null;

            if (block == null || !TRACKED_BLOCK_MATERIALS.contains(block.getType())) {
                return;
            }

            // Track insert/remove based on click type and item presence
            if (event.getAction().name().contains("PICKUP") || event.getAction().name().contains("SWAP")) { // Taking
                                                                                                            // items
                if (clickedItem != null && clickedItem.getType() != Material.AIR) {
                    trackRemove(player, block, clickedItem);
                }
            } else if (event.getAction().name().contains("PLACE") || event.getAction().name().contains("DROP")) { // Placing
                                                                                                                  // items
                if (cursorItem != null && cursorItem.getType() != Material.AIR) {
                    trackInsert(player, block, cursorItem);
                }
            } else if (event.isShiftClick() && clickedItem != null && clickedItem.getType() != Material.AIR) { // Shift-click
                // Determine if it's an insert or remove based on which inventory the item is
                // going to/from
                if (event.getClickedInventory().getType() == InventoryType.PLAYER) {
                    // Item is moving from player inventory to container (insert)
                    trackInsert(player, block, clickedItem);
                } else {
                    // Item is moving from container to player inventory (remove)
                    trackRemove(player, block, clickedItem);
                }
            }
        }
    }

    @EventHandler
    public void onBlockBreak(BlockBreakEvent event) {
        Block brokenBlock = event.getBlock();
        if (TRACKED_BLOCK_MATERIALS.contains(brokenBlock.getType())) {
            trackBreak(event.getPlayer(), brokenBlock);
        }
    }

    public static void trackBlockInteraction(Player player, Block block) {
        if (!TRACKED_BLOCK_MATERIALS.contains(block.getType()))
            return;
        String blockKey = getBlockKey(block);
        String action = "opened";
        addAction(player, action, blockKey, "");
    }

    public static void trackInsert(Player player, Block block, ItemStack stack) {
        if (!TRACKED_BLOCK_MATERIALS.contains(block.getType()))
            return;
        String blockKey = getBlockKey(block);
        String action = "took"; // Consistent with image, even for insert
        String itemInfo = String.format("%dx %s", stack.getAmount(), stack.getType().name());
        addAction(player, action, blockKey, itemInfo);
    }

    public static void trackRemove(Player player, Block block, ItemStack stack) {
        if (!TRACKED_BLOCK_MATERIALS.contains(block.getType()))
            return;
        String blockKey = getBlockKey(block);
        String action = "took";
        String itemInfo = String.format("%dx %s", stack.getAmount(), stack.getType().name());
        addAction(player, action, blockKey, itemInfo);
    }

    public static void trackBreak(Player player, Block block) {
        if (!TRACKED_BLOCK_MATERIALS.contains(block.getType()))
            return;
        String blockKey = getBlockKey(block);
        String action = "broke";
        addAction(player, action, blockKey, "");
    }

    private static String getBlockKey(Block block) {
        if (block == null)
            return "UNKNOWN";
        if (block.getState() instanceof Chest chest && chest.getInventory() instanceof DoubleChestInventory) {
            return "double_chest_" + chest.getLocation().getBlockX() + "_" + chest.getLocation().getBlockY() + "_"
                    + chest.getLocation().getBlockZ();
        }
        return block.getType().name() + "_" + block.getLocation().getBlockX() + "_" + block.getLocation().getBlockY()
                + "_" + block.getLocation().getBlockZ();
    }

    private static String getBlockDisplayName(Block block) {
        if (block == null)
            return "UNKNOWN";
        if (block.getState() instanceof Chest chest && chest.getInventory() instanceof DoubleChestInventory) {
            return "double chest";
        }
        return block.getType().name().replace("_", " ").toUpperCase();
    }

    private static void addAction(Player player, String action, String blockKey, String itemInfo) {
        ContainerAction newAction = new ContainerAction(
                player != null ? player.getName() : "System",
                action,
                itemInfo,
                LocalDateTime.now(),
                blockKey);

        containerActions.computeIfAbsent(blockKey, k -> new ArrayList<>()).add(newAction);
    }

    private static void sendMessage(Player player, Block block) {
        String blockKey = getBlockKey(block);
        List<ContainerAction> actionsForThisContainer = containerActions.getOrDefault(blockKey, new ArrayList<>());

        // Sort actions by timestamp (newest first)
        actionsForThisContainer.sort((a1, a2) -> a2.timestamp().compareTo(a1.timestamp()));

        StringBuilder message = new StringBuilder();
        String containerDisplayName = getBlockDisplayName(block);

        // Header: "Block changes in the last 86400 minutes at double chest:"
        message.append(ChatColor.GOLD + "Block changes in the last 86400 minutes at " + containerDisplayName + ":"
                + ChatColor.RESET);
        message.append("\n");

        if (actionsForThisContainer.isEmpty()) {
            message.append(ChatColor.GRAY + "- No recent actions for this container." + ChatColor.RESET);
        } else {
            for (ContainerAction action : actionsForThisContainer) {
                String formattedTimestamp = action.timestamp().format(DateTimeFormatter.ofPattern("MM-dd HH:mm"));
                message.append(ChatColor.WHITE + "[" + formattedTimestamp + "] " + ChatColor.BLUE + action.playerName()
                        + " " + ChatColor.RED + action.action());
                if (!action.itemInfo().isEmpty()) {
                    message.append(ChatColor.BLUE + " " + action.itemInfo());
                }
                message.append(ChatColor.BLUE + " from " + containerDisplayName + ChatColor.RESET);
                message.append("\n");
            }
        }

        player.sendMessage(message.toString());
    }

    public record ContainerAction(String playerName, String action, String itemInfo, LocalDateTime timestamp,
            String blockKey) {
        @Override
        public String toString() {
            String itemInfoString = (this.itemInfo != null && !this.itemInfo.isEmpty()) ? " " + this.itemInfo : "";
            return String.format("%s[Container Tracker] %s %s%s on %s at %s", ChatColor.GOLD, playerName, action,
                    itemInfoString,
                    timestamp.format(formatter), blockKey);
        }
    }
}
