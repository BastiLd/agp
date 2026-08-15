from manim import *

class Quiz(Scene):
    def construct(self):
        # Question 1
        question1 = Text("Welche Form hat ein Prisma?", font_size=48).move_to(UP*2)
        self.play(Write(question1))

        # Answer buttons
        answers1 = VGroup(
            VGroup(Rectangle(width=3, height=1.5, color=WHITE), Text("Quadrat", font_size=30).move_to(ORIGIN)),
            VGroup(Rectangle(width=3, height=1.5, color=WHITE), Text("Dreieck", font_size=30).move_to(ORIGIN)),
            VGroup(Rectangle(width=3, height=1.5, color=WHITE), Text("Rechteck", font_size=30).move_to(ORIGIN)),
            VGroup(Rectangle(width=3, height=1.5, color=WHITE), Text("Dreidimensionale\nFigur", font_size=25).move_to(ORIGIN))
        )
        
        for group in answers1:
            group[1].move_to(group[0].get_center())
        
        answers1.arrange_in_grid(rows=2, cols=2, buff=1).move_to(DOWN*1.5)
        self.play(Write(answers1))

        self.wait(3)

        # Highlight correct answer in green
        correct_answer1 = answers1[3]
        self.play(correct_answer1[0].animate.set_fill(GREEN, opacity=0.5).set_color(GREEN))

        # Highlight incorrect answers in red
        incorrect_answers1 = VGroup(answers1[0], answers1[1], answers1[2])
        self.play(*[group[0].animate.set_fill(RED, opacity=0.5).set_color(RED) for group in incorrect_answers1])
        
        self.wait(3)
        
        # Question 2
        question2 = Text("Was ist das Volumen eines Prismas?", font_size=48).move_to(UP*2)
        answers2 = VGroup(
            VGroup(Rectangle(width=3, height=1.5, color=WHITE), Text("Länge * Breite", font_size=25).move_to(ORIGIN)),
            VGroup(Rectangle(width=3, height=1.5, color=WHITE), Text("Länge * Breite\n* Höhe", font_size=25).move_to(ORIGIN)),
             VGroup(Rectangle(width=3, height=1.5, color=WHITE), Text("Grundfläche\n* Höhe", font_size=25).move_to(ORIGIN)),
            VGroup(Rectangle(width=3, height=1.5, color=WHITE), Text("Keine der oben\ngenannten", font_size=25).move_to(ORIGIN))
        )
        
        for group in answers2:
            group[1].move_to(group[0].get_center())

        answers2.arrange_in_grid(rows=2, cols=2, buff=1).move_to(DOWN*1.5)
        
        self.play(ReplacementTransform(question1, question2), ReplacementTransform(answers1, answers2))


        self.wait(3)

        # Highlight correct answer in green
        correct_answer2 = answers2[2]
        self.play(correct_answer2[0].animate.set_fill(GREEN, opacity=0.5).set_color(GREEN))

        # Highlight incorrect answers in red
        incorrect_answers2 = VGroup(answers2[0], answers2[1], answers2[3])
        self.play(*[group[0].animate.set_fill(RED, opacity=0.5).set_color(RED) for group in incorrect_answers2])
        
        self.wait(3)

        # Question 3
        question3 = Text("Was sind die Seitenflächen eines Prismas?", font_size=48).move_to(UP*2)
        answers3 = VGroup(
            VGroup(Rectangle(width=3, height=1.5, color=WHITE), Text("Rechtecke", font_size=30).move_to(ORIGIN)),
            VGroup(Rectangle(width=3, height=1.5, color=WHITE), Text("Dreiecke", font_size=30).move_to(ORIGIN)),
            VGroup(Rectangle(width=3, height=1.5, color=WHITE), Text("Quadrate", font_size=30).move_to(ORIGIN)),
            VGroup(Rectangle(width=3, height=1.5, color=WHITE), Text("Trapeze", font_size=30).move_to(ORIGIN))
        )

        for group in answers3:
           group[1].move_to(group[0].get_center())
           
        answers3.arrange_in_grid(rows=2, cols=2, buff=1).move_to(DOWN*1.5)
        self.play(ReplacementTransform(question2, question3), ReplacementTransform(answers2, answers3))

        self.wait(3)
        
        correct_answer3 = answers3[0]
        self.play(correct_answer3[0].animate.set_fill(GREEN, opacity=0.5).set_color(GREEN))
        
        incorrect_answers3 = VGroup(answers3[1], answers3[2], answers3[3])
        self.play(*[group[0].animate.set_fill(RED, opacity=0.5).set_color(RED) for group in incorrect_answers3])
        
        self.wait(3)

        # Question 4
        question4 = Text("Wie viele Grundflächen hat ein Prisma?", font_size=48).move_to(UP*2)
        answers4 = VGroup(
             VGroup(Rectangle(width=3, height=1.5, color=WHITE), Text("1", font_size=30).move_to(ORIGIN)),
            VGroup(Rectangle(width=3, height=1.5, color=WHITE), Text("2", font_size=30).move_to(ORIGIN)),
            VGroup(Rectangle(width=3, height=1.5, color=WHITE), Text("3", font_size=30).move_to(ORIGIN)),
            VGroup(Rectangle(width=3, height=1.5, color=WHITE), Text("4", font_size=30).move_to(ORIGIN))
        )
        
        for group in answers4:
            group[1].move_to(group[0].get_center())
        
        answers4.arrange_in_grid(rows=2, cols=2, buff=1).move_to(DOWN*1.5)
        self.play(ReplacementTransform(question3, question4), ReplacementTransform(answers3, answers4))

        self.wait(3)
        
        correct_answer4 = answers4[1]
        self.play(correct_answer4[0].animate.set_fill(GREEN, opacity=0.5).set_color(GREEN))
        
        incorrect_answers4 = VGroup(answers4[0], answers4[2], answers4[3])
        self.play(*[group[0].animate.set_fill(RED, opacity=0.5).set_color(RED) for group in incorrect_answers4])


        self.wait(3)