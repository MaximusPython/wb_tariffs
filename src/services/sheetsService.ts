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

/** Ожидаем, что payload data будет в структуре: { tariffs: [ { sku, coef, ... }, ... ] } — но код ниже универсален: берем массив из data. */
export class SheetsService {
    private sheets = getSheetsClient();

    // Подготовим двумерный массив строк для записи (header + rows)
    private prepareRows(dataArray: any[]): string[][] {
        if (!dataArray || dataArray.length === 0) return [["No data"]];
        // Выделим колонки по keys первого объекта
        const keys = Object.keys(dataArray[0]);
        const header = keys;
        const rows = dataArray.map((item) => keys.map((k) => (item[k] === null || item[k] === undefined ? "" : String(item[k]))));
        return [header, ...rows];
    }

    // Обновить лист stocks_coefs (создать/очистить и записать)
    async updateSheetWithTariffs(spreadsheetId: string, dataArray: any[]) {
        const sheetName = "stocks_coefs";
        // Для простоты используем spreadsheets.values.update с range 'stocks_coefs!A1'
        const rows = this.prepareRows(dataArray);
        // batchUpdate: убедимся, что лист существует (по простоте — записываем и если листа нет, Google создаст данные в существующем листе с таким именем?)
        // Лучше: попытаться clear range, затем update.
        const range = `${sheetName}!A1`;
        await this.sheets.spreadsheets.values.clear({ spreadsheetId, range });
        await this.sheets.spreadsheets.values.update({
            spreadsheetId,
            range,
            valueInputOption: "RAW",
            requestBody: { values: rows },
        });
    }

    // Получаем данные из БД, преобразуем и отправляем в N таблиц
    async syncTariffsToSheetsForDate(date: string, spreadsheetIds: string[]) {
        const rec = await db("wb_box_tariffs").where({ date }).first();
        if (!rec) throw new Error(`No data for date ${date}`);
        const payload = rec.data; // jsonb -> already a string, depending on knex config may be object
        const data = typeof payload === "string" ? JSON.parse(payload) : payload;

        // Предполагаем, что в data есть массив тарифов в data.tariffs или просто data (проверьте реальную структуру)
        let items: any[] = [];
        if (Array.isArray(data?.tariffs)) items = data.tariffs;
        else if (Array.isArray(data)) items = data;
        else if (Array.isArray(data?.data)) items = data.data;
        else {
            // если структура иная — попытаемся извлечь массив по первому перечисляемому полю
            const firstArray = Object.values(data).find((v) => Array.isArray(v));
            if (firstArray) items = firstArray;
        }

        // Сортировка по коэф. Предполагаем поле `coef` или `coefficient` — проверяем
        items.sort((a: any, b: any) => {
            const av = parseFloat(a.coef ?? a.coefficient ?? a.coefficient_val ?? 0);
            const bv = parseFloat(b.coef ?? b.coefficient ?? b.coefficient_val ?? 0);
            return (isNaN(av) ? 0 : av) - (isNaN(bv) ? 0 : bv);
        });

        // Для каждого spreadsheetId — записать
        for (const id of spreadsheetIds) {
            await this.updateSheetWithTariffs(id, items);
        }
    }
}
