from manim import *

class Quiz6(Scene):
    def construct(self):
        # Timer setup
        timer = ValueTracker(16)
        timer_text = DecimalNumber(16, num_decimal_places=0).scale(0.7)
        timer_text.add_updater(lambda t: t.set_value(int(timer.get_value())))
        
        # Timer circle
        timer_circle = Circle(radius=0.7, color=BLUE).set_fill(color=BLACK, opacity=1)
        timer_text.set_color(BLUE)
        timer_text.add_updater(lambda t: t.move_to(timer_circle.get_center()))

        def update_timer(dt):
            new_value = timer.get_value() - dt
            if new_value <= 0:
                timer.set_value(0)
                return
            timer.set_value(new_value)
            
        def start_timer():
             timer.set_value(16)
             self.add_updater(update_timer)
        
        def stop_timer():
            self.remove_updater(update_timer)

        # Question
        question = Text("Wie viele Grundflächen\nhat ein Prisma?", font_size=40).move_to(UP*2)
        
        # Answer buttons
        answers = VGroup(
            VGroup(Rectangle(width=3, height=1.5, color=WHITE), Text("5", font_size=28).move_to(ORIGIN)),
            VGroup(Rectangle(width=3, height=1.5, color=WHITE), Text("3", font_size=28).move_to(ORIGIN)),
            VGroup(Rectangle(width=3, height=1.5, color=WHITE), Text("4", font_size=28).move_to(ORIGIN)),
            VGroup(Rectangle(width=3, height=1.5, color=WHITE), Text("2", font_size=28).move_to(ORIGIN))
        )
        
        for group in answers:
            group[1].move_to(group[0].get_center())
        
        answers.arrange_in_grid(rows=2, cols=2, buff=1).move_to(DOWN*1.5)
        
        timer_circle.move_to(answers.get_left() + LEFT * 2)
        
        self.play(Write(question), Write(answers), Write(timer_circle), Write(timer_text))
        start_timer()
        self.wait(16)
        stop_timer()
        
        # Highlight correct answer
        correct_answer = answers[3]
        self.play(correct_answer[0].animate.scale(1.5).set_stroke(GREEN, width=6).move_to(ORIGIN))
        
        # Hide incorrect answers
        incorrect_answers = VGroup(answers[0], answers[1], answers[2])
        self.play(*[group.animate.set_opacity(0) for group in incorrect_answers])
        
        self.wait(2)
