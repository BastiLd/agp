from manim import *

class LightningToText(Scene):
    def construct(self):
        # Erstelle den Blitz
        lightning = SVGMobject("lightning_bolt.svg")  # SVG-Datei für den Blitz
        lightning.set_color(YELLOW)
        lightning.set_stroke(width=4)
        lightning.set_fill(YELLOW, opacity=1)
        lightning.scale(2)

        # Erstelle den Text
        text = Text("LightningDart", font_size=72).set_color(BLUE)

        # Animation des Blitzes
        self.play(FadeIn(lightning, scale=0.5))
        self.wait(0.5)

        # Transformiere den Blitz in den Text
        self.play(Transform(lightning, text), run_time=2)
        self.wait(1)

        # Zeige den Text kurz
        self.play(lightning.animate.scale(1.2).set_color(WHITE), run_time=0.5)
        self.wait(2)
