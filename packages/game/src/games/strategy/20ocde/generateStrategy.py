"""Generate the exact O outcome table embedded in strategy.ts.

Run: python3 generateStrategy.py --verify
Use --check to verify the saved table without rewriting it. --plies controls
how much of the opening tree is precomputed (default: four individual turns).
Every saved result is solved to the end, regardless of --plies. The TypeScript
strategy performs the same exact search when a position is absent from the table.

A position records only O-free lines and their empty squares. An empty square
is either shared by a row and column, or private to one remaining line. Lines
already containing O cannot win for X. Permuting rows/columns or transposing the
board preserves the game, so equivalent positions share a canonical state.

Moves outside all remaining lines cannot improve either player's result: O can
block a live line instead, and X can fill another relevant square instead. If
only one relevant square remains, X wins with its first placement. Removing
all live lines is a proven O win even though the board is not yet full.
"""

import argparse
from functools import lru_cache
from itertools import permutations, product
import json
from pathlib import Path
import random
from time import monotonic

BOARD_SIZE = 5
BEGIN = '// BEGIN GENERATED O OUTCOMES'
END = '// END GENERATED O OUTCOMES'


def transpose(rows, columns):
    return (
        tuple((private, sum(1 << r for r, (_, mask) in enumerate(rows)
                            if mask & (1 << c))) for c, private in enumerate(columns)),
        tuple(private for private, _ in rows),
    )


def oriented(rows, columns):
    groups = {}
    for c, private in enumerate(columns):
        signature = (private, sum(bool(mask & (1 << c)) for _, mask in rows))
        groups.setdefault(signature, []).append(c)
    best = None
    for group_order in product(*(permutations(groups[key]) for key in sorted(groups))):
        order = sum(group_order, ())
        reordered = tuple(sorted(
            (private, sum(1 << i for i, c in enumerate(order) if mask & (1 << c)))
            for private, mask in rows
        ))
        candidate = (reordered, tuple(columns[c] for c in order))
        if best is None or candidate < best:
            best = candidate
    return best


@lru_cache(maxsize=100_000)
def canonical(rows, columns):
    if len(rows) < len(columns):
        return canonical(*transpose(rows, columns))
    result = oriented(rows, columns)
    if len(rows) == len(columns) and rows:
        result = min(result, oriented(*transpose(rows, columns)))
    return result


def line_sizes(position):
    rows, columns = position
    return ([private + mask.bit_count() for private, mask in rows]
            + [private + sum(bool(mask & (1 << c)) for _, mask in rows)
               for c, private in enumerate(columns)])


def squares(position):
    """One representative per equivalent group of relevant empty squares."""
    rows, columns = position
    for r, (private, mask) in enumerate(rows):
        if private:
            yield r, -1
        for c in range(len(columns)):
            if mask & (1 << c):
                yield r, c
    for c, private in enumerate(columns):
        if private:
            yield -1, c


def place(position, square, is_o):
    rows, columns = position
    r, c = square
    if not is_o:
        rows, columns = list(rows), list(columns)
        if r < 0:
            columns[c] -= 1
        elif c < 0:
            rows[r] = (rows[r][0] - 1, rows[r][1])
        else:
            rows[r] = (rows[r][0], rows[r][1] & ~(1 << c))
        return canonical(tuple(rows), tuple(columns))
    # O removes its row/column. Other empty intersections on a removed line
    # become private squares of the perpendicular lines that remain.
    remaining_rows = []
    for i, (private, mask) in enumerate(rows):
        if i == r:
            continue
        if c >= 0:
            private += bool(mask & (1 << c))
            mask = (mask & ((1 << c) - 1)) | ((mask >> (c + 1)) << c)
        remaining_rows.append((private, mask))
    remaining_columns = tuple(
        private + int(r >= 0 and bool(rows[r][1] & (1 << j)))
        for j, private in enumerate(columns) if j != c
    )
    return canonical(tuple(remaining_rows), remaining_columns)


def children(position, is_o):
    seen = set()
    for first in squares(position):
        after = place(position, first, is_o)
        # X wins as soon as its first placement completes a line.
        if is_o or 0 in line_sizes(after):
            if after not in seen:
                seen.add(after)
                yield after
            continue
        for second in squares(after):
            result = place(after, second, False)
            if result not in seen:
                seen.add(result)
                yield result


class Solver:
    def __init__(self):
        self.outcomes = {}

    def solve(self, position, is_o):
        key = (position, is_o)
        if key in self.outcomes:
            return self.outcomes[key]
        sizes = line_sizes(position)
        if not sizes:
            result = True
        elif 0 in sizes:
            result = False
        elif not is_o and min(sizes) <= 2:
            result = False
        elif is_o:
            urgent = {i for i, size in enumerate(sizes) if size <= 2}
            result = False
            for square in squares(position):
                r, c = square
                removed = ({r} if r >= 0 else set()) | (
                    {len(position[0]) + c} if c >= 0 else set())
                if urgent <= removed and self.solve(place(position, square, True), False):
                    result = True
                    break
        else:
            result = all(self.solve(child, True) for child in children(position, False))
        self.outcomes[key] = result
        return result

    def explore(self, position, is_o, plies, visited=None):
        if visited is None:
            visited = set()
        key = (position, is_o, plies)
        if key in visited:
            return
        visited.add(key)
        self.solve(position, is_o)
        sizes = line_sizes(position)
        if not plies or not sizes or 0 in sizes:
            return
        for child in children(position, is_o):
            self.explore(child, not is_o, plies - 1, visited)


