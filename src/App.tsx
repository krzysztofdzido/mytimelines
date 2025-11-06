import { useState, useEffect, useMemo, useRef } from "react";
import Timeline from "./Timeline";
import Sidebar from "./Sidebar";
import { Timeline as TimelineType, Task, RangeOption, DateRange } from "./types";
import "./App.css";

const STORAGE_KEY = "mytimelines_data";

const defaultTimelinesData: TimelineType[] = [
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

const RANGE_OPTIONS: RangeOption[] = ["day", "week", "month", "year"];

function getCurrentRangeDates(range: RangeOption, startDate: string): DateRange {
	const base = new Date(startDate);
	let start: Date, end: Date;
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
	// Initialize from URL parameters if available
	const [range, setRange] = useState<RangeOption>(() => {
		const params = new URLSearchParams(window.location.search);
		const urlRange = params.get('range') as RangeOption | null;
		return RANGE_OPTIONS.includes(urlRange as RangeOption) ? (urlRange as RangeOption) : "day";
	});

	const [startDate, setStartDate] = useState(() => {
		const params = new URLSearchParams(window.location.search);
		const urlDate = params.get('date');
		// Validate date format
		if (urlDate && /^\d{4}-\d{2}-\d{2}$/.test(urlDate)) {
			return urlDate;
		}
		return "2025-10-01";
	});

	const timelinesContainerRef = useRef<HTMLDivElement>(null);

	// Initialize timelines from localStorage or use defaults
	const [timelines, setTimelines] = useState<TimelineType[]>(() => {
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

	// Track which timelines are visible (all visible by default)
	const [visibleTimelineIds, setVisibleTimelineIds] = useState<Set<number>>(() => {
		return new Set(timelines.map(t => t.id));
	});

	// Track sidebar width
	const [sidebarWidth, setSidebarWidth] = useState(250);
	const [isResizing, setIsResizing] = useState(false);

	// Update visible timelines when timelines are added
	useEffect(() => {
		setVisibleTimelineIds(prev => {
			const newSet = new Set(prev);
			timelines.forEach(t => {
				if (!newSet.has(t.id)) {
					newSet.add(t.id);
				}
			});
			return newSet;
		});
	}, [timelines]);

	const { start, end } = useMemo(() => getCurrentRangeDates(range, startDate), [range, startDate]);

	// Update URL when date or range changes
	useEffect(() => {
		const params = new URLSearchParams();
		params.set('date', startDate);
		params.set('range', range);
		const newUrl = `${window.location.pathname}?${params.toString()}`;
		window.history.pushState({}, '', newUrl);
	}, [startDate, range]);

	// Save to localStorage whenever timelines change
	useEffect(() => {
		try {
			localStorage.setItem(STORAGE_KEY, JSON.stringify(timelines));
		} catch (error) {
			console.error("Error saving to localStorage:", error);
		}
	}, [timelines]);

	// Handle sidebar resize
	useEffect(() => {
		const handleMouseMove = (e: MouseEvent) => {
			if (isResizing) {
				const newWidth = Math.max(150, Math.min(600, e.clientX));
				setSidebarWidth(newWidth);
			}
		};

		const handleMouseUp = () => {
			setIsResizing(false);
		};

		if (isResizing) {
			document.addEventListener('mousemove', handleMouseMove);
			document.addEventListener('mouseup', handleMouseUp);
			document.body.style.cursor = 'ew-resize';
			document.body.style.userSelect = 'none';
		}

		return () => {
			document.removeEventListener('mousemove', handleMouseMove);
			document.removeEventListener('mouseup', handleMouseUp);
			document.body.style.cursor = '';
			document.body.style.userSelect = '';
		};
	}, [isResizing]);

	const onTaskDurationChange = (timelineId: number, taskId: number, newEndDate: string) => {
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

	const onTaskStartTimeChange = (timelineId: number, taskId: number, newStartDate: string, newEndDate: string) => {
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

	const onTaskCreate = (timelineId: number, newTask: Omit<Task, 'id'>) => {
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

	const onTaskDelete = (timelineId: number, taskId: number) => {
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
			const newTimeline: TimelineType = {
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

	const onDeleteTimeline = (timelineId: number) => {
		if (confirm("Are you sure you want to delete this timeline? All tasks will be lost.")) {
			setTimelines((prevTimelines) => prevTimelines.filter((timeline) => timeline.id !== timelineId));
		}
	};

	const onRenameTimeline = (timelineId: number) => {
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
			setStartDate("2025-10-01");
		}
	};

	const goToPreviousDay = () => {
		const date = new Date(startDate);
		date.setDate(date.getDate() - 1);
		setStartDate(date.toISOString().split('T')[0]);
	};

	const goToNextDay = () => {
		const date = new Date(startDate);
		date.setDate(date.getDate() + 1);
		setStartDate(date.toISOString().split('T')[0]);
	};

	const goToToday = () => {
		const today = new Date();
		setStartDate(today.toISOString().split('T')[0]);
	};

	return (
		<div style={{ display: "flex", minHeight: "100vh" }}>
			{/* Fixed Sidebar */}
			<Sidebar
				timelines={timelines}
				visibleTimelineIds={visibleTimelineIds}
				setVisibleTimelineIds={setVisibleTimelineIds}
				sidebarWidth={sidebarWidth}
				isResizing={isResizing}
				setIsResizing={setIsResizing}
				startDate={startDate}
				setStartDate={setStartDate}
				goToToday={goToToday}
				goToPreviousDay={goToPreviousDay}
				goToNextDay={goToNextDay}
				onAddTimeline={onAddTimeline}
				resetToDefaults={resetToDefaults}
			/>

			{/* Main Content Area */}
			<div style={{ marginLeft: `${sidebarWidth}px`, width: "100%", padding: "0 2rem" }}>
				<h1>Calendar Timeline - Pending Tasks for {person}</h1>
				<p style={{ textAlign: 'center', color: '#666', fontSize: '0.9em' }}>
					Click and drag on the calendar grid to create meetings/tasks. Drag tasks to move them.
				</p>
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
						visibleTimelineIds.has(timeline.id) && (
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
						)
					))}
				</div>
			</div>
		</div>
	);
}

export default App;
