from manim import *

class TextAnimation(Scene):
    def construct(self):
        # Text1: "Hallo an alle die das hier sehen."
        text1 = Text("Hallo an alle die das hier sehen.")
        self.play(Write(text1))
        self.wait(1)
        
        # Wechsel zu Text2: "Das hier ist eine Beispiel animation."
        text2 = Text("Das hier ist eine Beispiel animation.")
        self.play(Transform(text1, text2))
        self.wait(2)
        
        # Text zu einem grünen Dreieck (gefüllt) transformieren
        triangle = Polygon(
            [0, 1, 0], [-1, -1, 0], [1, -1, 0],
            color=GREEN, fill_opacity=0.4
        )
        self.play(Transform(text1, triangle))
        self.wait(2)
        
        # Grünes Dreieck ausblenden und orangenen Kreis (gefüllt) einblenden
        self.play(FadeOut(text1))
        self.play(FadeIn(triangle))
        circle = Circle(color=ORANGE, fill_opacity=0.4)
        self.play(FadeIn(circle))
        self.wait(1)
        
        # Rotes Rechteck (gefüllt) einblenden, ohne den Kreis auszublenden
        rectangle = Rectangle(color=RED, fill_opacity=0.4)
        self.play(FadeIn(rectangle))
        self.wait(1)
        
        # Grünes Dreieck, orangenen Kreis und rotes Rechteck auseinander bewegen
        self.play(
            FadeIn(triangle),
            triangle.animate.shift(LEFT * 4.5),
            circle.animate.shift(LEFT * 0.5),
            rectangle.animate.shift(RIGHT * 5)
        )
        self.wait(1)
        
        # Text3: "Das war die Demonstration." weiter unten erscheinen lassen
        text3 = Text("Das war die Demonstration.").shift(DOWN * 2)
        self.play(Write(text3))
        self.wait(1)
        
        self.play(
            FadeOut(triangle),
            FadeOut(circle),
            FadeOut(rectangle),)

        # Wechsel zu Text4: "Wenn ihr sowas wollt schreibt mir." an der selben Position wie Text3
        text4 = Text("Bewertet diese Animation gerne.\n                          ;)").shift(UP * 1)
        self.play(Transform(text3, text4))
        self.wait(4)