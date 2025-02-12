from manim import *
class FirstLaw(Scene):
    def construct(self):
        # Resting Ball
        resting_ball = Circle(radius=0.5, color=BLUE).move_to(LEFT * 3)
        resting_label = Text("At Rest").next_to(resting_ball, DOWN)
        self.play(Create(resting_ball), Write(resting_label))

        # Moving Ball
        moving_ball = Circle(radius=0.5, color=GREEN).move_to(RIGHT * 3)
        moving_label = Text("In Motion").next_to(moving_ball, DOWN)
        self.play(Create(moving_ball), Write(moving_label))

        # Animate Moving Ball
        self.play(moving_ball.animate.shift(LEFT * 4), run_time=2)
        
        # Collision
        barrier = Line(UP, DOWN).set_color(RED).move_to(LEFT)
        self.play(Create(barrier))
        self.play(moving_ball.animate.shift(LEFT * 0.5).set_color(RED))
        
        # Show Text
        law_text = Text("Objects remain at rest or in motion unless acted on by an external force", font_size=24).to_edge(DOWN)
        self.play(Write(law_text))
        self.wait(3)
class SecondLaw(Scene):
    def construct(self):
        # Objects with different masses
        light_mass = Square(side_length=0.5, color=BLUE).shift(UP + LEFT * 3)
        heavy_mass = Square(side_length=1, color=GREEN).shift(DOWN + LEFT * 3)
        self.play(Create(light_mass), Create(heavy_mass))

        # Apply Forces
        force_arrow_light = Arrow(start=LEFT, end=RIGHT, buff=0.5).next_to(light_mass, LEFT)
        force_arrow_heavy = Arrow(start=LEFT, end=RIGHT, buff=0.5).next_to(heavy_mass, LEFT)

        self.play(GrowArrow(force_arrow_light), GrowArrow(force_arrow_heavy))

        # Animate Acceleration
        self.play(light_mass.animate.shift(RIGHT * 5), run_time=2)
        self.play(heavy_mass.animate.shift(RIGHT * 2), run_time=2)

        # Show Formula
        formula = MathTex("F = ma").to_edge(UP)
        self.play(Write(formula))

        # Explanation
        text = Text("More mass = less acceleration for the same force", font_size=24).to_edge(DOWN)
        self.play(Write(text))
        self.wait(3)
class MagneticFieldLines(Scene):
    def construct(self):
        # Create a current-carrying wire
        wire = Line(LEFT, RIGHT).set_color(RED)
        self.play(Create(wire))

        # Draw magnetic field lines around the wire
        for i in range(-3, 4):
            for j in range(-2, 3):
                if i != 0 or j != 0:
                    line = Arrow(
                        start=i * 0.5 * UP + j * 0.5 * RIGHT,
                        end=0.1 * i * UP + 0.1 * j * RIGHT,
                        buff=0,
                        color=YELLOW,
                    )
                    self.play(Create(line), run_time=0.2)

        # Add a compass needle to show the direction of the magnetic field
        compass = Arrow(
            ORIGIN, 0.3 * RIGHT, color=BLUE, buff=0
        )
        compass.next_to(wire.get_center(), UP + RIGHT, buff=0.5)
        self.play(Create(compass), run_time=2)

        # Fade out the compass
        self.play(FadeOut(compass))

class LorentzTransformation(Scene):
    def construct(self):
        # Axes for stationary and moving frames
        axes_stationary = Axes(
            x_range=[-3, 3, 1],
            y_range=[-3, 3, 1],
            axis_config={"color": GREY},
        ).shift(LEFT * 4)

        axes_moving = Axes(
            x_range=[-3, 3, 1],
            y_range=[-3, 3, 1],
            axis_config={"color": GREY},
        ).shift(RIGHT * 4)

        # Stationary Frame Object
        stationary_dot = Dot(color=BLUE).move_to(axes_stationary.coords_to_point(0, 0))

        # Moving Frame Object (contracted and dilated)
        moving_dot = Dot(color=RED).move_to(axes_moving.coords_to_point(0, 0))

        # Lorentz Factor
        gamma = 1 / np.sqrt(1 - 0.8**2)  # Assume v = 0.8c

        # Transformations
        length_contraction = moving_dot.animate.scale(1 / gamma).shift(UP * 1.5)
        time_dilation = moving_dot.animate.shift(UP * 1.5)

        # Add to scene
        self.add(axes_stationary, axes_moving, stationary_dot, moving_dot)

        # Apply Lorentz transformations
        self.play(length_contraction, run_time=2)
        self.play(time_dilation, run_time=2)
        self.wait()
