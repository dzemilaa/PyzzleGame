from django.urls import path
from .views import solve_puzzle

urlpatterns = [
    path("solve/", solve_puzzle, name="solve_puzzle"),
]
