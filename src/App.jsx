import React, { useState, useEffect } from "react";
import Timeline from "./Timeline";
import "./App.css";

const STORAGE_KEY = "mytimelines_data";

const defaultTimelinesData = [
	{
		id: 1,
		name: "Project Alpha",
		tasks: [
			{
				id: 1,
				title: "Design UI",
				assignedTo: "Alice",
				status: "pending",
				startDate: "2025-10-01T09:00:00",
				endDate: "2025-10-01T11:30:00",
			},
			{
				id: 2,
				title: "Setup Backend",
				assignedTo: "Bob",
				status: "completed",
				startDate: "2025-10-01T13:00:00",
				endDate: "2025-10-01T15:00:00",
			},
			{
				id: 3,
				title: "Write Docs",
				assignedTo: "Alice",
				status: "pending",
				startDate: "2025-10-01T15:30:00",
				endDate: "2025-10-01T17:00:00",
			},
		],
	},
	{
		id: 2,
		name: "Project Beta",
		tasks: [
			{
				id: 4,
				title: "Initial Planning",
				assignedTo: "Charlie",
				status: "completed",
				startDate: "2025-10-01T08:00:00",
				endDate: "2025-10-01T09:00:00",
			},
			{
				id: 5,
				title: "API Integration",
				assignedTo: "Alice",
				status: "pending",
				startDate: "2025-10-01T10:00:00",
				endDate: "2025-10-01T12:00:00",
			},
			{
				id: 6,
				title: "Testing",
				assignedTo: "Alice",
				status: "completed",
				startDate: "2025-10-01T14:00:00",
				endDate: "2025-10-01T16:30:00",
			},
		],
	},
	{
		id: 3,
		name: "Project Gamma",
		tasks: [
			{
				id: 7,
				title: "Kickoff Meeting",
				assignedTo: "Bob",
				status: "completed",
				startDate: "2025-10-01T09:00:00",
				endDate: "2025-10-01T09:45:00",
			},
			{
				id: 8,
				title: "Feature X",
				assignedTo: "Alice",
				status: "pending",
				startDate: "2025-10-01T11:00:00",
				endDate: "2025-10-01T13:30:00",
			},
		],
	},
];

const person = "Alice";

const RANGE_OPTIONS = ["day", "week", "month", "year"];

function getCurrentRangeDates(range, startDate) {
	const base = new Date(startDate);
	let start, end;
	switch (range) {
		case "day":
			start = new Date(base.getFullYear(), base.getMonth(), base.getDate());
			end = new Date(start);
			end.setDate(end.getDate() + 1);
			break;
		case "week":
			start = new Date(base);
			start.setDate(base.getDate() - base.getDay()); // Sunday
			end = new Date(start);
			end.setDate(end.getDate() + 7);
			break;
		case "month":
			start = new Date(base.getFullYear(), base.getMonth(), 1);
			end = new Date(base.getFullYear(), base.getMonth() + 1, 1);
			break;
		case "year":
			start = new Date(base.getFullYear(), 0, 1);
			end = new Date(base.getFullYear() + 1, 0, 1);
			break;
		default:
			start = new Date(0);
			end = new Date(8640000000000000);
	}
	return { start, end };
}

