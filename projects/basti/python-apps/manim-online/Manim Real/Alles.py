from manim import *

class GenScene(Scene):
    def construct(self):
        # Text
        text = Text("Hello World")

        # Formen
        circle = Circle()
        pentagon = RegularPolygon(5)
        triangle = Triangle()
        rectangle = Rectangle(width=3, height=2)
        ellipse = Ellipse(width=4, height=2)
        star = self.create_glowing_star(YELLOW)
        square = Square()
        line = Line(start=[-2, 0, 0], end=[2, 0, 0])
        hexagon = RegularPolygon(6)
        arrow = Arrow(start=[-1, 0, 0], end=[1, 0, 0])
        diamond = Polygon([0, 1, 0], [1, 0, 0], [0, -1, 0], [-1, 0, 0])

        # Benutzerdefinierte Formen
        heart = ParametricFunction(
            lambda t: np.array([
                16 * np.sin(t)**3,
                13 * np.cos(t) - 5 * np.cos(2*t) - 2 * np.cos(3*t) - np.cos(4*t),
                0
            ]) * 0.05, t_range=[0, TAU], color=RED
        )
        wave = FunctionGraph(lambda x: np.sin(x), x_range=[-PI, PI], color=ORANGE)
        gear = VGroup(
            Circle(radius=1, color=GRAY, fill_opacity=1),
            *[Rectangle(height=0.3, width=0.1, color=GRAY, fill_opacity=1).rotate(PI/6 * i).move_to([np.cos(PI/6 * i), np.sin(PI/6 * i), 0]) for i in range(12)]
        )
        cloud = VGroup(
            Circle(radius=0.5, color=BLUE, fill_opacity=1).shift(LEFT*0.5 + UP*0.2),
            Circle(radius=0.6, color=BLUE, fill_opacity=1).shift(RIGHT*0.5 + UP*0.2),
            Circle(radius=0.4, color=BLUE, fill_opacity=1)
        )
        crescent_moon = VGroup(
            Circle(radius=1, color=YELLOW, fill_opacity=1).shift(LEFT*0.2),
            Circle(radius=0.8, color=BLACK, fill_opacity=1).shift(RIGHT*0.2)
        )
        spiral = ParametricFunction(lambda t: np.array([np.cos(t), np.sin(t), 0]) * t, t_range=[0, 6 * PI], color=BLUE)

        # Weitere Formen
        octagon = RegularPolygon(8)
        diamond_2 = Polygon([-1, 1, 0], [1, 1, 0], [1, -1, 0], [-1, -1, 0])
        pentagram = self.create_glowing_star(RED)
        right_triangle = Polygon([0, 0, 0], [1, 0, 0], [0, 1, 0])
        hexagram = RegularPolygon(6).scale(0.6)
        trapezoid = Polygon([-2, -1, 0], [2, -1, 0], [1, 1, 0], [-1, 1, 0])
        ellipse_2 = Ellipse(width=5, height=3)

        # Animationen
        self.play(Write(text))
        shapes = [
            circle, pentagon, triangle, rectangle, ellipse, star, square, line, hexagon,
            arrow, diamond, heart, wave, gear, cloud, crescent_moon, spiral,
            octagon, diamond_2, pentagram, right_triangle, hexagram, trapezoid, ellipse_2
        ]
        for shape in shapes:
            self.play(Transform(text, shape))
            self.wait(0.5)

        self.wait(3)

    def create_glowing_star(self, color, scale=1):
        """Erstellt einen Stern mit Glow-Effekt."""
        star = Star(color=color, fill_color=color, fill_opacity=1).scale(scale)
        glow_effect = VGroup(
            Star(color=color, fill_opacity=0.2).scale(scale * 1.3),
            Star(color=color, fill_opacity=0.1).scale(scale * 1.6),
            Star(color=color, fill_opacity=0.05).scale(scale * 2.0),
        )
        return VGroup(glow_effect, star)
        
        self.wait(5)