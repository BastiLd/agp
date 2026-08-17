from manim import *

class Papa(Scene):
    def construct(self):
        # Erstelle die Objekte
        l = Line(start=LEFT * 2, end=RIGHT * 3)
        t = Text("Sportverein Thörl Maglern\nHobby Tischtennis Tunier")
        image = ImageMobject(r"thor-hammer-svg-cut-files-hammer-clipart-vector-file.svg")
        image.scale(1)  # Bild vergrößern
        t2 = Text("Melden sie sich unter ... an \n&\nb kommen sie zum\n Feuerwehrhaus Thörl-Maglern")
        t2.scale = 1

        # Animationen
        #self.play(Write(l))  # Linie zeichnen

        # Linie in Text umwandeln
        self.play(Write(t))
        self.play(t.animate.shift(LEFT *3)
        )

        #self.play(t.animate.shift(LEFT *3))

                # Bild in der Mitte anzeigen
        self.play(Write(image), image.animate.shift(RIGHT * 4))

        self.play(t.animate.shift(UP *3))
        self.play(Write(t2), t2.animate.shift(LEFT *2, UP *1.4))

        # Bild nach rechts verschieben
        #self.play(
        #)
        
        self.wait(5)
