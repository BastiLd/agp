package net.bastianklaus.keepinveverywhere.client.screen;

import net.bastianklaus.keepinveverywhere.client.lang.ModLang;
import net.minecraft.client.gui.DrawContext;
import net.minecraft.client.gui.screen.Screen;
import net.minecraft.client.gui.widget.ButtonWidget;
import net.minecraft.client.gui.widget.TextFieldWidget;
import net.minecraft.text.Text;

import java.util.function.Consumer;

/** Small modal screen used to enter a name when creating or renaming a slot. */
public class NameEntryScreen extends Screen {
    private final Screen parent;
    private final Text prompt;
    private final String initialText;
    private final Consumer<String> onConfirm;

    private TextFieldWidget nameField;
    private ButtonWidget confirmButton;

    public NameEntryScreen(Screen parent, Text title, Text prompt, String initialText, Consumer<String> onConfirm) {
        super(title);
        this.parent = parent;
        this.prompt = prompt;
        this.initialText = initialText;
        this.onConfirm = onConfirm;
    }

    @Override
    protected void init() {
        int cx = this.width / 2;
        nameField = new TextFieldWidget(this.textRenderer, cx - 150, this.height / 2 - 10, 300, 20,
                Text.literal(""));
        nameField.setMaxLength(48);
        nameField.setText(initialText);
        nameField.setChangedListener(s -> updateState());
        addDrawableChild(nameField);
        setInitialFocus(nameField);

        confirmButton = ButtonWidget.builder(ModLang.tr("keepinveverywhere.button.confirm"), b -> confirm())
                .dimensions(cx - 152, this.height / 2 + 24, 150, 20)
                .build();
        addDrawableChild(confirmButton);

        addDrawableChild(ButtonWidget.builder(ModLang.tr("keepinveverywhere.button.cancel"), b -> close())
                .dimensions(cx + 2, this.height / 2 + 24, 150, 20)
                .build());

        updateState();
    }

    private void updateState() {
        confirmButton.active = !nameField.getText().trim().isEmpty();
    }

    private void confirm() {
        String value = nameField.getText().trim();
        if (!value.isEmpty()) {
            onConfirm.accept(value);
        }
    }

    @Override
    public boolean keyPressed(int keyCode, int scanCode, int modifiers) {
        if (keyCode == 257 || keyCode == 335) { // Enter / numpad Enter
            if (confirmButton.active) {
                confirm();
                return true;
            }
        }
        return super.keyPressed(keyCode, scanCode, modifiers);
    }

    @Override
    public void render(DrawContext context, int mouseX, int mouseY, float delta) {
        super.render(context, mouseX, mouseY, delta);
        context.drawCenteredTextWithShadow(this.textRenderer, this.title, this.width / 2, 40, 0xFFFFFF);
        context.drawCenteredTextWithShadow(this.textRenderer, this.prompt, this.width / 2,
                this.height / 2 - 28, 0xA0A0A0);
    }

    @Override
    public void close() {
        this.client.setScreen(parent);
    }
}
