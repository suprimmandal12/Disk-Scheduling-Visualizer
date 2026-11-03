# Disk Scheduling Simulator — Web Frontend (FCFS + SSTF)

## Project structure

- `index.html` — page structure and input/output sections
- `style.css` — responsive dashboard styling
- `script.js` — FCFS and SSTF algorithms, validation, calculations, and rendering

## Run the project

This is a static web project. No installation, server, database, or backend is required.

1. Extract `Disk_Scheduling_Web_Project.zip`.
2. Open the `Disk_Scheduling_Web_Project` folder.
3. Double-click `index.html` to open it in Chrome, Safari, or Firefox.
4. Edit disk size, initial head position, and request queue.
5. Click **Run simulation**.
6. Use the FCFS/SSTF tabs to inspect each service order.

You can also open the folder in VS Code and use the Live Server extension, but it is optional.

## Technology used

- HTML — page structure
- CSS — layout and visual design
- JavaScript — disk scheduling calculations and interactions

The algorithms run in the browser. This version does not call the earlier C++ program. A browser cannot directly execute a normal C++ console program; connecting a C++ backend would require an additional local server/API layer.

## Algorithms

### FCFS — First Come First Serve
Requests are processed in the order entered by the user.

### SSTF — Shortest Seek Time First
At each step, the request with the smallest absolute distance from the current head position is selected. If two requests are equally near, the one appearing first in the original input list is selected.

## Formulas

Individual movement = `|current head position - next requested track|`

Total head movement = sum of all individual movements.

Average movement per request = `total head movement / number of requests`.

## Sample input

- Disk size: `200`
- Initial head position: `53`
- Requests: `98, 183, 37, 122, 14, 124, 65, 67`

Expected output:

| Algorithm | Service sequence (after initial head) | Total movement | Average |
|---|---|---:|---:|
| FCFS | 98 → 183 → 37 → 122 → 14 → 124 → 65 → 67 | 640 | 80.00 |
| SSTF | 65 → 67 → 37 → 14 → 98 → 122 → 124 → 183 | 236 | 29.50 |

## Important academic note

The program calculates seek distance in tracks. It is a simulation, not a benchmark of physical disk hardware. It does not model rotational latency, transfer time, or real-world I/O timing. SSTF can reduce movement for some workloads but may starve requests that remain far from the head; FCFS preserves arrival order.


## Added graphs
- Disk head movement line graph: plots the initial head position and each serviced track for FCFS and SSTF.
- Total head movement bar graph: compares the track movement totals for both algorithms.
- Both graphs refresh whenever Run Simulation is clicked and respond to the current inputs.
