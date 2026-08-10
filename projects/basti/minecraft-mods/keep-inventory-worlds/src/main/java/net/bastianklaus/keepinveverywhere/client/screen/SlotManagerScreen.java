package net.bastianklaus.keepinveverywhere.client.screen;

import it.unimi.dsi.fastutil.booleans.BooleanConsumer;
import me.shedaniel.autoconfig.AutoConfig;
import net.bastianklaus.keepinveverywhere.client.ClientSlotActions;
import net.bastianklaus.keepinveverywhere.client.lang.ModLang;
import net.bastianklaus.keepinveverywhere.config.ModConfig;
import net.bastianklaus.keepinveverywhere.data.SlotMeta;
import net.bastianklaus.keepinveverywhere.data.SlotStore;
import net.minecraft.client.MinecraftClient;
import net.minecraft.client.gui.DrawContext;
import net.minecraft.client.gui.screen.ConfirmScreen;
import net.minecraft.client.gui.screen.Screen;
import net.minecraft.client.gui.tooltip.Tooltip;
import net.minecraft.client.gui.widget.ButtonWidget;
import net.minecraft.text.Text;

/**
 * Main mod screen: browse, create, rename, delete and load named inventory slots, plus the
 * keep-inventory toggle and a shortcut to the Cloth settings page.
 */
public class SlotManagerScreen extends Screen {
    private final Screen parent;

    private SlotListWidget list;
    private ButtonWidget saveButton;
    private ButtonWidget loadButton;
    private ButtonWidget renameButton;
    private ButtonWidget deleteButton;
    private ButtonWidget keepInvButton;

    public SlotManagerScreen(Screen parent) {
        super(ModLang.tr("keepinveverywhere.screen.title"));
        this.parent = parent;
    }

    @Override
    protected void init() {
        int top = 44;
        int bottom = this.height - 96;
        list = new SlotListWidget(this.client, this.width, bottom - top, top, 30, this::updateButtons);
        list.setSlots(SlotStore.list());
        addDrawableChild(list);

        int groupLeft = this.width / 2 - 205;
        int rowA = this.height - 86;
        int rowB = this.height - 56;
        int rowC = this.height - 26;

        saveButton = ButtonWidget.builder(ModLang.tr("keepinveverywhere.button.save"), b -> openSave())
                .dimensions(groupLeft, rowA, 200, 20)
                .tooltip(Tooltip.of(ModLang.tr("keepinveverywhere.tooltip.save")))
                .build();
        addDrawableChild(saveButton);

        loadButton = ButtonWidget.builder(ModLang.tr("keepinveverywhere.button.load"), b -> openLoad())
                .dimensions(groupLeft + 204, rowA, 64, 20)
                .tooltip(Tooltip.of(ModLang.tr("keepinveverywhere.tooltip.load")))
                .build();
        addDrawableChild(loadButton);

        renameButton = ButtonWidget.builder(ModLang.tr("keepinveverywhere.button.rename"), b -> openRename())
                .dimensions(groupLeft + 272, rowA, 64, 20)
                .build();
        addDrawableChild(renameButton);

        deleteButton = ButtonWidget.builder(ModLang.tr("keepinveverywhere.button.delete"), b -> openDelete())
                .dimensions(groupLeft + 340, rowA, 70, 20)
                .tooltip(Tooltip.of(ModLang.tr("keepinveverywhere.tooltip.delete")))
                .build();
        addDrawableChild(deleteButton);

        keepInvButton = ButtonWidget.builder(keepInvLabel(), b -> toggleKeepInv())
                .dimensions(groupLeft, rowB, 200, 20)
                .tooltip(Tooltip.of(ModLang.tr("keepinveverywhere.tooltip.keepinv")))
                .build();
        addDrawableChild(keepInvButton);

        addDrawableChild(ButtonWidget.builder(ModLang.tr("keepinveverywhere.button.regions"),
                        b -> this.client.setScreen(new RegionManagerScreen(this)))
                .dimensions(groupLeft + 204, rowB, 206, 20)
                .tooltip(Tooltip.of(ModLang.tr("keepinveverywhere.tooltip.regions")))
                .build());

        addDrawableChild(ButtonWidget.builder(ModLang.tr("keepinveverywhere.button.settings"), b -> openSettings())
                .dimensions(groupLeft, rowC, 200, 20)
                .build());

        addDrawableChild(ButtonWidget.builder(ModLang.tr("keepinveverywhere.button.done"), b -> close())
                .dimensions(groupLeft + 204, rowC, 206, 20)
                .build());

        updateButtons();
    }

