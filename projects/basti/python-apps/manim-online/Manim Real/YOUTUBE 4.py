from manim import *
import numpy as np

class Youtube4(Scene):
    def construct(self):
        # Textobjekt
        t = Text(
            "Hallo, heute wird sich viel Bewegen.", 
            color=BLACK, 
            stroke_color=WHITE, 
            stroke_width=2.4
        )
        
        # Geometrische Objekte
        c = Circle()
        r = Rectangle()
        i = Triangle()

        # Reguläres Fünfeck definieren (gleichmäßig verteilte Punkte mit Rotation)
        p = Polygon(
            *[np.array([np.cos(theta + np.pi / 2), np.sin(theta + np.pi / 2), 0]) 
              for theta in np.linspace(0, 2 * np.pi, 6)[:-1]]
        )
        p.set_fill(BLUE, opacity=0.5)  # Füllfarbe und Transparenz
        p.set_stroke(WHITE, width=2)  # Randfarbe und Breite
        
        # Linie
        l = Line(start=LEFT * 3, end=RIGHT * 1.7)

        # Liste der Formen
        Formen = [p, c, r, i]
        
        # Animationen
        self.play(Create(l))  # Linie erstellen

        # Transformation zu jeder Form in der Liste
        for form in Formen:
            form.move_to(UP * 2 + RIGHT * 2)  # Form verschieben
            
            self.play(Write(t), run_time=4
            
            )
            
            self.play(Transform(l, form), run_time=2)
        
        self.wait(5)  # Wartezeit
