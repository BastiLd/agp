package com.example;

import net.fabricmc.api.ModInitializer;
import net.fabricmc.api.ClientModInitializer;

public class HotbarScrollMod implements ModInitializer, ClientModInitializer {
    @Override
    public void onInitialize() {
        // Server-seitige Initialisierung (nicht benötigt)
    }

    @Override
    public void onInitializeClient() {
        HotbarScrollClient.init();
    }
}