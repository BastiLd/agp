from manim import *

class All(Scene):
    def construct(self):
        # Hauptüberschrift mit weißer Outline
        t = Text(
            "Aufstiegsmöglichkeiten & Gehalt",
            color=BLACK,  # Keine Füllung
            stroke_color=WHITE,  # Weiße Outline
            stroke_width=2  # Breite der Outline
        ).shift(LEFT * 2, UP * 2)

        # Weitere Inhalte mit weißer Outline
        t2 = Text(
            "Metalltechniker: 1800-2700 \nMaschienenbautechniker: 2800 \nWerkzeugbautechniker: 1750-4000",
            color=BLACK,  # Keine Füllung
            stroke_color=WHITE,  # Weiße Outline
            stroke_width=2  # Breite der Outline
        ).shift(RIGHT * 1.7)

        # Animationen
        self.play(Write(t), run_time=3)
        self.play(Write(t2), run_time=9.9,
        
          )  # Längere Animationszeit
        self.wait(4)
