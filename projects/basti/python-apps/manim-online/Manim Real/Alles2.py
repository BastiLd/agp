from manim import *
config.pixel_height = 1080  # Höhe des Bildes in Pixel
config.pixel_width = 1920  # Breite des Bildes in Pixel
config.frame_height = 10.80  # Höhe des Frames in der manim-Einheit
config.frame_width = 19.20  # Breite des Frames in der manim-Einheit

class Test(Scene):
    def construct(self):
        # Objekte
        dreieckrechts = Triangle(fill_color=ORANGE, fill_opacity=0.4).shift(UP * 2).shift(RIGHT * 2)
        dreiecklinks = Triangle(fill_color=GREEN, fill_opacity=0.4).shift(UP * 2).shift(LEFT * 2)
        dreieckmitte = Triangle(fill_color=BLUE, fill_opacity=0.4).shift(UP * 2)
        text1 = Text("In was werden sich die Dreiecke wohl verwandeln?\nIhr habt 9 sekunden um zu überlegen.", color=TEAL_D, font_size=40)
        linedr = Line(start= LEFT * 0, end= RIGHT * 2, color=ORANGE).shift(UP * 4).shift(RIGHT * 2)
        linedl = Line(start= LEFT * 2, end= RIGHT * 0, color=ORANGE).shift(UP * 4).shift(LEFT * 2)
        linem  = Line(start= LEFT * 1, end= RIGHT * 1, color=ORANGE).shift(UP * 4)

        # Text und Linien
        self.play(Create(linedr),
                  Create(linedl),
                  Create(linem),
                  Write(text1),
                  Transform(linedr, dreieckrechts),
                  Transform(linedl, dreiecklinks),
                  Transform(linem, dreieckmitte)
        )
        self.wait(10)

        #neue Objekte
        rechteckdr = Rectangle(fill_color=GREEN, fill_opacity=0.4, color=GREEN)
        kreisdr = Circle(fill_color=ORANGE, fill_opacity=0.4)
        pentagonm = RegularPolygon(n=5, fill_color=BLUE, fill_opacity=0.4)
        text2 = MarkupText(
    f"<span fgcolor='{ORANGE}'>Orange in einen Kreis</span>"
    f"<span fgcolor='{TEAL_E}'>, </span>"
    f"<span fgcolor='{BLUE}'>Blau in ein Pentagon</span>"
    f"<span fgcolor='{TEAL_E}'>, </span>"
    f"<span fgcolor='{GREEN}'>Grün in ein Rechteck</span>",
    font_size=40
)



        self.play(Transform(linedr, rechteckdr.shift(DOWN * 2)),  # Verschiebe nach unten
                  Transform(linedl, kreisdr.shift(DOWN * 2)),    # Verschiebe nach unten
                  Transform(linem, pentagonm.shift(DOWN * 2)),
                  Transform(text1, text2)
        )
        self.wait(0)

        self.play(linedr.animate.shift(RIGHT * 3, UP * 4.3),
                  linedl.animate.move_to(dreiecklinks.get_center()),
                  linem.animate.move_to(dreieckmitte.get_center())
        )
        self.wait(10)