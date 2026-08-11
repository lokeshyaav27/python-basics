"""Descriptive statistics - a second module inside the mathkit package."""


def mean(values):
    """Arithmetic mean."""
    if not values:
        raise ValueError("cannot average an empty sequence")
    return sum(values) / len(values)


def median(values):
    """Middle value; average of the two middle values when the count is even."""
    if not values:
        raise ValueError("cannot take the median of an empty sequence")
    ordered = sorted(values)
    middle = len(ordered) // 2
    if len(ordered) % 2:
        return ordered[middle]
    return (ordered[middle - 1] + ordered[middle]) / 2


def spread(values):
    """Difference between the largest and smallest value."""
    return max(values) - min(values)
