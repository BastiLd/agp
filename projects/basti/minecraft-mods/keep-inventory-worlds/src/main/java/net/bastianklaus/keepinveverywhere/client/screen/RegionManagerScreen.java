package net.bastianklaus.keepinveverywhere.client.screen;

import it.unimi.dsi.fastutil.booleans.BooleanConsumer;
import net.bastianklaus.keepinveverywhere.client.AxiomBridge;
import net.bastianklaus.keepinveverywhere.client.RegionActions;
import net.bastianklaus.keepinveverywhere.client.lang.ModLang;
import net.bastianklaus.keepinveverywhere.config.ModConfig;
import net.bastianklaus.keepinveverywhere.region.RegionMeta;
import net.bastianklaus.keepinveverywhere.region.RegionStore;
import net.minecraft.client.gui.DrawContext;
import net.minecraft.client.gui.screen.ConfirmScreen;
import net.minecraft.client.gui.screen.Screen;
import net.minecraft.client.gui.tooltip.Tooltip;
import net.minecraft.client.gui.widget.ButtonWidget;
import net.minecraft.text.Text;

/**
 * Build/region manager: save the current Axiom selection as a named region and paste saved
 * regions into any world. Selecting an area REQUIRES Axiom (clearly communicated in the UI);
 * pasting works without Axiom.
 */
public class RegionManagerScreen extends Screen {
    private final Screen parent;

    private RegionListWidget list;
    private ButtonWidget saveButton;
    private ButtonWidget pasteButton;
    private ButtonWidget renameButton;
    private ButtonWidget deleteButton;

    public RegionManagerScreen(Screen parent) {
        super(ModLang.tr("keepinveverywhere.screen.regions_title"));
        this.parent = parent;
    }

    @Override
    protected void init() {
        int top = 44;
        int bottom = this.height - 72;
        list = new RegionListWidget(this.client, this.width, bottom - top, top, 30, this::updateButtons);
        list.setRegions(RegionStore.list());
        addDrawableChild(list);

        int groupLeft = this.width / 2 - 205;
        int rowA = this.height - 62;
        int rowB = this.height - 32;

        saveButton = ButtonWidget.builder(ModLang.tr("keepinveverywhere.button.save_selection"), b -> openSave())
                .dimensions(groupLeft, rowA, 200, 20)
                .tooltip(Tooltip.of(ModLang.tr("keepinveverywhere.tooltip.save_selection")))
                .build();
        addDrawableChild(saveButton);

        pasteButton = ButtonWidget.builder(ModLang.tr("keepinveverywhere.button.paste"), b -> openPaste())
                .dimensions(groupLeft + 204, rowA, 64, 20)
                .tooltip(Tooltip.of(ModLang.tr("keepinveverywhere.tooltip.paste")))
                .build();
        addDrawableChild(pasteButton);

        renameButton = ButtonWidget.builder(ModLang.tr("keepinveverywhere.button.rename"), b -> openRename())
                .dimensions(groupLeft + 272, rowA, 64, 20)
                .build();
        addDrawableChild(renameButton);

        deleteButton = ButtonWidget.builder(ModLang.tr("keepinveverywhere.button.delete"), b -> openDelete())
                .dimensions(groupLeft + 340, rowA, 70, 20)
                .build();
        addDrawableChild(deleteButton);

        addDrawableChild(ButtonWidget.builder(ModLang.tr("keepinveverywhere.button.back"), b -> close())
                .dimensions(groupLeft, rowB, 410, 20)
                .build());

        updateButtons();
    }

    private void updateButtons() {
        boolean busy = RegionActions.busy();
        boolean hasSelection = list.getSelectedMeta() != null;
        saveButton.active = RegionActions.saveAvailable() && !busy
                && AxiomBridge.isAxiomLoaded() && AxiomBridge.hasSelection();
        pasteButton.active = RegionActions.pasteAvailable() && !busy && hasSelection;
        renameButton.active = hasSelection;
        deleteButton.active = hasSelection;
    }

    private void refresh() {
        list.setRegions(RegionStore.list());
        updateButtons();
    }

    private void openSave() {
        this.client.setScreen(new NameEntryScreen(this,
                ModLang.tr("keepinveverywhere.screen.save_region_title"),
                ModLang.tr("keepinveverywhere.prompt.name"),
                "",
                name -> {
                    if (RegionStore.exists(name) && ModConfig.get().confirmOnOverwrite) {
                        confirm(ModLang.tr("keepinveverywhere.confirm.overwrite_slot", name), () -> doSave(name));
                    } else {
                        doSave(name);
                    }
                }));
    }

    private void doSave(String name) {
        RegionActions.saveSelection(name);
        this.client.setScreen(this);
        refresh();
    }

    private void openPaste() {
        RegionMeta meta = list.getSelectedMeta();
        if (meta == null) {
            return;
        }
        confirm(ModLang.tr("keepinveverywhere.confirm.paste", meta.displayName(),
                        meta.sizeX() + "×" + meta.sizeY() + "×" + meta.sizeZ()),
                () -> {
                    RegionActions.paste(meta.displayName());
                    this.client.setScreen(null); // back to the game to watch it appear
                });
    }

    private void openRename() {
        RegionMeta meta = list.getSelectedMeta();
        if (meta == null) {
            return;
        }
        this.client.setScreen(new NameEntryScreen(this,
                ModLang.tr("keepinveverywhere.screen.rename_title"),
                ModLang.tr("keepinveverywhere.prompt.name"),
                meta.displayName(),
                newName -> {
                    RegionStore.rename(meta.displayName(), newName);
                    this.client.setScreen(this);
                    refresh();
                }));
    }

    private void openDelete() {
        RegionMeta meta = list.getSelectedMeta();
        if (meta == null) {
            return;
        }
        confirm(ModLang.tr("keepinveverywhere.confirm.delete", meta.displayName()), () -> {
            RegionStore.delete(meta.displayName());
            refresh();
        });
    }

    private void confirm(Text message, Runnable onYes) {
        BooleanConsumer cb = yes -> {
            if (yes) {
                onYes.run();
            } else {
                this.client.setScreen(this);
            }
        };
        this.client.setScreen(new ConfirmScreen(cb, ModLang.tr("keepinveverywhere.confirm.title"), message));
    }

    @Override
    public void render(DrawContext context, int mouseX, int mouseY, float delta) {
        super.render(context, mouseX, mouseY, delta);
        context.drawCenteredTextWithShadow(this.textRenderer, this.title, this.width / 2, 14, 0xFFFFFF);

        Text notice = null;
        if (this.client != null && this.client.player == null) {
            notice = ModLang.tr("keepinveverywhere.notice.no_world");
        } else if (RegionActions.busy()) {
            notice = ModLang.tr("keepinveverywhere.notice.busy");
        } else if (!AxiomBridge.isAxiomLoaded()) {
            notice = ModLang.tr("keepinveverywhere.notice.need_axiom");
        } else if (!AxiomBridge.hasSelection()) {
            notice = ModLang.tr("keepinveverywhere.notice.no_axiom_selection");
        } else if (!RegionActions.pasteAvailable()) {
            notice = ModLang.tr("keepinveverywhere.notice.paste_singleplayer");
        }
        if (notice != null) {
            context.drawCenteredTextWithShadow(this.textRenderer, notice, this.width / 2, 28, 0xFFAA00);
        }
    }

    @Override
    public void tick() {
        updateButtons(); // selection in Axiom / job state can change while the screen is open
    }

    @Override
    public void close() {
        this.client.setScreen(parent);
    }
}
