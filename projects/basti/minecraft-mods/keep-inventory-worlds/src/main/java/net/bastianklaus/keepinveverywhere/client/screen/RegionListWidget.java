package net.bastianklaus.keepinveverywhere.client.screen;

import net.bastianklaus.keepinveverywhere.client.lang.ModLang;
import net.bastianklaus.keepinveverywhere.region.RegionMeta;
import net.minecraft.client.MinecraftClient;
import net.minecraft.client.gui.DrawContext;
import net.minecraft.client.gui.widget.AlwaysSelectedEntryListWidget;
import net.minecraft.text.Text;

import java.text.DateFormat;
import java.util.Date;
import java.util.List;

/** Scrollable, selectable list of saved regions (builds). */
public class RegionListWidget extends AlwaysSelectedEntryListWidget<RegionListWidget.RegionEntry> {
    private final Runnable onSelectionChanged;

    public RegionListWidget(MinecraftClient client, int width, int height, int top, int itemHeight,
                            Runnable onSelectionChanged) {
        super(client, width, height, top, itemHeight);
        this.onSelectionChanged = onSelectionChanged;
    }

    public void setRegions(List<RegionMeta> metas) {
        this.clearEntries();
        for (RegionMeta meta : metas) {
            this.addEntry(new RegionEntry(meta));
        }
    }

    public RegionMeta getSelectedMeta() {
        RegionEntry e = getSelectedOrNull();
        return e == null ? null : e.meta;
    }

    @Override
    public int getRowWidth() {
        return Math.min(360, this.width - 20);
    }

    public class RegionEntry extends AlwaysSelectedEntryListWidget.Entry<RegionEntry> {
        private final RegionMeta meta;

        RegionEntry(RegionMeta meta) {
            this.meta = meta;
        }

        @Override
        public void render(DrawContext context, int index, int y, int x, int entryWidth, int entryHeight,
                           int mouseX, int mouseY, boolean hovered, float tickDelta) {
            var tr = MinecraftClient.getInstance().textRenderer;
            context.drawTextWithShadow(tr, Text.literal(meta.displayName()), x + 6, y + 5, 0xFFFFFF);
            String date = DateFormat.getDateTimeInstance(DateFormat.SHORT, DateFormat.SHORT)
                    .format(new Date(meta.createdEpochMs()));
            String dims = meta.sizeX() + "×" + meta.sizeY() + "×" + meta.sizeZ();
            Text sub = ModLang.tr("keepinveverywhere.region.subtitle", meta.blockCount(), dims, date);
            context.drawTextWithShadow(tr, sub, x + 6, y + 17, 0xA0A0A0);
        }

        @Override
        public boolean mouseClicked(double mouseX, double mouseY, int button) {
            RegionListWidget.this.setSelected(this);
            if (onSelectionChanged != null) {
                onSelectionChanged.run();
            }
            return true;
        }

        @Override
        public Text getNarration() {
            return Text.literal(meta.displayName());
        }
    }
}
