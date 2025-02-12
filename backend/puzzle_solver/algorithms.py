from collections import deque
import heapq
from django.http import JsonResponse

# Heuristics
def hamming_distance(state):
    return sum(1 for i, val in enumerate(state) if val != 0 and val != (i + 1))

def manhattan_distance(state):
    total_distance = 0
    for i, val in enumerate(state):
        if val != 0:
            target_pos = val - 1
            total_distance += abs(target_pos % 3 - i % 3) + abs(target_pos // 3 - i // 3)
    return total_distance

# Helper function to generate identification tuple
def get_id(state):
    return tuple(state)

class Algorithm:
    def __init__(self, initial_state, goal_state):
        self.initial_state = initial_state
        self.goal_state = goal_state

    def get_steps(self):
        raise NotImplementedError("Ova funkcija mora biti implementirana u podklasi.")


class BFS(Algorithm):
    def __init__(self, initial_state, goal_state):
        super().__init__(initial_state, goal_state)

    def get_steps(self):
        visited = set()  # Set to keep track of visited states
        queue = deque([(self.initial_state, [])])  # FIFO queue to explore states

        visited.add(tuple(self.initial_state))  # Mark initial state as visited

        while queue:
            state, path = queue.popleft()  # Get the next state and its associated path

            if state == self.goal_state:  # If the goal state is found, return the path
                return path

            # Generate neighbors (valid moves)
            for next_state, move in self.get_neighbors(state):
                next_tuple = tuple(next_state)
                if next_tuple not in visited:  # If state hasn't been visited
                    visited.add(next_tuple)  # Mark as visited
                    queue.append((next_state, path + [move]))  # Add new state to the queue

        return None  # Return None if no solution is found

    def get_neighbors(self, state):
        # Define possible moves (left, right, up, down)
        neighbors = []
        empty_index = state.index(0)  # Find the empty tile (represented by 0)
        moves = [-1, 1, -3, 3]  # Left, Right, Up, Down

        for move in moves:
            new_index = empty_index + move

            if 0 <= new_index < len(state):  # Check if the new index is within bounds
                if move == -1 and empty_index % 3 == 0:
                    continue  # Can't move left from the left edge
                if move == 1 and new_index % 3 == 0:
                    continue  # Can't move right from the right edge

                new_state = state[:]
                new_state[empty_index], new_state[new_index] = new_state[new_index], new_state[empty_index]
                neighbors.append((new_state, move))  # Append new state and move to the list

        return neighbors


class BestFS(Algorithm):
    def __init__(self, initial_state, goal_state, heuristic):
        super().__init__(initial_state, goal_state)
        self.heuristic = heuristic

    def get_steps(self):
        visited = set()
        priority_queue = []
        # Insert state with its heuristic and id for tie-breaking
        heapq.heappush(priority_queue, (self.heuristic(self.initial_state), self.initial_state, [], get_id(self.initial_state)))
        while priority_queue:
            _, state, path, _ = heapq.heappop(priority_queue)
            if state == self.goal_state:
                return path
            visited.add(tuple(state))

            for next_state, move in self.get_neighbors(state):
                if tuple(next_state) not in visited:
                    # Use heuristic for sorting and identification for tie-breaking
                    heapq.heappush(priority_queue, (self.heuristic(next_state), next_state, path + [move], get_id(next_state)))
        return None

    def get_neighbors(self, state):
        return BFS(state, self.goal_state).get_neighbors(state)

class AStar(Algorithm):
    def __init__(self, initial_state, goal_state, heuristic):
        super().__init__(initial_state, goal_state)
        self.heuristic = heuristic

    def get_steps(self):
        visited = set()
        priority_queue = []
        # Insert state with its heuristic, cost and id for tie-breaking
        heapq.heappush(priority_queue, (0 + self.heuristic(self.initial_state), self.initial_state, [], 0, get_id(self.initial_state)))
        while priority_queue:
            _, state, path, g, _ = heapq.heappop(priority_queue)
            if state == self.goal_state:
                return path
            visited.add(tuple(state))

            for next_state, move in self.get_neighbors(state):
                if tuple(next_state) not in visited:
                    f = g + 1 + self.heuristic(next_state)
                    # Use f(n) + id for tie-breaking in case of equal f values
                    heapq.heappush(priority_queue, (f, next_state, path + [move], g + 1, get_id(next_state)))
        return None

    def get_neighbors(self, state):
        return BFS(state, self.goal_state).get_neighbors(state)
