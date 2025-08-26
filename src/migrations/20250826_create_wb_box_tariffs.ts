import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
    await knex.schema.createTable("wb_box_tariffs", (table) => {
        table.increments("id").primary();
        table.date("date").notNullable().index();
        table.jsonb("data").notNullable();
        table.timestamp("updated_at").defaultTo(knex.fn.now()).notNullable();
        table.unique(["date"]); // ровно одна запись на дату
    });
}

export async function down(knex: Knex): Promise<void> {
    await knex.schema.dropTableIfExists("wb_box_tariffs");
}
