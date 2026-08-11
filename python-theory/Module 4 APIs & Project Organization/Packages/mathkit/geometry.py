"""Geometry helpers - a module inside the mathkit package."""

import math


def area_of_circle(radius):
    """Area of a circle."""
    if radius < 0:
        raise ValueError("radius cannot be negative")
    return math.pi * radius ** 2


def perimeter_of_circle(radius):
    """Circumference of a circle."""
    if radius < 0:
        raise ValueError("radius cannot be negative")
    return 2 * math.pi * radius


def area_of_rectangle(width, height):
    """Area of a rectangle."""
    return width * height
