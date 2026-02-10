const http = require("http");
const fs = require("fs");
const url = require("url");

const FILE = "tasks.json";
const PORT = 3000;


function readTasks() {
  if (!fs.existsSync(FILE)) {
    fs.writeFileSync(FILE, JSON.stringify([]));
  }
  return JSON.parse(fs.readFileSync(FILE, "utf-8"));
}

function writeTasks(tasks) {
  fs.writeFileSync(FILE, JSON.stringify(tasks, null, 2));
}

function send(res, status, data) {
  res.writeHead(status, { "Content-Type": "application/json" });
  res.end(JSON.stringify(data));
}


const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const method = req.method;
  const path = parsedUrl.pathname;

  let tasks = readTasks();

  if (method === "POST" && path === "/tasks") {
    let body = "";
    req.on("data", chunk => body += chunk);
    req.on("end", () => {
      const { title } = JSON.parse(body);

      if (!title) {
        return send(res, 400, { error: "Title is required" });
      }

      const newTask = {
        id: Date.now(),
        title,
        status: "todo"
      };

      tasks.push(newTask);
      writeTasks(tasks);
      send(res, 201, newTask);
    });
  }

  else if (method === "PUT" && path.startsWith("/tasks/")) {
    const id = Number(path.split("/")[2]);
    let body = "";

    req.on("data", chunk => body += chunk);
    req.on("end", () => {
      const data = JSON.parse(body);
      const task = tasks.find(t => t.id === id);

      if (!task) {
        return send(res, 404, { error: "Task not found" });
      }

      task.title = data.title ?? task.title;
      task.status = data.status ?? task.status;

      writeTasks(tasks);
      send(res, 200, task);
    });
  }

  else if (method === "DELETE" && path.startsWith("/tasks/")) {
    const id = Number(path.split("/")[2]);
    const filtered = tasks.filter(t => t.id !== id);

    if (tasks.length === filtered.length) {
      return send(res, 404, { error: "Task not found" });
    }

    writeTasks(filtered);
    send(res, 200, { message: "Task deleted" });
  }

  else if (method === "GET" && path === "/tasks") {
    send(res, 200, tasks);
  }

  else if (method === "GET" && path === "/tasks/done") {
    send(res, 200, tasks.filter(t => t.status === "done"));
  }

  else if (method === "GET" && path === "/tasks/not-done") {
    send(res, 200, tasks.filter(t => t.status !== "done"));
  }

  else if (method === "GET" && path === "/tasks/in-progress") {
    send(res, 200, tasks.filter(t => t.status === "in-progress"));
  }

  else {
    send(res, 404, { error: "Route not found" });
  }
});


server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
