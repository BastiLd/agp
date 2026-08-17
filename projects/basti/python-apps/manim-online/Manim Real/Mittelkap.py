from manim import *

class MittelKap(Scene):
    def construct(self):
        # Hintergrundfarbe auf grün setzen
        self.camera.background_color = GREEN

        image = ImageMobject(r"C:/Users/basti/Downloads/channels4_profile.jpg")
        image.scale(2)  # Bild vergrößern
        image.move_to(ORIGIN)  # Bild in der Mitte starten

        # Texte erstellen
        text1 = Text("Hallo und willkommen auf meinem Kanal.").scale(0.75)
        text2 = Text("King-_-is_da")
        text3 = Text("Fühlen Sie sich frei, meinen Kanal zu abonnieren,\ndamit Sie keine Videos und Livestreams verpassen.").scale(0.75)

        # Animationssequenz
        self.play(FadeIn(image))
        self.play(image.animate.shift(LEFT * 6))
        self.play(Write(text1.move_to(ORIGIN)))
        self.wait(2)
        self.play(image.animate.shift(RIGHT * 6 + UP * 2), FadeOut(text1))
        self.play(Write(text2.move_to(ORIGIN)))
        self.wait(2)
        self.play(image.animate.shift(DOWN * 4), Transform(text2, text3.move_to(ORIGIN)))
        self.wait(4)  # Am Ende 4 Sekunden warten