import numpy as np
class ThirdLawOfMotion(Scene):
    def construct(self):
        # Create objects with adjusted positions and scaling
        wall = Rectangle(height=2, width=0.3, color=BLUE).shift(LEFT * 4)
        ball = Circle(radius=0.4, color=RED).shift(RIGHT * 2)
        
        # Add labels
        wall_label = Text("Wall", font_size=24).next_to(wall, UP)
        ball_label = Text("Ball", font_size=24).next_to(ball, UP)
        
        self.play(FadeIn(wall), FadeIn(ball), Write(wall_label), Write(ball_label))
        
        # Animate ball moving towards wall
        ball_velocity_arrow = Arrow(
            start=ball.get_center(),
            end=ball.get_center() + LEFT * 1,
            buff=0.1,
            color=GREEN
        )
        self.play(GrowArrow(ball_velocity_arrow))
        self.play(ball.animate.shift(LEFT * 2), run_time=2)
        
        # Collision effect
        collision_text = Text("Collision!", font_size=36, color=YELLOW).move_to(UP * 2)
        self.play(Indicate(ball, color=RED), Write(collision_text))
        
        # Reaction force with adjusted scaling and position
        reaction_arrow = Arrow(
            start=wall.get_right(),
            end=wall.get_right() + LEFT * 0.5,
            buff=0.1,
            color=PURPLE
        )
        action_arrow = Arrow(
            start=ball.get_left(),
            end=ball.get_left() + RIGHT * 0.5,
            buff=0.1,
            color=ORANGE
        )
        
        reaction_label = Text("Reaction", font_size=20, color=PURPLE).next_to(reaction_arrow, LEFT)
        action_label = Text("Action", font_size=20, color=ORANGE).next_to(action_arrow, RIGHT)
        
        self.play(GrowArrow(action_arrow), Write(action_label))
        self.play(GrowArrow(reaction_arrow), Write(reaction_label))
        
        # Add motion effects
        self.play(ball.animate.shift(RIGHT * 1), wall.animate.shift(LEFT * 0.1), run_time=2)
        
        # Final Message
        final_message = Text("Every Action has an Equal and Opposite Reaction", font_size=24, color=BLUE).to_edge(DOWN)
        self.play(Write(final_message))
        
        self.wait(2)
class SolarSystemWithGravity(Scene):
    def construct(self):
        # Sun
        sun = Dot(color=YELLOW).scale(2)
        self.add(sun)

        # Planetary Data: Approximate scaled radii and initial velocities
        planet_data = [
            {"radius": 1, "color": GREEN, "mass": 0.055, "velocity": [0, -1.5]},  # Mercury
            {"radius": 1.5, "color": ORANGE, "mass": 0.815, "velocity": [0, -1.2]},  # Venus
            {"radius": 2, "color": BLUE, "mass": 1, "velocity": [0, -1]},  # Earth
            {"radius": 2.5, "color": RED, "mass": 0.107, "velocity": [0, -0.8]},  # Mars
        ]

        planets = VGroup()
        velocity_vectors = []
        for data in planet_data:
            planet = Dot(color=data["color"]).move_to(RIGHT * data["radius"])
            planets.add(planet)
            velocity_vectors.append(np.array(data["velocity"]))

        self.add(planets)

        # Gravitational constant and Sun mass (scaled)
        G = 1
        sun_mass = 1000

        # Updater for planetary motion
        def update_planet(planet, index):
            # Current position of the planet
            position = planet.get_center()
            # Vector pointing toward the Sun
            to_sun = np.array([0, 0, 0]) - position
            distance = np.linalg.norm(to_sun)
            # Gravitational force (F = G * m1 * m2 / r^2)
            force_magnitude = G * sun_mass * planet_data[index]["mass"] / (distance**2)
            force_vector = force_magnitude * to_sun / distance  # Normalize direction
            # Acceleration (a = F / m)
            acceleration = force_vector / planet_data[index]["mass"]
            # Update velocity
            velocity_vectors[index] += acceleration * 0.1  # Time step
            # Update position based on velocity
            planet.shift(velocity_vectors[index] * 0.1)

        for i, planet in enumerate(planets):
            planet.add_updater(lambda m, i=i: update_planet(m, i))

        # Run the animation
        self.wait(10) 
class LissajousCurve(Scene):
    def construct(self):
        # Axes
        axes = Axes(
            x_range=[-1.5, 1.5, 0.5],
            y_range=[-1.5, 1.5, 0.5],
            axis_config={"color": GREY},
        )

        # Particle following the Lissajous path
        particle = Dot(color=RED)

        # Parametric function for Lissajous curve
        curve = axes.plot_parametric_curve(
            lambda t: np.array([np.sin(2 * t), np.sin(3 * t), 0]),
            t_range=[0, 2 * np.pi],
            color=BLUE,
        )

        self.add(axes, curve, particle)

        # Animate the particle
        self.play(
            MoveAlongPath(particle, curve, rate_func=linear),
            run_time=5
        )
        self.wait()
