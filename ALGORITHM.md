# Schedule Generation Algorithm

This document explains how the UniSmart schedule generation algorithm works. The system uses Google OR-Tools CP-SAT (Constraint Programming - Satisfiability) solver to find optimal course schedules that satisfy hard constraints while maximizing soft constraints (user preferences).

## Table of Contents

- [Algorithm Overview](#algorithm-overview)
- [Step-by-Step Process](#step-by-step-process)
- [Constraint Types](#constraint-types)
- [Scoring System](#scoring-system)
- [Why CP-SAT?](#why-cp-sat)
- [Visual Example](#visual-example)

## Algorithm Overview

The schedule generation algorithm uses **constraint programming** to solve a complex optimization problem. It finds multiple valid schedule combinations and ranks them by how well they match user preferences.

The algorithm works in four main phases:
1. **Preparation**: Validate inputs and filter available sections
2. **Constraint Modeling**: Build a CP-SAT model with hard and soft constraints
3. **Solving**: Use the solver to find optimal solutions
4. **Scoring & Ranking**: Evaluate and sort solutions by preference match

## Step-by-Step Process

### Phase 1: Preparation and Validation

#### Step 1: Validate Course IDs
- Ensures all selected courses exist in the database
- Raises an error if any course ID is invalid

#### Step 2: Filter Valid Sections
- Excludes full sections where `enrolled_count >= capacity`
- Organizes sections by course and type (Lectures vs Recitations)
- Result structure: `{course_id: {"lectures": [...], "recitations": [...]}}`

#### Step 3: Build Conflict Graph
- For each pair of sections, checks if they have time conflicts
- Two sections conflict if they have meetings on the same day with overlapping times
- Example: Section A meets Mon 9:00-11:00, Section B meets Mon 10:00-12:00 → **conflict**
- Stores conflicts as pairs: `{(section1, section2), ...}`

### Phase 2: Constraint Programming Model

For each of the top N solutions (iterative process):

#### Step 4: Create CP-SAT Model
- Creates a boolean variable for each section: `section_vars[section_id] = True/False`
- These variables represent "is this section selected?"

#### Step 5: Add Hard Constraints (Must Be Satisfied)

**a. Course Requirements:**
```python
# For each course with both lectures and recitations:
# Must select exactly ONE lecture
sum(lecture_vars) == 1

# Must select exactly ONE recitation  
sum(recitation_vars) == 1
```

**b. Lecture-Recitation Linkage:**
```python
# A recitation can only be selected if its linked lecture is selected
# For recitation R: R <= sum(linked_lecture_vars)
# This ensures R can only be True if at least one linked lecture is True
```

**c. No Time Conflicts:**
```python
# For each conflicting pair (section1, section2):
# At most one can be selected
section1 + section2 <= 1
```

**d. Uniqueness (for finding multiple solutions):**
```python
# Forbid previously found combinations
# Ensures each new solution is different from previous ones
sum(previous_solution_vars) <= len(previous_solution) - 1
```

#### Step 6: Add Soft Constraints (Optimization Goals)

- **Instructor preferences**: Adds points to the objective if preferred instructors are selected
- **Note**: Preferred start time and day-off are scored after solving (they depend on the full schedule combination)

#### Step 7: Solve the Model
```python
solver.Solve(model)
# Returns OPTIMAL, FEASIBLE, or INFEASIBLE
```

### Phase 3: Solution Extraction and Scoring

#### Step 8: Extract Solution
- If a solution is found, extracts which sections were selected (`var == 1`)

#### Step 9: Calculate Fit Score
The scoring system evaluates how well a schedule matches user preferences:

**Scoring Components (Total: 100 points):**

1. **Preferred Start Time (50 points)**
   - Checks if the first lesson of each day starts within the preferred time range
   - Points distributed evenly across days with classes
   - Example: If you prefer 9:00-17:00 and have classes on 3 days, each day is worth ~16.67 points

2. **Instructor Preferences (30 points)**
   - Awards points for matching preferred instructors
   - Points distributed evenly across course preferences
   - Example: If you have 2 instructor preferences, each match is worth 15 points

3. **Day Off Bonus (20 points)**
   - Full bonus (20 points) if the requested day has no classes
   - Zero points if the requested day has any classes

**Score Calculation:**
- Raw score = sum of all component scores
- Normalized to 0-100 percentage: `(raw_score / max_possible_score) * 100`

#### Step 10: Store and Repeat
- Adds the solution to results
- Adds it to the forbidden list (to find different solutions next time)
- Repeats for up to `max_options` solutions

### Phase 4: Finalization

#### Step 11: Sort and Return
- Sorts all solutions by score (highest first)
- Returns top N solutions

## Constraint Types

### Hard Constraints (Must Satisfy)

These constraints **must** be satisfied for a schedule to be valid:

1. **Course Requirements**
   - Each course must have exactly one lecture (if lectures are available)
   - Each course must have exactly one recitation (if recitations are available)

2. **Lecture-Recitation Linkage**
   - Selected recitation must be linked to the selected lecture
   - A recitation can only be selected if at least one of its linked lectures is selected

3. **No Time Conflicts**
   - No two selected sections can have overlapping meeting times on the same day

### Soft Constraints (Optimize For)

These constraints are preferences that the algorithm tries to maximize:

1. **Preferred Start/End Times**
   - Prefers schedules where the first lesson of each day starts within the preferred time range
   - Scored after solving (depends on full schedule combination)

2. **Instructor Preferences**
   - Prefers sections taught by preferred instructors
   - Can be optimized during solving (added to objective function)

3. **Day-Off Requests**
   - Prefers schedules with no classes on the requested day
   - Scored after solving (depends on full schedule combination)

## Scoring System

The scoring system evaluates schedules on a 0-100 scale:

| Component | Max Points | Description |
|-----------|------------|-------------|
| Preferred Start Time | 50 | First lesson of each day within preferred range |
| Instructor Preferences | 30 | Matching preferred instructors |
| Day Off Bonus | 20 | Requested day has no classes |
| **Total** | **100** | Normalized percentage score |

### Example Scoring

**Scenario:**
- User prefers start time: 9:00-17:00
- User has 1 instructor preference
- User requests Friday off
- Schedule has classes on 3 days (Mon, Tue, Wed)

**Score Calculation:**
- Preferred start time: 3 days × (50/3) = 50 points (if all days match)
- Instructor preference: 1 match × 30 = 30 points
- Day off: Friday has no classes = 20 points
- **Total: 100 points (100%)**

If only 2 days match preferred time:
- Preferred start time: 2 days × (50/3) = 33.33 points
- Instructor preference: 30 points
- Day off: 20 points
- **Total: 83.33 points (83%)**

## Why CP-SAT?

The algorithm uses Google OR-Tools CP-SAT solver because:

1. **Handles Complex Constraints**: Can model intricate relationships between sections (linkage, conflicts, requirements)

2. **Finds Optimal Solutions**: Uses advanced search algorithms to find the best possible solutions

3. **Generates Multiple Solutions**: Can find multiple unique solutions by iteratively forbidding previous solutions

4. **Efficient**: Scales well to larger problems with many courses and sections

5. **Proven Technology**: Used in production systems for scheduling, routing, and optimization problems

## Visual Example

### Input
```
Courses: ["CS101", "MATH101"]
Preferences: 
  - start_time: "09:00"
  - preferred_instructor for CS101: "inst-1"
```

### Step 1: Filter Sections
```
CS101: 
  lectures: [L1, L2]
  recitations: [R1, R2, R3]

MATH101: 
  lectures: [L3]
  recitations: [R4, R5]
```

### Step 2: Build Conflicts
```
- L1 conflicts with L3 (same time)
- R1 conflicts with R4 (same time)
- ... (more conflicts)
```

### Step 3: CP-SAT Model
```
Variables: L1, L2, L3, R1, R2, R3, R4, R5 (each True/False)

Constraints:
- L1 + L2 == 1  (exactly one CS101 lecture)
- R1 + R2 + R3 == 1  (exactly one CS101 recitation)
- L3 == 1  (only one MATH101 lecture)
- R4 + R5 == 1  (exactly one MATH101 recitation)
- R1 can only be True if L1 is True (linkage)
- L1 + L3 <= 1  (no conflict)
- ... (more conflict constraints)

Objective: Maximize instructor preference matches
```

### Step 4: Solve
```
Solver finds: L1=True, R2=True, L3=True, R4=True
Score: 85% (good match to preferences)
```

### Step 5: Repeat for More Solutions
```
Solution 2: L2=True, R3=True, L3=True, R5=True
Score: 80%

Solution 3: L1=True, R1=True, L3=True, R4=True
Score: 75%
```

## Algorithm Complexity

- **Time Complexity**: O(N × M × C) where:
  - N = number of solutions to find
  - M = number of sections
  - C = number of constraints
  
- **Space Complexity**: O(M²) for conflict graph storage

In practice, the CP-SAT solver is highly optimized and can handle hundreds of sections efficiently.

## Limitations and Future Improvements

### Current Limitations
- Mock database (not connected to real university system)
- Fixed scoring weights (could be user-configurable)
- No consideration of travel time between classes
- No waitlist handling

### Potential Improvements
- Dynamic scoring weights based on user priorities
- Consider classroom locations and travel time
- Handle waitlists and enrollment probabilities
- Real-time course availability updates
- Multi-semester planning

## References

- [Google OR-Tools Documentation](https://developers.google.com/optimization)
- [CP-SAT Solver Guide](https://developers.google.com/optimization/cp/cp_solver)
- [Constraint Programming Overview](https://en.wikipedia.org/wiki/Constraint_programming)

---

For implementation details, see `backend/scheduler_logic.py`.