function App() {
	const [range, setRange] = useState("day");
	const [startDate, setStartDate] = useState("2025-10-01");
	const timelinesContainerRef = React.useRef(null);

	// Initialize timelines from localStorage or use defaults
	const [timelines, setTimelines] = useState(() => {
		try {
			const stored = localStorage.getItem(STORAGE_KEY);
			if (stored) {
				return JSON.parse(stored);
			}
		} catch (error) {
			console.error("Error loading from localStorage:", error);
		}
		return defaultTimelinesData;
	});

	const { start, end } = getCurrentRangeDates(range, startDate);

	// Save to localStorage whenever timelines change
	useEffect(() => {
		try {
			localStorage.setItem(STORAGE_KEY, JSON.stringify(timelines));
		} catch (error) {
			console.error("Error saving to localStorage:", error);
		}
	}, [timelines]);

	const onTaskDurationChange = (timelineId, taskId, newEndDate) => {
		setTimelines((prevTimelines) =>
			prevTimelines.map((timeline) =>
				timeline.id === timelineId
					? {
						...timeline,
						tasks: timeline.tasks.map((task) =>
							task.id === taskId ? { ...task, endDate: newEndDate } : task
						),
					}
					: timeline
			)
		);
	};

	const onTaskStartTimeChange = (timelineId, taskId, newStartDate, newEndDate) => {
		setTimelines((prevTimelines) =>
			prevTimelines.map((timeline) =>
				timeline.id === timelineId
					? {
						...timeline,
						tasks: timeline.tasks.map((task) =>
							task.id === taskId ? { ...task, startDate: newStartDate, endDate: newEndDate } : task
						),
					}
					: timeline
			)
		);
	};

	const onTaskCreate = (timelineId, newTask) => {
		setTimelines((prevTimelines) =>
			prevTimelines.map((timeline) =>
				timeline.id === timelineId
					? {
						...timeline,
						tasks: [
							...timeline.tasks,
							{
								...newTask,
								id: Date.now(), // Simple ID generation
							},
						],
					}
					: timeline
			)
		);
	};

	const onTaskDelete = (timelineId, taskId) => {
		if (confirm("Are you sure you want to delete this task?")) {
			setTimelines((prevTimelines) =>
				prevTimelines.map((timeline) =>
					timeline.id === timelineId
						? {
							...timeline,
							tasks: timeline.tasks.filter((task) => task.id !== taskId),
						}
						: timeline
				)
			);
		}
	};

	const onAddTimeline = () => {
		const name = prompt("Enter timeline name:");
		if (name && name.trim()) {
			const newTimeline = {
				id: Date.now(),
				name: name.trim(),
				tasks: []
			};
			setTimelines((prevTimelines) => [...prevTimelines, newTimeline]);

			// Scroll to the right to show the new timeline
			setTimeout(() => {
				if (timelinesContainerRef.current) {
					timelinesContainerRef.current.scrollTo({
						left: timelinesContainerRef.current.scrollWidth,
						behavior: 'smooth'
					});
				}
			}, 100);
		}
	};

	const onDeleteTimeline = (timelineId) => {
		if (confirm("Are you sure you want to delete this timeline? All tasks will be lost.")) {
			setTimelines((prevTimelines) => prevTimelines.filter((timeline) => timeline.id !== timelineId));
		}
	};

	const onRenameTimeline = (timelineId) => {
		const timeline = timelines.find((t) => t.id === timelineId);
		if (!timeline) return;

		const newName = prompt("Enter new timeline name:", timeline.name);
		if (newName && newName.trim()) {
			setTimelines((prevTimelines) =>
				prevTimelines.map((t) =>
					t.id === timelineId ? { ...t, name: newName.trim() } : t
				)
			);
		}
	};

	const resetToDefaults = () => {
		if (confirm("Are you sure you want to reset all data to defaults? This cannot be undone.")) {
			setTimelines(defaultTimelinesData);
		}
	};

	return (
		<div>
			<h1>Calendar Timeline - Pending Tasks for {person}</h1>
			<p style={{ textAlign: 'center', color: '#666', fontSize: '0.9em' }}>
				Click and drag on the calendar grid to create meetings/tasks. Drag tasks to move them.
			</p>
			<div style={{ marginBottom: "1rem" }}>
				<label style={{ marginRight: 12 }}>
					Start date:
					<input
						type="date"
						value={startDate}
						onChange={(e) => setStartDate(e.target.value)}
						style={{ marginLeft: 8 }}
					/>
				</label>
				{RANGE_OPTIONS.map((opt) => (
					<button
						key={opt}
						onClick={() => setRange(opt)}
						style={{
							marginRight: 8,
							fontWeight: range === opt ? "bold" : "normal",
							background: range === opt ? "#e0e0e0" : undefined,
						}}
					>
						{opt.charAt(0).toUpperCase() + opt.slice(1)}
					</button>
				))}
				<button
					onClick={onAddTimeline}
					style={{
						marginLeft: 16,
						padding: "4px 12px",
						background: "#4CAF50",
						color: "white",
						border: "none",
						borderRadius: "4px",
						cursor: "pointer",
					}}
				>
					+ Add Timeline
				</button>
				<button
					onClick={resetToDefaults}
					style={{
						marginLeft: 8,
						padding: "4px 12px",
						background: "#ff6b6b",
						color: "white",
						border: "none",
						borderRadius: "4px",
						cursor: "pointer",
					}}
				>
					Reset to Defaults
				</button>
			</div>
			<div
				ref={timelinesContainerRef}
				style={{
					display: "flex",
					justifyContent: "flex-start",
					gap: "2rem",
					marginTop: "2rem",
					overflowX: "auto",
					overflowY: "hidden",
					paddingBottom: "1rem",
				}}
			>
				{timelines.map((timeline) => (
					<Timeline
						key={timeline.id}
						timelineId={timeline.id}
						name={timeline.name}
						tasks={timeline.tasks}
						person={person}
						range={{ start, end }}
						onTaskDurationChange={(taskId, newEndDate) => onTaskDurationChange(timeline.id, taskId, newEndDate)}
						onTaskStartTimeChange={(taskId, newStartDate, newEndDate) => onTaskStartTimeChange(timeline.id, taskId, newStartDate, newEndDate)}
						onTaskCreate={onTaskCreate}
						onTaskDelete={onTaskDelete}
						onDeleteTimeline={() => onDeleteTimeline(timeline.id)}
						onRenameTimeline={() => onRenameTimeline(timeline.id)}
					/>
				))}
			</div>
		</div>
	);
}

export default App;

