from manim import *

class PrismDispersion(Scene):
    def construct(self):
        welle_1 = FunctionGraph(
            lambda x: 0.4 * np.sin(3 * x),
            x_range=[-7, 4],
            color=BLUE,
        ).shift(LEFT *2, RIGHT *2)

        self.play(Create(welle_1), run_time=4
        )
        self.wait(3)