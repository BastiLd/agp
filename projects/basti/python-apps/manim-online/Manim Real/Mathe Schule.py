from manim import *
class Mathe(Scene):
  def construct(self):
    
    t = Text("Frage 1")
    a3 = Text("Antwort 1")
    a4 = Text("Antwort 2")
    a = Text("Antwort 3")
    a2 = Text("Antwort 4")
    
    
    self.play(Write(t))
    self.play(t.animate.shift(UP *3))
    self.play(Write(a))
    self.play(a.animate.shift(DOWN *2))
    self.play(Write(a2))
    self.play(a2.animate.shift(RIGHT *3))
    self.play(a2.animate.shift(DOWN *2))
    self.play(a.animate.shift(LEFT *2))
    self.play(a3.animate.shift(LEFT *2))
    self.play(a4.animate.shift(RIGHT *3))
    self.play(Flash(a[3].get_top(), color = PURE_BLUE, line_lenght = 18, num_lines = 36, line_stroke_width = 4))
    
    self.wait(3)