class ETLWorkflow(Scene):
    def construct(self):
        # Create nodes for ETL components
        extract_node_csv = Circle(radius=0.6, color=BLUE).move_to(LEFT * 5)
        extract_node_csv_label = Text("CSV Source").scale(0.5).next_to(extract_node_csv, DOWN)

        extract_node_api = Circle(radius=0.6, color=BLUE).move_to(LEFT * 5 + UP * 2)
        extract_node_api_label = Text("API Source").scale(0.5).next_to(extract_node_api, UP)

        transform_node = Rectangle(width=2, height=1, color=YELLOW).move_to(ORIGIN)
        transform_label = Text("Transform\n(Clean, Filter)").scale(0.5).move_to(transform_node)

        load_node_db = Circle(radius=0.6, color=GREEN).move_to(RIGHT * 5 + UP * 2)
        load_node_db_label = Text("Database").scale(0.5).next_to(load_node_db, UP)

        load_node_dw = Circle(radius=0.6, color=GREEN).move_to(RIGHT * 5 + DOWN * 2)
        load_node_dw_label = Text("Data Warehouse").scale(0.5).next_to(load_node_dw, DOWN)

        # Draw nodes
        self.play(Create(extract_node_csv), Write(extract_node_csv_label))
        self.play(Create(extract_node_api), Write(extract_node_api_label))
        self.play(Create(transform_node), Write(transform_label))
        self.play(Create(load_node_db), Write(load_node_db_label))
        self.play(Create(load_node_dw), Write(load_node_dw_label))

        # Arrows for data flow
        arrow_csv_to_transform = Arrow(start=extract_node_csv.get_right(), end=transform_node.get_left(), color=WHITE)
        arrow_api_to_transform = Arrow(start=extract_node_api.get_right(), end=transform_node.get_top(), color=WHITE)
        arrow_transform_to_db = Arrow(start=transform_node.get_right(), end=load_node_db.get_left(), color=WHITE)
        arrow_transform_to_dw = Arrow(start=transform_node.get_bottom(), end=load_node_dw.get_top(), color=WHITE)

        # Draw arrows
        self.play(Create(arrow_csv_to_transform), Create(arrow_api_to_transform))
        self.play(Create(arrow_transform_to_db), Create(arrow_transform_to_dw))

        # Animate data flow
        data_dot_csv = Dot(color=BLUE).move_to(extract_node_csv.get_center())
        data_dot_api = Dot(color=BLUE).move_to(extract_node_api.get_center())
        
        self.play(data_dot_csv.animate.move_to(transform_node.get_left()), run_time=2)
        self.play(data_dot_api.animate.move_to(transform_node.get_top()), run_time=2)

        transformed_dot = Dot(color=YELLOW).move_to(transform_node.get_center())
        self.play(transformed_dot.animate.move_to(load_node_db.get_left()), run_time=2)
        self.play(transformed_dot.copy().animate.move_to(load_node_dw.get_top()), run_time=2)

        # Add explanation
        explanation = Text("ETL Workflow: Extract, Transform, Load").to_edge(DOWN)
        self.play(Write(explanation))
        self.wait(3)

from manim import *
import networkx as nx
import numpy as np

