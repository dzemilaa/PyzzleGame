from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from .algorithms import BFS, BestFS, AStar, hamming_distance, manhattan_distance
import json
@csrf_exempt
def solve_puzzle(request):
    state = list(map(int, request.GET['state'].split(',')))
    algorithm = request.GET['algorithm']
    heuristic = request.GET.get('heuristic', None)

    goal_state = list(range(1, 9)) + [0]

    if algorithm == "bfs":
        solver = BFS(state, goal_state)
    elif algorithm == "bestfs":
        if heuristic == "hamming":
            solver = BestFS(state, goal_state, hamming_distance)
        else:
            solver = BestFS(state, goal_state, manhattan_distance)
    elif algorithm == "astar":
        if heuristic == "hamming":
            solver = AStar(state, goal_state, hamming_distance)
        else:
            solver = AStar(state, goal_state, manhattan_distance)
    else:
        return JsonResponse({"error": "Nevažeći algoritam."})

    solution = solver.get_steps()
    return JsonResponse({"solution": solution})