def from_board(cells):
    rows = [r for r in range(BOARD_SIZE)
            if all(cells[r * BOARD_SIZE + c] != 'O' for c in range(BOARD_SIZE))]
    columns = [c for c in range(BOARD_SIZE)
               if all(cells[r * BOARD_SIZE + c] != 'O' for r in range(BOARD_SIZE))]
    return canonical(
        tuple((sum(cells[r * BOARD_SIZE + c] == '.' for c in range(BOARD_SIZE) if c not in columns),
               sum(1 << i for i, c in enumerate(columns) if cells[r * BOARD_SIZE + c] == '.'))
              for r in rows),
        tuple(sum(cells[r * BOARD_SIZE + c] == '.' for r in range(BOARD_SIZE) if r not in rows)
              for c in columns),
    )


def verify():
    """Compare the reduced solver with an independent full-board minimax."""
    line_masks = [sum(1 << (r * BOARD_SIZE + c) for c in range(BOARD_SIZE))
                  for r in range(BOARD_SIZE)]
    line_masks += [sum(1 << (r * BOARD_SIZE + c) for r in range(BOARD_SIZE))
                   for c in range(BOARD_SIZE)]
    full = (1 << (BOARD_SIZE * BOARD_SIZE)) - 1

    @lru_cache(maxsize=None)
    def reference(os, xs, is_o):
        if any(xs & line == line for line in line_masks):
            return False
        free = full & ~(os | xs)
        if not free or all(os & line for line in line_masks):
            return True
        options = [1 << i for i in range(25) if free & (1 << i)]
        if is_o:
            return any(reference(os | bit, xs, False) for bit in options)
        for i, first in enumerate(options):
            if any((xs | first) & line == line for line in line_masks):
                return False
            for second in options[i + 1:]:
                if not reference(os, xs | first | second, True):
                    return False
        return True

    solver = Solver()
    examples = [
        ('.....' '.X.X.' '..OX.' '.X.OX' '..X.O', [1, 5], [0]),
        ('.X.XO' '.....' 'XO...' '.XO..' 'X.X..', [23], [5]),
        ('.O.X.' '..X..' '...OX' '.X.XO' '..X..', [5, 20], [2, 12, 17]),
        ('.OX..' 'X..X.' 'XX...' 'O...X' '..O..', [14], [9, 13]),
    ]
    for board, expected, losing in examples:
        winners = [i for i, cell in enumerate(board) if cell == '.'
                   and solver.solve(from_board(board[:i] + 'O' + board[i + 1:]), False)]
        assert set(expected) <= set(winners), (board, winners, expected)
        assert not set(losing) & set(winners), (board, winners, losing)
    rng = random.Random(2026)
    checked = 0
    for _ in range(250):
        cells = ['.'] * 25
        order = list(range(25))
        rng.shuffle(order)
        # Legal turn counts, late enough for an unpruned independent search.
        turns = rng.choice([5, 6, 7])
        is_o = rng.choice([False, True])
        o_count = turns if is_o else turns + 1
        for index in order[:o_count]:
            cells[index] = 'O'
        for index in order[o_count:o_count + turns * 2]:
            cells[index] = 'X'
        os = sum(1 << i for i, cell in enumerate(cells) if cell == 'O')
        xs = sum(1 << i for i, cell in enumerate(cells) if cell == 'X')
        if any(xs & line == line for line in line_masks):
            continue
        expected = reference(os, xs, is_o)
        assert solver.solve(from_board(cells), is_o) == expected, cells
        # Independently permute rows and columns; the canonical state must match.
        row_order, column_order = list(range(5)), list(range(5))
        rng.shuffle(row_order)
        rng.shuffle(column_order)
        transformed = [cells[r * 5 + c] for r in row_order for c in column_order]
        assert from_board(cells) == from_board(transformed)
        checked += 1
    print(f'Verified all four counterexamples and {checked} full-board minimax comparisons.')


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--plies', type=int, default=4)
    parser.add_argument('--verify', action='store_true')
    parser.add_argument('--check', action='store_true')
    args = parser.parse_args()
    if not 0 <= args.plies <= 17:
        parser.error('--plies must be between 0 and 17')
    if args.verify:
        verify()
    start = monotonic()
    solver = Solver()
    initial = from_board('.' * 25)
    solver.explore(initial, True, args.plies)
    entries = {('O' if is_o else 'X') + json.dumps(position, separators=(',', ':')): outcome
               for (position, is_o), outcome in solver.outcomes.items()}
    data = json.dumps(entries, sort_keys=True, indent=2)
    # JSON property syntax is valid TypeScript; retain the repository's trailing comma style.
    data = data[:-2] + ',\n}' if entries else data
    block = (BEGIN + '\n// Generated by generateStrategy.py; do not edit by hand.\n'
             + 'const generatedOOutcomes: Record<string, boolean> = ' + data + ';\n' + END)
    target = Path(__file__).with_name('strategy.ts')
    original = target.read_text()
    if original.count(BEGIN) != 1 or original.count(END) != 1:
        raise SystemExit('Expected exactly one generated O outcomes block in strategy.ts')
    before, remainder = original.split(BEGIN)
    _, after = remainder.split(END)
    updated = before + block + after
    if args.check:
        if original != updated:
            raise SystemExit('Saved O table is stale; run generateStrategy.py to regenerate it.')
    elif original != updated:
        target.write_text(updated)
    print(f'{len(entries)} exact outcomes; initial O forced win: {solver.solve(initial, True)}; '
          f'{monotonic() - start:.2f}s. ' + ('Table verified.' if args.check else 'Table saved.'))


if __name__ == '__main__':
    main()
