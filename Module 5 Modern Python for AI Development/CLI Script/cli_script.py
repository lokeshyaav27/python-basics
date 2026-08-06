"""A real command-line tool built with argparse.

Try:
    python cli_script.py --help
    python cli_script.py stats 4 8 15 16 23 42
    python cli_script.py stats 4 8 15 --round 3 --verbose
    python cli_script.py convert 100 --to fahrenheit
    python cli_script.py words "the quick brown fox jumps over the lazy dog" -n 3
"""

import argparse
import sys
from collections import Counter


def build_parser():
    parser = argparse.ArgumentParser(
        prog="cli_script",
        description="A small toolbox demonstrating argparse.",
        epilog="Example:  python cli_script.py stats 1 2 3 --round 2",
        formatter_class=argparse.ArgumentDefaultsHelpFormatter,
    )
    # Global flags available to every subcommand
    parser.add_argument("--verbose", "-v", action="store_true", help="print extra detail")
    parser.add_argument("--version", action="version", version="%(prog)s 1.0.0")

    # Subcommands: `dest` tells us which one was chosen
    subcommands = parser.add_subparsers(dest="command", required=True,
                                        metavar="COMMAND")

    # --- stats ---
    stats = subcommands.add_parser("stats", help="summarise a list of numbers")
    stats.add_argument("numbers", nargs="+", type=float,
                       help="one or more numbers")
    stats.add_argument("--round", "-r", type=int, default=2, dest="places",
                       help="decimal places in the output")

    # --- convert ---
    convert = subcommands.add_parser("convert", help="convert a temperature")
    convert.add_argument("value", type=float, help="the temperature to convert")
    convert.add_argument("--to", choices=["celsius", "fahrenheit"],
                         default="fahrenheit", help="target unit")

    # --- words ---
    words = subcommands.add_parser("words", help="count word frequency in text")
    words.add_argument("text", help="the text to analyse (quote it)")
    words.add_argument("-n", "--top", type=int, default=5,
                       help="how many results to show")
    words.add_argument("--min-length", type=int, default=1,
                       help="ignore words shorter than this")

    return parser


def cmd_stats(args):
    numbers = args.numbers
    places = args.places
    ordered = sorted(numbers)
    middle = len(ordered) // 2
    median = (ordered[middle] if len(ordered) % 2
              else (ordered[middle - 1] + ordered[middle]) / 2)

    print(f"count  : {len(numbers)}")
    print(f"sum    : {round(sum(numbers), places)}")
    print(f"mean   : {round(sum(numbers) / len(numbers), places)}")
    print(f"median : {round(median, places)}")
    print(f"min/max: {round(min(numbers), places)} / {round(max(numbers), places)}")
    if args.verbose:
        print(f"sorted : {[round(n, places) for n in ordered]}")
    return 0


def cmd_convert(args):
    if args.to == "fahrenheit":
        result = args.value * 9 / 5 + 32
        print(f"{args.value}C = {result:.2f}F")
    else:
        result = (args.value - 32) * 5 / 9
        print(f"{args.value}F = {result:.2f}C")
    if args.verbose:
        print(f"(formula applied: {'C*9/5+32' if args.to == 'fahrenheit' else '(F-32)*5/9'})")
    return 0


def cmd_words(args):
    words = [w.strip(".,!?;:\"'").lower() for w in args.text.split()]
    words = [w for w in words if len(w) >= args.min_length]
    if not words:
        print("no words matched the filter", file=sys.stderr)
        return 1                                  # non-zero exit = failure

    counts = Counter(words)
    print(f"{len(words)} words, {len(counts)} unique")
    for word, count in counts.most_common(args.top):
        bar = "#" * count
        print(f"  {word:<12} {count:>2} {bar}")
    if args.verbose:
        print(f"filtered out words shorter than {args.min_length} chars")
    return 0


HANDLERS = {"stats": cmd_stats, "convert": cmd_convert, "words": cmd_words}


def main(argv=None):
    """Return an exit code: 0 for success, non-zero for failure."""
    args = build_parser().parse_args(argv)

    if args.verbose:
        print(f"[verbose] command={args.command} args={vars(args)}\n", file=sys.stderr)

    try:
        return HANDLERS[args.command](args)
    except (ValueError, ZeroDivisionError) as err:
        # Errors go to stderr so `tool > out.txt` still shows them
        print(f"error: {err}", file=sys.stderr)
        return 1
    except KeyboardInterrupt:
        print("\ninterrupted", file=sys.stderr)
        return 130


if __name__ == "__main__":
    # sys.exit sets the process exit code, which shells and CI check.
    sys.exit(main())
