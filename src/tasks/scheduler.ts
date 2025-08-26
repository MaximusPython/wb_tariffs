import cron from "cron";
import { WbService } from "../services/wbService.js";
import { SheetsService } from "../services/sheetsService.js";
import { env } from "../config/env.js";

export function startScheduler() {
    const wb = new WbService();
    const sheets = new SheetsService();

    const job1 = new cron.CronJob(
        env.cron.wbFetch,
        async () => {
            try {
                console.log("WB fetch job started", new Date().toISOString());
                const data = await wb.fetchBoxTariffs();
                await wb.saveTodayTariff(data);
                console.log("WB tariffs saved for today");
            } catch (err) {
                console.error("WB fetch error", err);
            }
        },
        null,
        true,
    );

    const job2 = new cron.CronJob(
        env.cron.sheetsUpdate,
        async () => {
            try {
                console.log("Sheets sync job started", new Date().toISOString());
                const today = new Date().toISOString().slice(0, 10);
                await sheets.syncTariffsToSheetsForDate(today, env.sheets.ids);
                console.log("Sheets updated");
            } catch (err) {
                console.error("Sheets sync error", err);
            }
        },
        null,
        true,
    );

    job1.start();
    job2.start();

    (async () => {
        try {
            const data = await wb.fetchBoxTariffs();
            await wb.saveTodayTariff(data);
        } catch (e) {
            console.error("initial fetch error", e);
        }
    })();
}