class DijkstraVsAStar(Scene):
    def construct(self):
        # Step 1: Create two grids for comparison
        grid_size = 10  # Larger grid size
        dijkstra_graph = nx.grid_2d_graph(grid_size, grid_size)
        astar_graph = nx.grid_2d_graph(grid_size, grid_size)

        # Node positions for both graphs
        positions_dijkstra = {node: np.array([node[1], -node[0], 0]) for node in dijkstra_graph.nodes}
        positions_astar = {node: np.array([node[1] + grid_size + 2, -node[0], 0]) for node in astar_graph.nodes}

        # Assign random weights to edges in both graphs
        for edge in dijkstra_graph.edges:
            weight = np.random.randint(1, 10)
            dijkstra_graph.edges[edge]["weight"] = weight
            astar_graph.edges[edge]["weight"] = weight

        # Visualize the grids side by side
        dijkstra_nodes = [Dot(positions_dijkstra[node], radius=0.15, color=WHITE) for node in dijkstra_graph.nodes]
        astar_nodes = [Dot(positions_astar[node], radius=0.15, color=WHITE) for node in astar_graph.nodes]
        dijkstra_edges = [
            Line(positions_dijkstra[edge[0]], positions_dijkstra[edge[1]], color=GRAY)
            for edge in dijkstra_graph.edges
        ]
        astar_edges = [
            Line(positions_astar[edge[0]], positions_astar[edge[1]], color=GRAY)
            for edge in astar_graph.edges
        ]

        self.play(Create(VGroup(*dijkstra_edges, *dijkstra_nodes)))
        self.play(Create(VGroup(*astar_edges, *astar_nodes)))

        # Step 2: Highlight start and end nodes
        start = (0, 0)
        end = (grid_size - 1, grid_size - 1)
        start_dot_dijkstra = Dot(positions_dijkstra[start], radius=0.3, color=GREEN)
        end_dot_dijkstra = Dot(positions_dijkstra[end], radius=0.3, color=RED)
        start_dot_astar = Dot(positions_astar[start], radius=0.3, color=GREEN)
        end_dot_astar = Dot(positions_astar[end], radius=0.3, color=RED)
        self.play(
            Create(start_dot_dijkstra),
            Create(end_dot_dijkstra),
            Create(start_dot_astar),
            Create(end_dot_astar),
        )

        # Step 3: Implement Dijkstra's Algorithm
        def dijkstra_search(graph, positions, start, end, color):
            visited = set()
            frontier = {start}
            distances = {start: 0}

            while frontier:
                current = min(frontier, key=lambda node: distances[node])
                frontier.remove(current)
                visited.add(current)

                if current == end:
                    return visited

                for neighbor in graph.neighbors(current):
                    if neighbor not in visited:
                        frontier.add(neighbor)
                        tentative_distance = distances[current] + graph.edges[current, neighbor]["weight"]
                        if neighbor not in distances or tentative_distance < distances[neighbor]:
                            distances[neighbor] = tentative_distance
                            dot = Dot(positions[neighbor], color=color, radius=0.15)
                            yield dot

        # Step 4: Implement A* Algorithm
        def heuristic(a, b):
            return abs(a[0] - b[0]) + abs(a[1] - b[1])  # Manhattan distance

        def astar_search(graph, positions, start, end, color):
            visited = set()
            frontier = {start}
            distances = {start: 0}
            priorities = {start: heuristic(start, end)}

            while frontier:
                current = min(frontier, key=lambda node: priorities[node])
                frontier.remove(current)
                visited.add(current)

                if current == end:
                    return visited

                for neighbor in graph.neighbors(current):
                    if neighbor not in visited:
                        frontier.add(neighbor)
                        tentative_distance = distances[current] + graph.edges[current, neighbor]["weight"]
                        if neighbor not in distances or tentative_distance < distances[neighbor]:
                            distances[neighbor] = tentative_distance
                            priorities[neighbor] = tentative_distance + heuristic(neighbor, end)
                            dot = Dot(positions[neighbor], color=color, radius=0.15)
                            yield dot

        # Step 5: Animate the algorithms side by side
        dijkstra_color = YELLOW
        astar_color = BLUE
        dijkstra_gen = dijkstra_search(dijkstra_graph, positions_dijkstra, start, end, dijkstra_color)
        astar_gen = astar_search(astar_graph, positions_astar, start, end, astar_color)

        for _ in range(grid_size * grid_size // 2):  # Limit steps for animation purposes
            dijkstra_dot, astar_dot = None, None
            try:
                dijkstra_dot = next(dijkstra_gen)
            except StopIteration:
                pass

            try:
                astar_dot = next(astar_gen)
            except StopIteration:
                pass

            animations = []
            if dijkstra_dot:
                animations.append(FadeIn(dijkstra_dot))
            if astar_dot:
                animations.append(FadeIn(astar_dot))

            if animations:
                self.play(*animations, run_time=0.1)

        # Step 6: Highlight the final paths
        dijkstra_path = Line(positions_dijkstra[start], positions_dijkstra[end], color=dijkstra_color, stroke_width=4)
        astar_path = Line(positions_astar[start], positions_astar[end], color=astar_color, stroke_width=4)
        self.play(Create(dijkstra_path), Create(astar_path))

        # Step 7: Add labels for each grid
        dijkstra_label = Text("Dijkstra's Algorithm", font_size=24).next_to(dijkstra_path, UP)
        astar_label = Text("A* Algorithm", font_size=24).next_to(astar_path, UP)
        self.play(Write(dijkstra_label), Write(astar_label))

        self.wait(3)
if __name__ == "__main__":
    from manim import config

    # Adjust configuration for GIF output
    config.output_file = "magnetic_field_lines.gif"
    config.format = "gif"

    # Render the scene directly via CLI
    MagneticFieldLines().render()
