from manim import *
class Youtube3test(Scene):
    def construct(self):
        text = Text("Das zum Beispiel")
        dreieck = Triangle(color=GREEN)
        kreis = Circle(color=PINK)
        rechteck = Rectangle(color=RED)
        strich = Line(LEFT *9, RIGHT *-2, color=RED)
        Prisma = Prism(dimensions=[3, 2, 1], fill_color=BLUE, fill_opacity=0.5, stroke_color=WHITE, stroke_width=2)

        #Strich animation
        target_position = RIGHT *2

        Objekte = VGroup(dreieck, kreis, rechteck)
        self.play(strich.animate.move_to(target_position), run_time=3
        )
        self.wait(0.3)
        self.play(Transform(strich, Prisma), run_time=1.7
        )
        self.wait(4)

        self.play(Transform(strich, text), run_time=2
        )
        self.wait(5)