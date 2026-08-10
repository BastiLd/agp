package de.bastild.restoreinv;

import net.minecraft.server.command.ServerCommandSource;
import net.minecraft.server.network.ServerPlayerEntity;

/**
 * Zentrale Rechtepruefung. Nutzt - falls vorhanden - fabric-permissions-api
 * (Nodes {@code restoreinv.admin} / {@code restoreinv.restore}) und faellt
 * sonst auf Vanilla-OP (Level 2) zurueck. Die fabric-permissions-api wird
 * reflektiv angesprochen, damit der Code ohne die Lib kompiliert/laeuft.
 */
public final class PermissionGate {

    public static final String NODE_ADMIN = "restoreinv.admin";
    public static final String NODE_RESTORE = "restoreinv.restore";
    private static final int ADMIN_LEVEL = 2;

    private PermissionGate() {}

    /** Darf globale Config aendern / Admin-Panel oeffnen / fremde Inventare wiederherstellen. */
    public static boolean canAdminister(ServerPlayerEntity player) {
        if (player == null) return false;
        Boolean node = checkNode(player, NODE_ADMIN);
        if (node != null) return node;
        return PlatformCompat.isOperator(player);
    }

    public static boolean canAdminister(ServerCommandSource source) {
        if (source == null) return false;
        Boolean node = checkNodeSource(source, NODE_ADMIN);
        if (node != null) return node;
        // Fallback: Spieler -> OP-Check; Nicht-Spieler (Konsole/Befehlsblock) -> erlaubt.
        if (source.getEntity() instanceof ServerPlayerEntity sp) {
            return PlatformCompat.isOperator(sp);
        }
        return true;
    }

    /** Darf das eigene Inventar wiederherstellen. */
    public static boolean canRestore(ServerPlayerEntity player, boolean requireOp) {
        if (player == null) return false;
        Boolean node = checkNode(player, NODE_RESTORE);
        if (node != null) return node;
        if (!requireOp) return true;
        return PlatformCompat.isOperator(player);
    }

    // ======== fabric-permissions-api (optional, reflektiv) ========
    // getPermissionValue(...) liefert ein TriState: TRUE/FALSE setzen das Recht
    // explizit, DEFAULT (oder fehlende Lib) faellt auf den OP-Check zurueck.
    private static Boolean checkNode(ServerPlayerEntity player, String node) {
        return triState(net.minecraft.entity.Entity.class, player, node);
    }

    private static Boolean checkNodeSource(ServerCommandSource source, String node) {
        return triState(ServerCommandSource.class, source, node);
    }

    private static Boolean triState(Class<?> paramType, Object arg, String node) {
        try {
            Class<?> perms = Class.forName("me.lucko.fabric.api.permissions.v0.Permissions");
            Object tri = perms.getMethod("getPermissionValue", paramType, String.class)
                    .invoke(null, arg, node);
            String name = tri == null ? "DEFAULT" : tri.toString();
            if ("TRUE".equals(name)) return Boolean.TRUE;
            if ("FALSE".equals(name)) return Boolean.FALSE;
            return null; // DEFAULT -> OP-Fallback
        } catch (Throwable ignore) {
            return null; // Lib nicht vorhanden -> OP-Fallback
        }
    }
}
