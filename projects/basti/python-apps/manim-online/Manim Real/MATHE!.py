from manim import *

class PrismaQuiz(Scene):
    def construct(self):
        # Frage
        f = Text("Was passiert wenn weißes Licht durch ein Prisma fliegt?", font = "Sentient")
        f.scale(0.8)
        f.shift(UP * 2.7)
        
        # Antwortmöglichkeiten (RICHTIGE SYNTAX)
        a1 = Text("A) Es bleibt weiß").scale(0.6)   # Kein Komma!
        a2 = Text("B) Es wird in Regenbogenfarben zerlegt").scale(0.6)  # Kein Komma!
        a3 = Text("C) Es wird schwarz").scale(0.6)  # Kein Komma!
        a4 = Text("D) Es reflektiert zurück").scale(0.6)  # Kein Komma!
        a3.shift(DOWN *2, LEFT *4.5)
        a4.shift(DOWN *2, RIGHT *4)

        # Antworttexte nebeneinander anordnen
        an = VGroup(a1, a2)  
        an.arrange(RIGHT *2, buff=1.5)  # Buff bestimmt den Abstand zwischen den Texten
        an.shift(DOWN * 0.5)

        an2 = VGroup(a3, a4)  
        an2.arrange(RIGHT *4.5, buff=1.5)  # Buff bestimmt den Abstand zwischen den Texten
        an2.shift(DOWN * 2)

        # Optional: Koordinatensystem anzeigen
        grid = NumberPlane()
        self.add(grid)

        # Animationen
        self.play(Write(f))
        self.play(Write(an))
        #self.play(Write(an2))
        for i in range(len(a3)):
            self.play(GrowFromCenter(a3[i]), run_time = 0.1)
        for i in range(len(a4)):
            self.play(GrowFromCenter(a4[i]), run_time = 0.1)

        self.wait(4)