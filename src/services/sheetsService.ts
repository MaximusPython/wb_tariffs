import { google } from "googleapis";
import { env } from "../config/env.js";
import { db } from "../db/knex.js";

function getSheetsClient() {
if (!env.sheets.credentialsBase64) throw new Error("No Google credentials provided");
    const json = Buffer.from(env.sheets.credentialsBase64, "base64").toString("utf8");
    const creds = JSON.parse(json);

    const auth = new google.auth.GoogleAuth({
        credentials: creds,
        scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });

    return google.sheets({ version: "v4", auth });
}

export class SheetsService {
    private sheets = getSheetsClient();

    private prepareRows(dataArray: any[]): string[][] {
        if (!dataArray || dataArray.length === 0) return [["No data"]];
        // Выделим колонки по keys первого объекта
        const keys = Object.keys(dataArray[0]);
        const header = keys;
        const rows = dataArray.map((item) => keys.map((k) => (item[k] === null || item[k] === undefined ? "" : String(item[k]))));
        return [header, ...rows];
    }

    async updateSheetWithTariffs(spreadsheetId: string, dataArray: any[]) {
        const sheetName = "stocks_coefs";
        const rows = this.prepareRows(dataArray);

        const range = `${sheetName}!A1`;
        await this.sheets.spreadsheets.values.clear({ spreadsheetId, range });
        await this.sheets.spreadsheets.values.update({
            spreadsheetId,
            range,
            valueInputOption: "RAW",
            requestBody: { values: rows },
        });
    }

    async syncTariffsToSheetsForDate(date: string, spreadsheetIds: string[]) {
        const rec = await db("wb_box_tariffs").where({ date }).first();
        if (!rec) throw new Error(`No data for date ${date}`);
        const payload = rec.data; // jsonb -> already a string, depending on knex config may be object
        const data = typeof payload === "string" ? JSON.parse(payload) : payload;

        let items: any[] = [];
        if (Array.isArray(data?.tariffs)) items = data.tariffs;
        else if (Array.isArray(data)) items = data;
        else if (Array.isArray(data?.data)) items = data.data;
        else {

            const firstArray = Object.values(data).find((v) => Array.isArray(v));
            if (firstArray) items = firstArray;
        }

        items.sort((a: any, b: any) => {
            const av = parseFloat(a.coef ?? a.coefficient ?? a.coefficient_val ?? 0);
            const bv = parseFloat(b.coef ?? b.coefficient ?? b.coefficient_val ?? 0);
            return (isNaN(av) ? 0 : av) - (isNaN(bv) ? 0 : bv);
        });

        for (const id of spreadsheetIds) {
            await this.updateSheetWithTariffs(id, items);
        }
    }
}
