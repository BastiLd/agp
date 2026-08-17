from manim import *
class Timeline(Scene):
    def construct(self):
        t = Text("1826|1889|1890|1925|1950|1995|2020")
        r = Rectangle(width = 3, height = 4)
        o = ImageMobject("Bild2.png")
        o.scale(4)
        c = NumberPlane().add_coordinates()
        i = ImageMobject("Bild3.png")
        i.scale(0.7)
        m = ImageMobject("a7+III.png")
        m.scale(0.7)

        #self.add(c)
        self.play(Write(t), run_time = 3)
        self.play(t.animate.shift(LEFT *1))
        self.play(t.animate.shift(UP *3.5))
        self.wait(1)

        self.play(FadeIn(o))
        self.play(o.animate.shift(LEFT *4),
        #self.play(o.animate.shift(UP *1),
                  FadeIn(i))
        self.play(i.animate.shift(UP *1.5))
        self.play(i.animate.shift(RIGHT *4),
                  FadeIn(m))
        self.play(m.animate.shift(DOWN *2))
        self.play(m.animate.shift(RIGHT *4)) 
        self.wait(3)