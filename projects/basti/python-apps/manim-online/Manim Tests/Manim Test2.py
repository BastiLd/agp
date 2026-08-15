from manim import *

class CircleToRectangle(Scene):
        def construct(self):
        # Großer Kreis mit Text "King"
        large_circle = Circle(radius=2, color=WHITE, fill_opacity=1).set_fill(RED)
        text_king = Text("King", color=WHITE).move_to(large_circle.get_center())
        
        # Kreis mit Text erscheinen lassen
        self.play(FadeIn(large_circle), Write(text_king))
        self.wait(1)
        
        # Rechteck-Umrandung aus kleinen Kreisen erstellen
        small_circle_radius = 0.2
        rectangle_width = 6
        rectangle_height = 4
        
        # Positionen für die Umrandung des Rechtecks berechnen
        positions = []
        for x in np.linspace(-rectangle_width / 2, rectangle_width / 2, 12):
            positions.append([x, rectangle_height / 2, 0])  # Obere Kante
            positions.append([x, -rectangle_height / 2, 0])  # Untere Kante
        for y in np.linspace(-rectangle_height / 2, rectangle_height / 2, 8):
            positions.append([-rectangle_width / 2, y, 0])  # Linke Kante
            positions.append([rectangle_width / 2, y, 0])  # Rechte Kante
        
        small_circles = VGroup(*[
            Circle(radius=small_circle_radius, color=RED, fill_opacity=1).set_fill(RED).move_to(pos)
            for pos in positions
        ])
        
        # Text "Mittelkap" erstellen
        text_mittelkap = Text("Mittelkap", color=WHITE).move_to(ORIGIN)
        
        # Animation: Großer Kreis zerfällt in kleine Kreise, die Rechteck-Umrandung bilden
        self.play(
            Transform(large_circle, small_circles, run_time=3),
            Transform(text_king, text_mittelkap, run_time=3),
        )
        self.wait(2)

        # Szene beenden
        self.play(FadeOut(small_circles), FadeOut(text_mittelkap))