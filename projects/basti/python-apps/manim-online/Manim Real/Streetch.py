from manim import *

class ElasticStretchFromEdge(Scene):
    def construct(self):
        # Text erstellen
        text = Text("Stretch Me")
        self.add(text)  # Text in der Mitte platzieren

        # Dehnung und Bewegung nach links (von der linken Kante ausgehend)
        self.play(
            text.animate.stretch(2, dim=0).shift(LEFT * 2).set_about_edge(LEFT),  # Strecken von der linken Kante
            run_time=1.5
        )
        self.play(
            text.animate.stretch(0.5, dim=0).set_about_edge(LEFT),  # Zusammenziehen von der linken Kante
            run_time=1
        )
        self.play(
            text.animate.stretch(1, dim=0).set_about_edge(LEFT),  # Zurück zur Originalform
            run_time=0.5
        )

        # Dehnung und Bewegung nach oben (von der oberen Kante ausgehend)
        self.play(
            text.animate.stretch(2, dim=1).shift(UP * 2).set_about_edge(UP),  # Strecken von der oberen Kante
            run_time=1.5
        )
        self.play(
            text.animate.stretch(0.5, dim=1).set_about_edge(UP),  # Zusammenziehen von der oberen Kante
            run_time=1
        )
        self.play(
            text.animate.stretch(1, dim=1).set_about_edge(UP),  # Zurück zur Originalform
            run_time=0.5
        )

        # Dehnung und Bewegung nach rechts (von der rechten Kante ausgehend)
        self.play(
            text.animate.stretch(2, dim=0).shift(RIGHT * 2).set_about_edge(RIGHT),  # Strecken von der rechten Kante
            run_time=1.5
        )
        self.play(
            text.animate.stretch(0.5, dim=0).set_about_edge(RIGHT),  # Zusammenziehen von der rechten Kante
            run_time=1
        )
        self.play(
            text.animate.stretch(1, dim=0).set_about_edge(RIGHT),  # Zurück zur Originalform
            run_time=0.5
        )

        # Dehnung und Bewegung nach unten (von der unteren Kante ausgehend)
        self.play(
            text.animate.stretch(2, dim=1).shift(DOWN * 2).set_about_edge(DOWN),  # Strecken von der unteren Kante
            run_time=1.5
        )
        self.play(
            text.animate.stretch(0.5, dim=1).set_about_edge(DOWN),  # Zusammenziehen von der unteren Kante
            run_time=1
        )
        self.play(
            text.animate.stretch(1, dim=1).set_about_edge(DOWN),  # Zurück zur Originalform
            run_time=0.5
        )

        self.wait(2)
