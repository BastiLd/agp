from manim import *

class CreateCircle(Scene):
    def construct(self):
        t = Text("Hello everyone")
        self.play(Write(t))
