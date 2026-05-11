import { pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const coffeeTablesTable = pgTable("coffee_tables", {
  id: serial("id").primaryKey(),
  tableNumber: text("table_number").notNull().unique(),
  qrCode: text("qr_code"),
  status: text("status").notNull().default("available"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertCoffeeTableSchema = createInsertSchema(coffeeTablesTable).omit({ id: true, createdAt: true });
export type InsertCoffeeTable = z.infer<typeof insertCoffeeTableSchema>;
export type CoffeeTable = typeof coffeeTablesTable.$inferSelect;
