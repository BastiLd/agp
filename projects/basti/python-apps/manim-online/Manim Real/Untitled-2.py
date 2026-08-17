from manim import *

class shrek3(Scene):
    def construct(self):
        t1 = Text("SIL", font = "Sentient").scale(1.5)
        t2 = Text("Shrek Is Love", font = "Sentient").scale(1.5)

        self.play(Write(t1))

        self.play(ReplacementTransform(t1[0], t2[0:5]), run_time = 0.75)
        self.play(ReplacementTransform(t1[1], t2[5:7]), t1[2].animate.shift(RIGHT*0.75), run_time = 0.75)
        self.play(ReplacementTransform(t1[2], t2[7:]), run_time = 0.75)

        w1 = t2[0:5]
        w2 = t2[5:7]
        w3 =t2[7:]

        self.add(w1, w2, w3)
        self.play(w1.animate.to_edge(UL),
                  w2.animate.move_to(ORIGIN),
                  w3.animate.to_edge(DR)
        )
        self.play(w1.animate.to_edge(DL),
                  w2.animate.move_to(ORIGIN),
                  w3.animate.to_edge(UR)
        )
        self.play(
                  w1.animate.to_edge(DR),
                  w2.animate.move_to(ORIGIN),
                  w3.animate.to_edge(UL)
        )
        self.play(
                  w1.animate.to_edge(UR),
                  w2.animate.move_to(ORIGIN),
                  w3.animate.to_edge(DL)
        )
        self.play(w1.animate.to_edge(UL),
                  w2.animate.move_to(ORIGIN),
                  w3.animate.to_edge(DR)
        
        
        )

        self.wait(3)