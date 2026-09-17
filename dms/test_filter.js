const realLogs = [ { action: "Login", module: "Auth" } ];
const selectedActions = new Set();
const selectedModule = "All";
const dateFrom = "";
const dateTo = "";
const searchTerm = "";

const data = [...realLogs].filter(log => {
    if (searchTerm) {
        return false;
    }
    const logDate = "2026-09-16";
    if (dateFrom && logDate < dateFrom) return false;
    if (dateTo && logDate > dateTo) return false;
    if (selectedModule !== "All" && log.module !== selectedModule) return false;
    if (selectedActions.size > 0 && !selectedActions.has(log.action)) return false;
    return true;
});

console.log("Filtered length:", data.length);
