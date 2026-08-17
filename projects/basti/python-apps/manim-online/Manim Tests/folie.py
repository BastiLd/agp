from manim import *

class Folie(Scene):
    def construct(self):
        q = Text("Quiz: Bastian").scale(0.8)
        p = Text("Powerpoint: Ioannis und Andrea").scale(0.8)
        i = Text("Informationen: Stevan und Benjamin").scale(0.8)
        
        # Erstes Erscheinen
        self.play(Write(q))
        self.play(q.animate.to_edge(UP))

        self.play(Write(p))
        self.play(p.animate.next_to(q, DOWN, buff=0.5))

        self.play(Write(i))
        self.play(i.animate.next_to(p, DOWN, buff=0.5))

        self.wait(2)

        # Verschiebung der Elemente an die neuen Positionen
        self.play(
            q.animate.shift(DOWN * 1.5),  # Quiz nach unten in die Mitte
            p.animate.shift(LEFT * 3 + DOWN * 1.6),  # PowerPoint nach links und unten
            i.animate.shift(RIGHT * 2.3 + DOWN * 1.7)  # Infos nach rechts und unten
        )

        self.wait(3)
