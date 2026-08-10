package de.bastild.restoreinv;

public class MousePositionHelper {
    public static double lastMouseX = -1;
    public static double lastMouseY = -1;

    public static void save(double x, double y) {
        lastMouseX = x;
        lastMouseY = y;
    }

    public static void restore() {
        if (lastMouseX >= 0 && lastMouseY >= 0) {
            long window = org.lwjgl.glfw.GLFW.glfwGetCurrentContext();
            org.lwjgl.glfw.GLFW.glfwSetCursorPos(window, lastMouseX, lastMouseY);
        }
    }
}
