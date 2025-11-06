import { useState, useEffect, useMemo, useRef } from "react";
import Timeline from "./Timeline";
import Sidebar from "./Sidebar";
import { Timeline as TimelineType, Task, RangeOption, DateRange, TimelineGroup } from "./types";
import "./App.css";

const STORAGE_KEY = "mytimelines_data";
const GROUPS_STORAGE_KEY = "mytimelines_groups";

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

	// Initialize groups from localStorage
	const [groups, setGroups] = useState<TimelineGroup[]>(() => {
		try {
			const stored = localStorage.getItem(GROUPS_STORAGE_KEY);
			if (stored) {
				return JSON.parse(stored);
			}
		} catch (error) {
			console.error("Error loading groups from localStorage:", error);
		}
		return [];
	});

	// Track which timelines are visible (all visible by default)
	const [visibleTimelineIds, setVisibleTimelineIds] = useState<Set<number>>(() => {
		return new Set(timelines.map(t => t.id));
	});

	// Track which groups are visible (all visible by default)
	const [visibleGroupIds, setVisibleGroupIds] = useState<Set<number>>(() => {
		return new Set(groups.map(g => g.id));
	});

	// Track sidebar width
	const [sidebarWidth, setSidebarWidth] = useState(250);
	const [isResizing, setIsResizing] = useState(false);

	// Update visible timelines when timelines are added (not when reordered)
	useEffect(() => {
		setVisibleTimelineIds(prev => {
			const newSet = new Set(prev);
			let hasChanges = false;
			timelines.forEach(t => {
				if (!newSet.has(t.id)) {
					newSet.add(t.id);
					hasChanges = true;
				}
			});
			// Only return new Set if there were actual changes
			return hasChanges ? newSet : prev;
		});
	}, [timelines.length, timelines.map(t => t.id).sort((a, b) => a - b).join(',')]);

	// Update visible groups when groups are added
	useEffect(() => {
		setVisibleGroupIds(prev => {
			const newSet = new Set(prev);
			let hasChanges = false;
			groups.forEach(g => {
				if (!newSet.has(g.id)) {
					newSet.add(g.id);
					hasChanges = true;
				}
			});
			return hasChanges ? newSet : prev;
		});
	}, [groups.length, groups.map(g => g.id).sort((a, b) => a - b).join(',')]);

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

	// Save groups to localStorage whenever groups change
	useEffect(() => {
		try {
			localStorage.setItem(GROUPS_STORAGE_KEY, JSON.stringify(groups));
		} catch (error) {
			console.error("Error saving groups to localStorage:", error);
		}
	}, [groups]);

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

	const onAddGroup = () => {
		const name = prompt("Enter group name:");
		if (name && name.trim()) {
			const newGroup: TimelineGroup = {
				id: Date.now(),
				name: name.trim(),
				isExpanded: true
			};
			setGroups((prevGroups) => [...prevGroups, newGroup]);
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

	const onReorderTimelines = (newOrder: TimelineType[]) => {
		setTimelines(newOrder);
	};

	const onReorderGroups = (newOrder: TimelineGroup[]) => {
		setGroups(newOrder);
	};

	const onAssignToGroup = (timelineId: number, groupId: number | null) => {
		setTimelines((prevTimelines) =>
			prevTimelines.map((t) =>
				t.id === timelineId ? { ...t, groupId: groupId || undefined } : t
			)
		);
	};

	const onDeleteGroup = (groupId: number) => {
		const group = groups.find((g) => g.id === groupId);
		if (!group) return;

		const timelinesInGroup = timelines.filter((t) => t.groupId === groupId);
		const message = timelinesInGroup.length > 0
			? `Are you sure you want to delete "${group.name}"? The ${timelinesInGroup.length} timeline(s) will become ungrouped.`
			: `Are you sure you want to delete "${group.name}"?`;

		if (confirm(message)) {
			// Remove group
			setGroups((prevGroups) => prevGroups.filter((g) => g.id !== groupId));
			// Unassign timelines from this group
			setTimelines((prevTimelines) =>
				prevTimelines.map((t) =>
					t.groupId === groupId ? { ...t, groupId: undefined } : t
				)
			);
		}
	};

	const onRenameGroup = (groupId: number) => {
		const group = groups.find((g) => g.id === groupId);
		if (!group) return;

		const newName = prompt("Enter new group name:", group.name);
		if (newName && newName.trim()) {
			setGroups((prevGroups) =>
				prevGroups.map((g) =>
					g.id === groupId ? { ...g, name: newName.trim() } : g
				)
			);
		}
	};

	const onToggleGroupExpanded = (groupId: number) => {
		setGroups((prevGroups) =>
			prevGroups.map((g) =>
				g.id === groupId ? { ...g, isExpanded: !g.isExpanded } : g
			)
		);
	};

	const resetToDefaults = () => {
		if (confirm("Are you sure you want to reset all data to defaults? This cannot be undone.")) {
			setTimelines(defaultTimelinesData);
			setGroups([]);
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

	// Color palette for groups
	const groupColors = [
		{ bg: "#f3e5f5", border: "#ce93d8", headerColor: "#8e24aa" }, // Purple
		{ bg: "#e3f2fd", border: "#90caf9", headerColor: "#1976d2" }, // Blue
		{ bg: "#e8f5e9", border: "#a5d6a7", headerColor: "#388e3c" }, // Green
		{ bg: "#fff3e0", border: "#ffcc80", headerColor: "#f57c00" }, // Orange
		{ bg: "#fce4ec", border: "#f48fb1", headerColor: "#c2185b" }, // Pink
		{ bg: "#e0f2f1", border: "#80cbc4", headerColor: "#00796b" }, // Teal
		{ bg: "#f1f8e9", border: "#c5e1a5", headerColor: "#689f38" }, // Light Green
		{ bg: "#fff8e1", border: "#ffd54f", headerColor: "#fbc02d" }, // Yellow
	];

	return (
		<div style={{ display: "flex", minHeight: "100vh" }}>
			{/* Fixed Sidebar */}
			<Sidebar
				timelines={timelines}
				groups={groups}
				visibleTimelineIds={visibleTimelineIds}
				visibleGroupIds={visibleGroupIds}
				setVisibleTimelineIds={setVisibleTimelineIds}
				setVisibleGroupIds={setVisibleGroupIds}
				sidebarWidth={sidebarWidth}
				isResizing={isResizing}
				setIsResizing={setIsResizing}
				startDate={startDate}
				setStartDate={setStartDate}
				goToToday={goToToday}
				goToPreviousDay={goToPreviousDay}
				goToNextDay={goToNextDay}
				onAddTimeline={onAddTimeline}
				onAddGroup={onAddGroup}
				resetToDefaults={resetToDefaults}
				onReorderTimelines={onReorderTimelines}
				onReorderGroups={onReorderGroups}
				onAssignToGroup={onAssignToGroup}
				onDeleteGroup={onDeleteGroup}
				onRenameGroup={onRenameGroup}
				onToggleGroupExpanded={onToggleGroupExpanded}
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
						flexDirection: "row",
						gap: "2rem",
						marginTop: "2rem",
						overflowX: "auto",
						overflowY: "hidden",
						paddingBottom: "1rem",
					}}
				>
					{/* Render grouped timelines */}
					{groups.map((group, index) => {
						const groupTimelines = timelines.filter(t => t.groupId === group.id && visibleTimelineIds.has(t.id));
						if (groupTimelines.length === 0) return null;

						const groupColor = groupColors[index % groupColors.length]; // Cycle through colors

						return (
							<div
								key={`group-${group.id}`}
								style={{
									minWidth: "fit-content",
									padding: "1.5rem",
									border: `1px solid ${groupColor.border}`,
									borderRadius: "8px",
									background: groupColor.bg,
									boxShadow: "0 1px 3px rgba(0, 0, 0, 0.05)",
									display: "flex",
									flexDirection: "column",
								}}
							>
								<h3 style={{
									margin: "0 0 1rem 0",
									color: groupColor.headerColor,
									fontSize: "1.1em",
									fontWeight: "600",
									display: "flex",
									alignItems: "center",
									gap: "0.5rem",
									whiteSpace: "nowrap",
								}}>
									📁 {group.name}
								</h3>
								<div
									style={{
										display: "flex",
										justifyContent: "flex-start",
										gap: "2rem",
										flex: 1,
									}}
								>
									{groupTimelines.map((timeline) => (
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
					})}

					{/* Render ungrouped timelines */}
					{(() => {
						const ungroupedTimelines = timelines.filter(t => !t.groupId && visibleTimelineIds.has(t.id));
						if (ungroupedTimelines.length === 0) return null;

						return (
							<div
								style={{
									minWidth: groups.length > 0 ? "fit-content" : "auto",
									padding: groups.length > 0 ? "1.5rem" : "0",
									border: groups.length > 0 ? "1px solid #e0e0e0" : "none",
									borderRadius: groups.length > 0 ? "8px" : "0",
									background: groups.length > 0 ? "#fafafa" : "transparent",
									boxShadow: groups.length > 0 ? "0 1px 3px rgba(0, 0, 0, 0.05)" : "none",
									display: "flex",
									flexDirection: "column",
								}}
							>
								{groups.length > 0 && (
									<h3 style={{
										margin: "0 0 1rem 0",
										color: "#757575",
										fontSize: "1.1em",
										fontWeight: "600",
										whiteSpace: "nowrap",
									}}>
										Ungrouped
									</h3>
								)}
								<div
									style={{
										display: "flex",
										justifyContent: "flex-start",
										gap: "2rem",
										flex: 1,
									}}
								>
									{ungroupedTimelines.map((timeline) => (
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
					})()}
				</div>
			</div>
		</div>
	);
}

export default App;
