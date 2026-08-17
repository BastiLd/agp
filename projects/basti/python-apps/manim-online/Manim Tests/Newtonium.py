Kannst du mir dieses Programm erstellen in Pyhton, Java script oder so einfach den code für dieses Programm:

Also wenn man strg+f drückt soll ein suchfeld erscheinen das so aussicht wie im bild und mach es so das es filter optionen rechts gibt wo man sagen kann shortcuts wörter Auführungen wie einen cut zu setzen und das sollte fürs erste reichen.





from manim import *
class Newtonium(Scene):
    def construct(self):
        
        t = Text("Moinsie ;-) (-;")

        self.play(Write(t))
        self.wait(3)