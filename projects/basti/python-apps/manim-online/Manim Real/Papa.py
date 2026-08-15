from manim import *

class Papa1(Scene):
    def construct(self):
        # Erstelle die Objekte
        l = Line(start=LEFT * 2, end=RIGHT * 3)
        t = Text("Sportverein Thörl Maglern\nHobby Tischtennis Tunier", stroke_width=2, stroke_color= WHITE, fill_opacity=0)
        image = ImageMobject(r"C:/Users/basti/Downloads/Folie1.jpg")
        image.scale(1)  # Bild vergrößern
        t2 = Text("Melden sie sich bei dieser \nE-Mailadresse: n@gd.at\nan.", stroke_width=2, stroke_color= WHITE, fill_opacity=0)
        t2.scale = 1

        # Animationen
        #self.play(Write(l))  # Linie zeichnen

        # Linie in Text umwandeln
        self.play(Write(t), run_time = 1.7)
        self.play(t.animate.shift(LEFT *3)
        
        )

        #self.play(t.animate.shift(LEFT *3))

                # Bild in der Mitte anzeigen
        self.play(FadeIn(image), image.animate.shift(RIGHT * 4), run_time = 2)

        self.play(t.animate.shift(UP *3), run_time = 2
        
        )
        
        self.play(Write(t2), run_time = 3
        
        )
        
        self.play(t2.animate.shift(LEFT *3.1), run_time = 2
        
        )
        
        self.play(t2.animate.shift(UP *1), run_time = 1
        
        )

        # Bild nach rechts verschieben
        #self.play(
        #)
        
        self.wait(5)
