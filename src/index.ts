import 'module-alias/register';
import { app } from "#app.js";
import { startScheduler } from "./tasks/scheduler.js";
import { env } from "./config/env.js";
import { db } from "./db/knex.js";

const port = env.port || 3000;

app.listen(port, () => {
    console.log(`Server started on ${port}`);
    startScheduler();
});

// graceful shutdown
process.on("SIGINT", async () => {
    console.log("SIGINT received, shutting down...");
    await db.destroy();
    process.exit(0);
});