    private Text keepInvLabel() {
        Text state = ModConfig.get().keepInventoryEnabled
                ? ModLang.tr("keepinveverywhere.state.on")
                : ModLang.tr("keepinveverywhere.state.off");
        return ModLang.tr("keepinveverywhere.button.keepinv", state.getString());
    }

    private void updateButtons() {
        boolean hasWorld = this.client != null && this.client.player != null;
        boolean hasSelection = list.getSelectedMeta() != null;
        saveButton.active = hasWorld;
        loadButton.active = hasSelection && ClientSlotActions.serverAvailable();
        renameButton.active = hasSelection;
        deleteButton.active = hasSelection;
    }

    private void refresh() {
        list.setSlots(SlotStore.list());
        updateButtons();
    }

    private void openSave() {
        this.client.setScreen(new NameEntryScreen(this,
                ModLang.tr("keepinveverywhere.screen.save_title"),
                ModLang.tr("keepinveverywhere.prompt.name"),
                "",
                name -> {
                    if (SlotStore.exists(name) && ModConfig.get().confirmOnOverwrite) {
                        confirm(ModLang.tr("keepinveverywhere.confirm.overwrite_slot", name), () -> doSave(name));
                    } else {
                        doSave(name);
                    }
                }));
    }

    private void doSave(String name) {
        ClientSlotActions.save(name);
        this.client.setScreen(this);
        refresh();
    }

    private void openLoad() {
        SlotMeta meta = list.getSelectedMeta();
        if (meta == null) {
            return;
        }
        if (ClientSlotActions.inventoryOccupied() && ModConfig.get().confirmOnOverwrite) {
            confirm(ModLang.tr("keepinveverywhere.confirm.overwrite_inventory", meta.displayName()),
                    () -> doLoad(meta.displayName()));
        } else {
            doLoad(meta.displayName());
        }
    }

    private void doLoad(String name) {
        ClientSlotActions.requestLoad(name);
        close(); // return to the game so the restored inventory is visible
    }

    private void openRename() {
        SlotMeta meta = list.getSelectedMeta();
        if (meta == null) {
            return;
        }
        this.client.setScreen(new NameEntryScreen(this,
                ModLang.tr("keepinveverywhere.screen.rename_title"),
                ModLang.tr("keepinveverywhere.prompt.name"),
                meta.displayName(),
                newName -> {
                    SlotStore.rename(meta.displayName(), newName);
                    this.client.setScreen(this);
                    refresh();
                }));
    }

    private void openDelete() {
        SlotMeta meta = list.getSelectedMeta();
        if (meta == null) {
            return;
        }
        confirm(ModLang.tr("keepinveverywhere.confirm.delete", meta.displayName()), () -> {
            SlotStore.delete(meta.displayName());
            refresh();
        });
    }

    private void toggleKeepInv() {
        ModConfig cfg = ModConfig.get();
        cfg.keepInventoryEnabled = !cfg.keepInventoryEnabled;
        ModConfig.save();
        keepInvButton.setMessage(keepInvLabel());
    }

    private void openSettings() {
        try {
            this.client.setScreen(AutoConfig.getConfigScreen(ModConfig.class, this).get());
        } catch (Throwable t) {
            // Cloth Config not present / failed; stay on this screen.
        }
    }

    private void confirm(Text message, Runnable onYes) {
        BooleanConsumer cb = yes -> {
            if (yes) {
                onYes.run();
            }
            this.client.setScreen(this);
        };
        this.client.setScreen(new ConfirmScreen(cb, ModLang.tr("keepinveverywhere.confirm.title"), message));
    }

    @Override
    public void render(DrawContext context, int mouseX, int mouseY, float delta) {
        super.render(context, mouseX, mouseY, delta);
        context.drawCenteredTextWithShadow(this.textRenderer, this.title, this.width / 2, 14, 0xFFFFFF);
        if (this.client != null && this.client.player == null) {
            context.drawCenteredTextWithShadow(this.textRenderer,
                    ModLang.tr("keepinveverywhere.notice.no_world"), this.width / 2, 28, 0xFFAA00);
        } else if (!ClientSlotActions.serverAvailable()) {
            context.drawCenteredTextWithShadow(this.textRenderer,
                    ModLang.tr("keepinveverywhere.notice.no_server"), this.width / 2, 28, 0xFFAA00);
        }
    }

    @Override
    public void close() {
        this.client.setScreen(parent);
    }
}
