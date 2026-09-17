const http = require("http");

const req = http.request("http://localhost:3000/api/audit-logs", { method: "GET" }, (res) => {
    let data = "";
    res.on("data", chunk => data += chunk);
    res.on("end", () => {
        try {
            console.log(data.substring(0, 500));
        } catch (e) {
            console.log("Error:", e);
        }
    });
});
req.on("error", console.error);
req.end();
