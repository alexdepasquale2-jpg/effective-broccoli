import { createApp } from "./app.js";
import { TaskStore } from "./store.js";

const PORT = Number(process.env.PORT ?? 3001);

const store = new TaskStore();
store.seed([
  "Welcome to your task board",
  "Drag a task through the columns",
  "Add your own task below",
]);

const app = createApp(store);

app.listen(PORT, () => {
  console.log(`API listening on http://localhost:${PORT}`);
});
