import React, { useState } from "react";
import Timeline from "./Timeline";
import "./App.css";

const timelinesData = [
	{
		id: 1,
		name: "Project Alpha",
		tasks: [
			{
				id: 1,
				title: "Design UI",
				assignedTo: "Alice",
				status: "pending",
				date: "2025-10-01",
			},
			{
				id: 2,
				title: "Setup Backend",
				assignedTo: "Bob",
				status: "completed",
				date: "2025-10-02",
			},
			{
				id: 3,
				title: "Write Docs",
				assignedTo: "Alice",
				status: "pending",
				date: "2025-10-03",
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
				date: "2025-10-01",
			},
			{
				id: 5,
				title: "API Integration",
				assignedTo: "Alice",
				status: "pending",
				date: "2025-10-04",
			},
			{
				id: 6,
				title: "Testing",
				assignedTo: "Alice",
				status: "completed",
				date: "2025-10-05",
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
				date: "2025-10-01",
			},
			{
				id: 8,
				title: "Feature X",
				assignedTo: "Alice",
				status: "pending",
				date: "2025-10-06",
			},
		],
	},
];

const person = "Alice";

const RANGE_OPTIONS = ["day", "week", "month", "year"];

function getCurrentRangeDates(range) {
	const now = new Date();
	let start, end;
	switch (range) {
		case "day":
			start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
			end = new Date(start);
			end.setDate(end.getDate() + 1);
			break;
		case "week":
			start = new Date(now);
			start.setDate(now.getDate() - now.getDay()); // Sunday
			end = new Date(start);
			end.setDate(end.getDate() + 7);
			break;
		case "month":
			start = new Date(now.getFullYear(), now.getMonth(), 1);
			end = new Date(now.getFullYear(), now.getMonth() + 1, 1);
			break;
		case "year":
			start = new Date(now.getFullYear(), 0, 1);
			end = new Date(now.getFullYear() + 1, 0, 1);
			break;
		default:
			start = new Date(0);
			end = new Date(8640000000000000);
	}
	return { start, end };
}

function App() {
	const [range, setRange] = useState("month");
	const { start, end } = getCurrentRangeDates(range);

	return (
		<div>
			<h1>Timelines - Pending Tasks for {person}</h1>
			<div style={{ marginBottom: "1rem" }}>
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
			</div>
			<div
				style={{
					display: "flex",
					justifyContent: "center",
					gap: "2rem",
					marginTop: "2rem",
				}}
			>
				{timelinesData.map((timeline) => (
					<Timeline
						key={timeline.id}
						name={timeline.name}
						tasks={timeline.tasks}
						person={person}
						range={{ start, end }}
					/>
				))}
			</div>
		</div>
	);
}

export default App;
