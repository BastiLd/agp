from manim import *

class CountUpEasing(Scene):
    def construct(self):
        # Start- und Endwert
        start_value = 0
        end_value = 14000605

        # Textobjekt
        number = DecimalNumber(start_value, num_decimal_places=0).scale(2)
        number.move_to(ORIGIN)
        self.add(number)

        # Update-Funktion für das Hochzählen
        def update_number(mob, alpha):
            value = interpolate(start_value, end_value, alpha**2)  # Quadratische Beschleunigung
            mob.set_value(value)

        # Animation
        self.play(
            UpdateFromAlphaFunc(number, update_number),
            run_time=7
        )

        # Kurz warten
        self.wait(1)
