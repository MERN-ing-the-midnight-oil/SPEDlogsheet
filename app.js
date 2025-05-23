document.addEventListener("DOMContentLoaded", () => {
	console.log("✅ DOM loaded — Initializing SPED Log Sheet app");

	const CATEGORIES = ["SPED", "MV", "Basic", "Pre-K"];
	const SUBROUTES = ["es", "ms", "hs", "other"];
	const TIMES = ["am", "pm"];
	const ROUTES = TIMES.flatMap((time) =>
		SUBROUTES.map((sub) => `${time}-${sub}`)
	);

	const defaultRouteData = ROUTES.reduce((acc, key) => {
		acc[key] = {
			students: [],
			presentStudents: [],
			SPED: 0,
			MV: 0,
			Basic: 0,
			"Pre-K": 0,
		};
		return acc;
	}, {});

	let routeData = loadData();
	let activeTab = "am-es";

	const routeContainer = document.getElementById("route-container");
	const editStudentsButton = document.getElementById("edit-students-button");
	const settingsButton = document.getElementById("settings-button");

	renderAllSubroutes();
	bindEvents();

	function renderAllSubroutes() {
		const container = document.getElementById("route-container");
		let html = `<div class="period-swipe-container"><div class="period-track">`;

		["am", "pm"].forEach((period) => {
			html += `<div class="period-slide">
					 <h2 class="period-heading">${period.toUpperCase()}</h2>`;

			SUBROUTES.forEach((sub) => {
				const key = `${period}-${sub}`;
				const route = routeData[key];

				html += `
			  <div class="route-card">
				<h3>${sub.toUpperCase()}</h3>
				<div class="matrix">
				  <div class="matrix-cell"><div class="matrix-label">SPED</div><div class="matrix-count">${
						route.SPED || ""
					}</div></div>
				  <div class="matrix-cell"><div class="matrix-label">MV</div><div class="matrix-count">${
						route.MV || ""
					}</div></div>
				  <div class="matrix-cell"><div class="matrix-label">Basic</div><div class="matrix-count">${
						route.Basic || ""
					}</div></div>
				  <div class="matrix-cell"><div class="matrix-label">Pre-K</div><div class="matrix-count">${
						route["Pre-K"] || ""
					}</div></div>
				</div>
				<div class="student-grid">
				  ${route.students
						.map((student) => {
							const isPresent = route.presentStudents.some(
								(ps) =>
									ps.name === student.name && ps.category === student.category
							);
							return `
					  <button class="student-toggle-button ${isPresent ? "present" : "absent"}"
							  onclick="toggleStudentPresence('${key}', '${student.name}', '${
								student.category
							}')">
						${student.name}
					  </button>`;
						})
						.join("")}
				</div>
				<button class="edit-button" data-route="${key}">Edit Roster</button>
				<button class="danger-button" onclick="clearRoute('${key}')">RESET</button>
			  </div>
			`;
			});

			html += `</div>`; // close .period-slide
		});

		html += `</div></div>`; // close .period-track and .period-swipe-container
		container.innerHTML = html;

		document.querySelectorAll(".edit-button").forEach((btn) => {
			btn.addEventListener("click", () => {
				activeTab = btn.dataset.route;
				openEditStudentsModal();
			});
		});
	}

	window.toggleStudentPresence = function (routeKey, name, category) {
		const route = routeData[routeKey];
		const idx = route.presentStudents.findIndex(
			(ps) => ps.name === name && ps.category === category
		);

		if (idx !== -1) {
			route.presentStudents.splice(idx, 1);
			route[category] = Math.max(0, route[category] - 1);
		} else {
			route.presentStudents.push({ name, category });
			route[category] = (route[category] || 0) + 1;
		}

		saveData();
		renderAllSubroutes();
	};

	window.clearRoute = function (routeKey) {
		const route = routeData[routeKey];
		route.presentStudents = [];
		CATEGORIES.forEach((cat) => (route[cat] = 0));
		saveData();
		renderAllSubroutes();
		console.log("🧼 Cleared:", routeKey);
	};

	function bindEvents() {
		if (editStudentsButton) {
			editStudentsButton.addEventListener("click", openEditStudentsModal);
		}
		if (settingsButton) {
			settingsButton.addEventListener("click", () => {
				const modal = document.getElementById("settings-modal");
				if (modal) modal.classList.remove("hidden");
			});
		}
	}

	function openEditStudentsModal() {
		const modal = document.getElementById("edit-students-modal");
		const editRouteName = document.getElementById("edit-route-name");
		const studentList = document.getElementById("student-list");
		const newStudentName = document.getElementById("new-student-name");
		const newStudentCategory = document.getElementById("new-student-category");
		const addButton = document.getElementById("add-student-button");

		if (!modal) return;

		editRouteName.textContent = activeTab.toUpperCase();
		renderStudentList();

		const xBtn = document.getElementById("close-edit-x");
		if (xBtn) {
			xBtn.addEventListener("click", () => {
				modal.classList.add("hidden");
				renderAllSubroutes();
			});
		}

		const doneBtn = document.getElementById("close-edit-done");
		if (doneBtn) {
			doneBtn.addEventListener("click", () => {
				modal.classList.add("hidden");
				renderAllSubroutes();
			});
		}

		document.getElementById("close-edit-done").addEventListener("click", () => {
			modal.classList.add("hidden");
			renderAllSubroutes();
		});

		addButton.onclick = function () {
			const name = newStudentName.value.trim();
			const category = newStudentCategory.value;
			if (!name) return alert("Enter a name");
			routeData[activeTab].students.push({ name, category });
			newStudentName.value = "";
			saveData();
			renderStudentList();
		};

		modal.classList.remove("hidden");
	}

	function renderStudentList() {
		const list = document.getElementById("student-list");
		const students = routeData[activeTab].students;
		list.innerHTML =
			students.length === 0
				? "<p>No students added yet.</p>"
				: students
						.map(
							(s, i) => `
		  <div class="student-item">
			<div>
			  <span>${s.name}</span>
			  <span class="student-category-label">${s.category}</span>
			</div>
			<div class="student-actions">
			  <button class="danger-button" onclick="removeStudent(${i})">Remove</button>
			</div>
		  </div>
		`
						)
						.join("");
	}

	window.removeStudent = function (index) {
		const route = routeData[activeTab];
		const student = route.students[index];
		const presentIdx = route.presentStudents.findIndex(
			(ps) => ps.name === student.name && ps.category === student.category
		);
		if (presentIdx !== -1) {
			route.presentStudents.splice(presentIdx, 1);
			route[student.category] = Math.max(0, route[student.category] - 1);
		}
		route.students.splice(index, 1);
		saveData();
		renderStudentList();
		renderAllSubroutes();
	};

	function loadData() {
		try {
			const saved = localStorage.getItem("spedLogData");
			return saved
				? { ...defaultRouteData, ...JSON.parse(saved) }
				: structuredClone(defaultRouteData);
		} catch (e) {
			console.error("Failed to load data:", e);
			return structuredClone(defaultRouteData);
		}
	}

	function saveData() {
		localStorage.setItem("spedLogData", JSON.stringify(routeData));
		console.log("💾 Data saved");
	}
	const installModal = document.getElementById("install-modal");
	const gotItBtn = document.getElementById("got-it-install");
	const dismissBtn = document.getElementById("dismiss-install");

	// Only show the modal if user hasn't seen it yet
	if (!localStorage.getItem("installModalDismissed")) {
		installModal.classList.remove("hidden");
	}

	// Dismiss handler
	function dismissInstallModal() {
		installModal.classList.add("hidden");
		localStorage.setItem("installModalDismissed", "true");
	}

	gotItBtn?.addEventListener("click", dismissInstallModal);
	dismissBtn?.addEventListener("click", dismissInstallModal);

	const shareBtn = document.getElementById("share-app-button");

	shareBtn?.addEventListener("click", async () => {
		const shareUrl = window.location.href;
		const shareData = {
			title: "Rhys' SPED Log Sheet",
			text: "Try this quick roster and attendance tracker!",
			url: shareUrl,
		};

		if (navigator.share) {
			try {
				await navigator.share(shareData);
				console.log("✅ Shared successfully");
			} catch (err) {
				console.warn("Sharing canceled", err);
			}
		} else {
			// Fallback: copy to clipboard
			try {
				await navigator.clipboard.writeText(shareUrl);
				alert("Link copied to clipboard!");
			} catch {
				alert("Unable to share or copy link.");
			}
		}
	});
});
