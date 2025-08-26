// WbService.ts
import axios from "axios";
import { env } from "../config/env.js";
import { db } from "../db/knex.js";

export class WbService {
  private base = env.wbApiUrl;

  async fetchBoxTariffs(): Promise<any> {
    const url = `${this.base}/api/v1/tariffs/box`;
    const headers: any = {};
    if (env.wbToken) headers["Authorization"] = `Bearer ${env.wbToken}`;
    const { data } = await axios.get(url, { headers, timeout: 15000 });
    return data;
  }

  // Сохраняем или обновляем запись для текущей даты
  async saveTodayTariff(payload: any) {
    const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
    const existing = await db("wb_box_tariffs").where({ date: today }).first();
    if (existing) {
      await db("wb_box_tariffs")
        .where({ id: existing.id })
        .update({ data: JSON.stringify(payload), updated_at: db.fn.now() });
      return { updated: true };
    } else {
      await db("wb_box_tariffs").insert({ date: today, data: JSON.stringify(payload) });
      return { created: true };
    }
  }

  async getTariffByDate(date: string) {
    return db("wb_box_tariffs").where({ date }).first();
  }

  // Получение диапазона дат
  async getTariffsRange(startDate: string, endDate: string) {
    return db("wb_box_tariffs").whereBetween("date", [startDate, endDate]).orderBy("date", "asc");
  }
}
