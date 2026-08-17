from manim import *
class Leonard(Scene):
    def construct(self):
        t = Text("Hallo Leonard")
        t2 = Text("Wie war die HTL?")
        u1 = Underline(t, color = PURE_BLUE)

        self.play(Write(t))

        self.play(t.animate.shift(LEFT *4.8))
        self.play(t.animate.shift(UP *3.5))
        self.play(GrowFromCenter(u1))

        for i in range(len(t2)):
            self.play(GrowFromCenter(t2[i]), run_time = 0.1)
        
    
        self.play(Flash(t2[10].get_top(), color = PURE_GREEN, line_length = 0.8, num_lines = 15))

        self.play(t2.animate.to_edge(UR),
                  u1.animate.shift(RIGHT *3.7, UP *3.27))
        
        t3 = Text("UND was ist SÜ/HÜ?\nWas war in Deutsch?")

        for i in range(len(t3)):
            self.play(GrowFromCenter(t3[i]), run_time = 0.1,)

        self.play(ShowPassingFlashWithThinningStrokeWidth(t3))
        
    
        self.play(Flash(t3[11].get_top(), color = PURE_GREEN, line_length = 0.8, num_lines = 15),
                  Flash(t3[23].get_top(), color = PURE_GREEN, line_length = 0.8, num_lines = 15))

        

        self.wait(3)

