from manim import *

class Quiz3(Scene):
    def construct(self):
        # Timer setup
        timer = ValueTracker(4)
        timer_text = DecimalNumber(4, num_decimal_places=0).scale(0.7)
        timer_text.add_updater(lambda t: t.set_value(int(timer.get_value())))
        
        # Timer circle
        timer_circle = Circle(radius=0.7, color=BLUE).set_fill(color=BLACK, opacity=1)
        timer_text.set_color(BLUE)

        def update_timer(dt):
            new_value = timer.get_value() - dt
            if new_value <= 0:
                timer.set_value(0)
                return
            timer.set_value(new_value)
            
        def start_timer():
             timer.set_value(4)
             self.add_updater(update_timer)
        
        def stop_timer():
            self.remove_updater(update_timer)

        # Question 1
        question1 = Text("Welche Form hat ein Prisma?", font_size=40).move_to(UP*2)
        
        # Answer buttons
        answers1 = VGroup(
            VGroup(Rectangle(width=3, height=1.5, color=WHITE), Text("Quadrat", font_size=28).move_to(ORIGIN)),
            VGroup(Rectangle(width=3, height=1.5, color=WHITE), Text("Dreieck", font_size=28).move_to(ORIGIN)),
            VGroup(Rectangle(width=3, height=1.5, color=WHITE), Text("Rechteck", font_size=28).move_to(ORIGIN)),
            VGroup(Rectangle(width=3, height=1.5, color=WHITE), Text("Dreidimensionale\nFigur", font_size=22).move_to(ORIGIN))
        )
        
        for group in answers1:
            group[1].move_to(group[0].get_center())
        
        answers1.arrange_in_grid(rows=2, cols=2, buff=1).move_to(DOWN*1.5)
        
        timer_circle.move_to(answers1.get_left() + LEFT * 2)
        timer_text.move_to(timer_circle.get_center())

        self.play(Write(question1), Write(answers1), Write(timer_circle), Write(timer_text))
        start_timer()
        self.wait(4)
        stop_timer()

        # Highlight correct answer in green
        correct_answer1 = answers1[3]
        self.play(correct_answer1[0].animate.set_fill(GREEN, opacity=0.5).set_color(GREEN), timer.animate.set_value(0))

        # Highlight incorrect answers in red
        incorrect_answers1 = VGroup(answers1[0], answers1[1], answers1[2])
        self.play(*[group[0].animate.set_fill(RED, opacity=0.5).set_color(RED) for group in incorrect_answers1])
        
        self.wait(1)
        
        # Question 2
        question2 = Text("Was ist das Volumen eines Prismas?", font_size=40).move_to(UP*2)
        answers2 = VGroup(
            VGroup(Rectangle(width=3, height=1.5, color=WHITE), Text("Länge * Breite", font_size=22).move_to(ORIGIN)),
            VGroup(Rectangle(width=3, height=1.5, color=WHITE), Text("Länge * Breite\n* Höhe", font_size=22).move_to(ORIGIN)),
             VGroup(Rectangle(width=3, height=1.5, color=WHITE), Text("Grundfläche\n* Höhe", font_size=22).move_to(ORIGIN)),
            VGroup(Rectangle(width=3, height=1.5, color=WHITE), Text("Keine der oben\ngenannten", font_size=22).move_to(ORIGIN))
        )
        
        for group in answers2:
            group[1].move_to(group[0].get_center())

        answers2.arrange_in_grid(rows=2, cols=2, buff=1).move_to(DOWN*1.5)
        timer_circle.move_to(answers2.get_left() + LEFT * 2)
        timer_text.move_to(timer_circle.get_center())
        
        self.play(ReplacementTransform(question1, question2), ReplacementTransform(answers1, answers2), timer_circle.animate.move_to(answers2.get_left() + LEFT * 2), timer_text.animate.move_to(answers2.get_left() + LEFT * 2))
        start_timer()
        self.wait(4)
        stop_timer()

        # Highlight correct answer in green
        correct_answer2 = answers2[2]
        self.play(correct_answer2[0].animate.set_fill(GREEN, opacity=0.5).set_color(GREEN), timer.animate.set_value(0))

        # Highlight incorrect answers in red
        incorrect_answers2 = VGroup(answers2[0], answers2[1], answers2[3])
        self.play(*[group[0].animate.set_fill(RED, opacity=0.5).set_color(RED) for group in incorrect_answers2])
        
        self.wait(1)
        
        # Question 3
        question3 = Text("Was sind die Seitenflächen eines Prismas?", font_size=40).move_to(UP*2)
        answers3 = VGroup(
            VGroup(Rectangle(width=3, height=1.5, color=WHITE), Text("Rechtecke", font_size=28).move_to(ORIGIN)),
            VGroup(Rectangle(width=3, height=1.5, color=WHITE), Text("Dreiecke", font_size=28).move_to(ORIGIN)),
            VGroup(Rectangle(width=3, height=1.5, color=WHITE), Text("Quadrate", font_size=28).move_to(ORIGIN)),
            VGroup(Rectangle(width=3, height=1.5, color=WHITE), Text("Trapeze", font_size=28).move_to(ORIGIN))
        )

        for group in answers3:
           group[1].move_to(group[0].get_center())
           
        answers3.arrange_in_grid(rows=2, cols=2, buff=1).move_to(DOWN*1.5)
        timer_circle.move_to(answers3.get_left() + LEFT * 2)
        timer_text.move_to(timer_circle.get_center())

        self.play(ReplacementTransform(question2, question3), ReplacementTransform(answers2, answers3), timer_circle.animate.move_to(answers3.get_left() + LEFT * 2), timer_text.animate.move_to(answers3.get_left() + LEFT * 2))
        start_timer()
        self.wait(4)
        stop_timer()
        
        correct_answer3 = answers3[0]
        self.play(correct_answer3[0].animate.set_fill(GREEN, opacity=0.5).set_color(GREEN), timer.animate.set_value(0))
        
        incorrect_answers3 = VGroup(answers3[1], answers3[2], answers3[3])
        self.play(*[group[0].animate.set_fill(RED, opacity=0.5).set_color(RED) for group in incorrect_answers3])
        
        self.wait(1)

        # Question 4
        question4 = Text("Wie viele Grundflächen hat ein Prisma?", font_size=40).move_to(UP*2)
        answers4 = VGroup(
             VGroup(Rectangle(width=3, height=1.5, color=WHITE), Text("1", font_size=28).move_to(ORIGIN)),
            VGroup(Rectangle(width=3, height=1.5, color=WHITE), Text("2", font_size=28).move_to(ORIGIN)),
            VGroup(Rectangle(width=3, height=1.5, color=WHITE), Text("3", font_size=28).move_to(ORIGIN)),
            VGroup(Rectangle(width=3, height=1.5, color=WHITE), Text("4", font_size=28).move_to(ORIGIN))
        )
        
        for group in answers4:
            group[1].move_to(group[0].get_center())
        
        answers4.arrange_in_grid(rows=2, cols=2, buff=1).move_to(DOWN*1.5)
        timer_circle.move_to(answers4.get_left() + LEFT * 2)
        timer_text.move_to(timer_circle.get_center())
        
        self.play(ReplacementTransform(question3, question4), ReplacementTransform(answers3, answers4), timer_circle.animate.move_to(answers4.get_left() + LEFT * 2), timer_text.animate.move_to(answers4.get_left() + LEFT * 2))
        start_timer()
        self.wait(4)
        stop_timer()
        
        correct_answer4 = answers4[1]
        self.play(correct_answer4[0].animate.set_fill(GREEN, opacity=0.5).set_color(GREEN), timer.animate.set_value(0))
        
        incorrect_answers4 = VGroup(answers4[0], answers4[2], answers4[3])
        self.play(*[group[0].animate.set_fill(RED, opacity=0.5).set_color(RED) for group in incorrect_answers4])

        self.wait(1)

        # Question 5
        question5 = Text("Was ist die Oberfläche eines Prismas?", font_size=40).move_to(UP * 2)
        answers5 = VGroup(
            VGroup(Rectangle(width=3, height=1.5, color=WHITE), Text("Grundfläche * Höhe", font_size=22).move_to(ORIGIN)),
            VGroup(Rectangle(width=3, height=1.5, color=WHITE), Text("Summe aller\nSeitenflächen", font_size=22).move_to(ORIGIN)),
            VGroup(Rectangle(width=3, height=1.5, color=WHITE), Text("2 * Grundfläche +\nSeitenflächen", font_size=22).move_to(ORIGIN)),
            VGroup(Rectangle(width=3, height=1.5, color=WHITE), Text("Länge * Breite * Höhe", font_size=22).move_to(ORIGIN))
        )

        for group in answers5:
            group[1].move_to(group[0].get_center())
        
        answers5.arrange_in_grid(rows=2, cols=2, buff=1).move_to(DOWN*1.5)
        timer_circle.move_to(answers5.get_left() + LEFT * 2)
        timer_text.move_to(timer_circle.get_center())

        self.play(ReplacementTransform(question4, question5), ReplacementTransform(answers4, answers5), timer_circle.animate.move_to(answers5.get_left() + LEFT * 2), timer_text.animate.move_to(answers5.get_left() + LEFT * 2))
        start_timer()
        self.wait(4)
        stop_timer()

        correct_answer5 = answers5[2]
        self.play(correct_answer5[0].animate.set_fill(GREEN, opacity=0.5).set_color(GREEN), timer.animate.set_value(0))
        
        incorrect_answers5 = VGroup(answers5[0], answers5[1], answers5[3])
        self.play(*[group[0].animate.set_fill(RED, opacity=0.5).set_color(RED) for group in incorrect_answers5])

        self.wait(1)
        
        # Question 6
        question6 = Text("Welche Prismenart hat zwei dreieckige Grundflächen?", font_size=34).move_to(UP * 2)
        answers6 = VGroup(
            VGroup(Rectangle(width=3, height=1.5, color=WHITE), Text("Quader", font_size=28).move_to(ORIGIN)),
            VGroup(Rectangle(width=3, height=1.5, color=WHITE), Text("Dreiecksprisma", font_size=28).move_to(ORIGIN)),
             VGroup(Rectangle(width=3, height=1.5, color=WHITE), Text("Vierecksprisma", font_size=28).move_to(ORIGIN)),
            VGroup(Rectangle(width=3, height=1.5, color=WHITE), Text("Sechsecksprisma", font_size=28).move_to(ORIGIN))
        )
        
        for group in answers6:
            group[1].move_to(group[0].get_center())

        answers6.arrange_in_grid(rows=2, cols=2, buff=1).move_to(DOWN * 1.5)
        timer_circle.move_to(answers6.get_left() + LEFT * 2)
        timer_text.move_to(timer_circle.get_center())

        self.play(ReplacementTransform(question5, question6), ReplacementTransform(answers5, answers6), timer_circle.animate.move_to(answers6.get_left() + LEFT * 2), timer_text.animate.move_to(answers6.get_left() + LEFT * 2))
        start_timer()
        self.wait(4)
        stop_timer()

        correct_answer6 = answers6[1]
        self.play(correct_answer6[0].animate.set_fill(GREEN, opacity=0.5).set_color(GREEN), timer.animate.set_value(0))
        
        incorrect_answers6 = VGroup(answers6[0], answers6[2], answers6[3])
        self.play(*[group[0].animate.set_fill(RED, opacity=0.5).set_color(RED) for group in incorrect_answers6])

        self.wait(1)
        
        # Question 7
        question7 = Text("Wie berechnet man die Mantelfläche eines Prismas?", font_size=34).move_to(UP * 2)
        answers7 = VGroup(
            VGroup(Rectangle(width=3, height=1.5, color=WHITE), Text("Umfang * Höhe", font_size=22).move_to(ORIGIN)),
            VGroup(Rectangle(width=3, height=1.5, color=WHITE), Text("Grundfläche * Höhe", font_size=22).move_to(ORIGIN)),
            VGroup(Rectangle(width=3, height=1.5, color=WHITE), Text("2 * Grundfläche", font_size=22).move_to(ORIGIN)),
            VGroup(Rectangle(width=3, height=1.5, color=WHITE), Text("Länge * Breite", font_size=22).move_to(ORIGIN))
        )

        for group in answers7:
            group[1].move_to(group[0].get_center())
            
        answers7.arrange_in_grid(rows=2, cols=2, buff=1).move_to(DOWN * 1.5)
        timer_circle.move_to(answers7.get_left() + LEFT * 2)
        timer_text.move_to(timer_circle.get_center())

        self.play(ReplacementTransform(question6, question7), ReplacementTransform(answers6, answers7), timer_circle.animate.move_to(answers7.get_left() + LEFT * 2), timer_text.animate.move_to(answers7.get_left() + LEFT * 2))
        start_timer()
        self.wait(4)
        stop_timer()

        correct_answer7 = answers7[0]
        self.play(correct_answer7[0].animate.set_fill(GREEN, opacity=0.5).set_color(GREEN), timer.animate.set_value(0))
        
        incorrect_answers7 = VGroup(answers7[1], answers7[2], answers7[3])
        self.play(*[group[0].animate.set_fill(RED, opacity=0.5).set_color(RED) for group in incorrect_answers7])

        self.wait(1)
        
        # Question 8
        question8 = Text("Was ist ein Prisma im geometrischen Sinne?", font_size=34).move_to(UP * 2)
        answers8 = VGroup(
            VGroup(Rectangle(width=3, height=1.5, color=WHITE), Text("Ein Polyeder mit\nzwei parallelen\nGrundflächen", font_size=18).move_to(ORIGIN)),
             VGroup(Rectangle(width=3, height=1.5, color=WHITE), Text("Eine Pyramide mit\nzwei Grundflächen", font_size=18).move_to(ORIGIN)),
            VGroup(Rectangle(width=3, height=1.5, color=WHITE), Text("Eine Kugel mit\nzwei Grundflächen", font_size=18).move_to(ORIGIN)),
            VGroup(Rectangle(width=3, height=1.5, color=WHITE), Text("Ein Zylinder mit\nzwei Grundflächen", font_size=18).move_to(ORIGIN))
        )

        for group in answers8:
            group[1].move_to(group[0].get_center())
            
        answers8.arrange_in_grid(rows=2, cols=2, buff=1).move_to(DOWN * 1.5)
        timer_circle.move_to(answers8.get_left() + LEFT * 2)
        timer_text.move_to(timer_circle.get_center())
        
        self.play(ReplacementTransform(question7, question8), ReplacementTransform(answers7, answers8), timer_circle.animate.move_to(answers8.get_left() + LEFT * 2), timer_text.animate.move_to(answers8.get_left() + LEFT * 2))
        start_timer()
        self.wait(4)
        stop_timer()
        
        correct_answer8 = answers8[0]
        self.play(correct_answer8[0].animate.set_fill(GREEN, opacity=0.5).set_color(GREEN), timer.animate.set_value(0))
        
        incorrect_answers8 = VGroup(answers8[1], answers8[2], answers8[3])
        self.play(*[group[0].animate.set_fill(RED, opacity=0.5).set_color(RED) for group in incorrect_answers8])

        self.wait(1)