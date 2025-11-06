import React from "react";

const Sidebar = ({
	timelines,
	visibleTimelineIds,
	setVisibleTimelineIds,
	sidebarWidth,
	setIsResizing,
	startDate,
	setStartDate,
	goToToday,
	goToPreviousDay,
	goToNextDay,
	onAddTimeline,
	resetToDefaults,
}) => {
	return (
		<div
			style={{
				position: "fixed",
				left: 0,
				top: 0,
				width: `${sidebarWidth}px`,
				height: "100vh",
				padding: "1rem",
				background: "#f9f9f9",
				borderRight: "1px solid #ddd",
				boxShadow: "2px 0 4px rgba(0, 0, 0, 0.1)",
				overflowY: "auto",
				zIndex: 100,
			}}
		>
			<h2 style={{ fontSize: "1.2em", margin: "0 0 1rem 0" }}>Timelines</h2>

			{/* Date Navigation Controls */}
			<div style={{ marginBottom: "1.5rem", paddingBottom: "1rem", borderBottom: "1px solid #ddd" }}>
				<div style={{ display: "flex", gap: "4px", marginBottom: 8 }}>
					<button
						onClick={goToToday}
						style={{
							flex: 1,
							padding: "8px 12px",
							cursor: "pointer",
							background: "#2196F3",
							color: "white",
							border: "none",
							borderRadius: "4px",
							fontWeight: "500",
						}}
					>
						Today
					</button>
					<button
						onClick={resetToDefaults}
						style={{
							flex: 1,
							padding: "8px 12px",
							background: "#ff6b6b",
							color: "white",
							border: "none",
							borderRadius: "4px",
							cursor: "pointer",
							fontWeight: "500",
						}}
					>
						Reset
					</button>
				</div>
				<div style={{ display: "flex", gap: "4px", marginBottom: 8 }}>
					<button
						onClick={goToPreviousDay}
						style={{
							flex: 1,
							padding: "6px 8px",
							cursor: "pointer",
							background: "white",
							border: "1px solid #ccc",
							borderRadius: "4px",
						}}
					>
						← Prev
					</button>
					<button
						onClick={goToNextDay}
						style={{
							flex: 1,
							padding: "6px 8px",
							cursor: "pointer",
							background: "white",
							border: "1px solid #ccc",
							borderRadius: "4px",
						}}
					>
						Next →
					</button>
				</div>
				<input
					type="date"
					value={startDate}
					onChange={(e) => setStartDate(e.target.value)}
					style={{
						width: "100%",
						padding: "6px 8px",
						border: "1px solid #ccc",
						borderRadius: "4px",
						fontSize: "14px",
					}}
				/>
			</div>

			{/* Timeline List */}
			{timelines.map((timeline) => (
				<div key={timeline.id} style={{ marginBottom: "0.5rem" }}>
					<label style={{ cursor: "pointer", display: "flex", alignItems: "center" }}>
						<input
							type="checkbox"
							checked={visibleTimelineIds.has(timeline.id)}
							onChange={(e) => {
								setVisibleTimelineIds((prev) => {
									const newSet = new Set(prev);
									if (e.target.checked) {
										newSet.add(timeline.id);
									} else {
										newSet.delete(timeline.id);
									}
									return newSet;
								});
							}}
							style={{ cursor: "pointer" }}
						/>
						<span style={{ marginLeft: 8 }}>{timeline.name}</span>
					</label>
				</div>
			))}

			{/* Add Timeline Button */}
			<button
				onClick={onAddTimeline}
				style={{
					width: "100%",
					marginTop: "1rem",
					padding: "8px 12px",
					background: "#4CAF50",
					color: "white",
					border: "none",
					borderRadius: "4px",
					cursor: "pointer",
					fontWeight: "500",
				}}
			>
				+ Add Timeline
			</button>

			{/* Resize Handle */}
			<div
				style={{
					position: "absolute",
					top: 0,
					right: 0,
					bottom: 0,
					width: "10px",
					cursor: "ew-resize",
					zIndex: 101,
				}}
				onMouseDown={(e) => {
					e.preventDefault();
					setIsResizing(true);
				}}
			/>
		</div>
	);
};

export default Sidebar;
