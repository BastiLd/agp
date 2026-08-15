from manim import *

class CircleToRectangle(Scene):
    def construct(self):
        # Create a grid in the middle
        grid = NumberPlane(x_range=(-7, 7), y_range=(-3, 3), axis_config={"color": BLUE})
        grid.set_opacity(0.5)
        self.add(grid)

        # Create a yellow-filled circle
        circle = Circle(radius=1, color=YELLOW, fill_opacity=1)
        self.play(Create(circle))

        # Create a red rectangle
        rectangle = Rectangle(width=2, height=1, color=RED, fill_opacity=1)

        # Transform the circle into the rectangle
        self.play(Transform(circle, rectangle))

        # Define the corners of the rectangle
        corners = [
            rectangle.get_corner(UL),
            rectangle.get_corner(UR),
            rectangle.get_corner(DL),
            rectangle.get_corner(DR)
        ]

        # Display the coordinates of the corners
        for corner in corners:
            coord_text = Text(f"({corner[0]:.1f}, {corner[1]:.1f})", font_size=24).next_to(corner, UP)
            self.play(Write(coord_text))

        self.wait(2)