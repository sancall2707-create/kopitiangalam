import { Router, type IRouter } from "express";
import { eq, sql, desc, and } from "drizzle-orm";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import {
  db,
  adminsTable,
  categoriesTable,
  productsTable,
  ordersTable,
  orderItemsTable,
  coffeeTablesTable,
} from "@workspace/db";
import {
  AdminLoginBody,
  AdminLoginResponse,
  GetAdminDashboardResponse,
  ListAdminOrdersQueryParams,
  ListAdminOrdersResponse,
  GetAdminOrderParams,
  GetAdminOrderResponse,
  UpdateOrderStatusParams,
  UpdateOrderStatusBody,
  UpdateOrderStatusResponse,
  ListAdminProductsResponse,
  CreateProductBody,
  UpdateProductParams,
  UpdateProductBody,
  UpdateProductResponse,
  DeleteProductParams,
  CreateCategoryBody,
  UpdateCategoryParams,
  UpdateCategoryBody,
  UpdateCategoryResponse,
  DeleteCategoryParams,
  ListTablesResponse,
  CreateTableBody,
  UpdateTableParams,
  UpdateTableBody,
  UpdateTableResponse,
  DeleteTableParams,
} from "@workspace/api-zod";
import { requireAdmin } from "../middlewares/auth";
import { coerceProduct, coerceOrder, coerceOrderItem } from "./public";

const router: IRouter = Router();

function parseId(raw: string | string[] | undefined): number {
  const s = Array.isArray(raw) ? raw[0] : raw;
  return parseInt(s ?? "", 10);
}

async function getOrderWithItems(orderId: number) {
  const [order] = await db.select().from(ordersTable).where(eq(ordersTable.id, orderId));
  if (!order) return null;

  const items = await db
    .select({
      id: orderItemsTable.id,
      productId: orderItemsTable.productId,
      productName: productsTable.name,
      productImage: productsTable.image,
      quantity: orderItemsTable.quantity,
      price: orderItemsTable.price,
      subtotal: orderItemsTable.subtotal,
    })
    .from(orderItemsTable)
    .leftJoin(productsTable, eq(orderItemsTable.productId, productsTable.id))
    .where(eq(orderItemsTable.orderId, order.id));

  return coerceOrder(
    { ...order } as Record<string, unknown>,
    items.map((i) => coerceOrderItem(i as Record<string, unknown>))
  );
}

// POST /admin/login
router.post("/admin/login", async (req, res): Promise<void> => {
  const parsed = AdminLoginBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { username, password } = parsed.data;
  const [admin] = await db.select().from(adminsTable).where(eq(adminsTable.username, username));

  if (!admin) {
    res.status(401).json({ error: "Invalid credentials" });
    return;
  }

  const valid = await bcrypt.compare(password, admin.password);
  if (!valid) {
    res.status(401).json({ error: "Invalid credentials" });
    return;
  }

  const token = jwt.sign(
    { id: admin.id, username: admin.username },
    process.env.SESSION_SECRET ?? "secret",
    { expiresIn: "7d" }
  );

  res.json(AdminLoginResponse.parse({ token, username: admin.username }));
});

// GET /admin/dashboard
router.get("/admin/dashboard", requireAdmin, async (req, res): Promise<void> => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [totalRow] = await db.select({ count: sql<number>`count(*)::int` }).from(ordersTable);
  const [activeRow] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(ordersTable)
    .where(sql`${ordersTable.status} IN ('pending','processing','preparing','ready')`);

  const [salesRow] = await db
    .select({ total: sql<string>`coalesce(sum(total_price),0)` })
    .from(ordersTable)
    .where(
      and(
        sql`${ordersTable.createdAt} >= ${today.toISOString()}`,
        sql`${ordersTable.status} != 'cancelled'`
      )
    );

  const recentRows = await db
    .select()
    .from(ordersTable)
    .orderBy(desc(ordersTable.createdAt))
    .limit(10);

  const recentWithItems = await Promise.all(
    recentRows.map((o) => getOrderWithItems(o.id))
  );

  const statusCounts = await db
    .select({
      status: ordersTable.status,
      count: sql<number>`count(*)::int`,
    })
    .from(ordersTable)
    .groupBy(ordersTable.status);

  const stats = {
    totalOrders: totalRow?.count ?? 0,
    activeOrders: activeRow?.count ?? 0,
    dailySales: parseFloat(salesRow?.total ?? "0"),
    recentOrders: recentWithItems.filter(Boolean),
    ordersByStatus: statusCounts,
  };

  res.json(GetAdminDashboardResponse.parse(stats));
});

// GET /admin/orders
router.get("/admin/orders", requireAdmin, async (req, res): Promise<void> => {
  const parsed = ListAdminOrdersQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { status, date } = parsed.data;

  const conditions: ReturnType<typeof eq>[] = [];
  if (status) conditions.push(eq(ordersTable.status, status));

  const rows = await db
    .select()
    .from(ordersTable)
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(desc(ordersTable.createdAt));

  const ordersWithItems = await Promise.all(rows.map((o) => getOrderWithItems(o.id)));
  res.json(ListAdminOrdersResponse.parse(ordersWithItems.filter(Boolean)));
});

// GET /admin/orders/:id
router.get("/admin/orders/:id", requireAdmin, async (req, res): Promise<void> => {
  const params = GetAdminOrderParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const order = await getOrderWithItems(params.data.id);
  if (!order) {
    res.status(404).json({ error: "Order not found" });
    return;
  }

  res.json(GetAdminOrderResponse.parse(order));
});

// PATCH /admin/orders/:id
router.patch("/admin/orders/:id", requireAdmin, async (req, res): Promise<void> => {
  const params = UpdateOrderStatusParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const body = UpdateOrderStatusBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }

  const [updated] = await db
    .update(ordersTable)
    .set({ status: body.data.status })
    .where(eq(ordersTable.id, params.data.id))
    .returning();

  if (!updated) {
    res.status(404).json({ error: "Order not found" });
    return;
  }

  const order = await getOrderWithItems(updated.id);
  res.json(UpdateOrderStatusResponse.parse(order));
});

// GET /admin/products
router.get("/admin/products", requireAdmin, async (_req, res): Promise<void> => {
  const rows = await db
    .select({
      id: productsTable.id,
      categoryId: productsTable.categoryId,
      categoryName: categoriesTable.name,
      name: productsTable.name,
      description: productsTable.description,
      price: productsTable.price,
      image: productsTable.image,
      stock: productsTable.stock,
      status: productsTable.status,
      createdAt: productsTable.createdAt,
    })
    .from(productsTable)
    .leftJoin(categoriesTable, eq(productsTable.categoryId, categoriesTable.id))
    .orderBy(productsTable.id);

  res.json(ListAdminProductsResponse.parse(rows.map((r) => ({ ...coerceProduct(r as Record<string, unknown>), createdAt: String(r.createdAt) }))));
});

// POST /admin/products
router.post("/admin/products", requireAdmin, async (req, res): Promise<void> => {
  const parsed = CreateProductBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [product] = await db
    .insert(productsTable)
    .values({
      ...parsed.data,
      price: String(parsed.data.price),
      stock: parsed.data.stock ?? 0,
      status: parsed.data.status ?? "active",
    })
    .returning();

  const [row] = await db
    .select({
      id: productsTable.id,
      categoryId: productsTable.categoryId,
      categoryName: categoriesTable.name,
      name: productsTable.name,
      description: productsTable.description,
      price: productsTable.price,
      image: productsTable.image,
      stock: productsTable.stock,
      status: productsTable.status,
      createdAt: productsTable.createdAt,
    })
    .from(productsTable)
    .leftJoin(categoriesTable, eq(productsTable.categoryId, categoriesTable.id))
    .where(eq(productsTable.id, product.id));

  res.status(201).json(coerceProduct({ ...row, createdAt: String(row.createdAt) } as Record<string, unknown>));
});

// PUT /admin/products/:id
router.put("/admin/products/:id", requireAdmin, async (req, res): Promise<void> => {
  const params = UpdateProductParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const body = UpdateProductBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }

  const updateData: Record<string, unknown> = { ...body.data };
  if (updateData.price != null) updateData.price = String(updateData.price);

  const [updated] = await db
    .update(productsTable)
    .set(updateData)
    .where(eq(productsTable.id, params.data.id))
    .returning();

  if (!updated) {
    res.status(404).json({ error: "Product not found" });
    return;
  }

  const [row] = await db
    .select({
      id: productsTable.id,
      categoryId: productsTable.categoryId,
      categoryName: categoriesTable.name,
      name: productsTable.name,
      description: productsTable.description,
      price: productsTable.price,
      image: productsTable.image,
      stock: productsTable.stock,
      status: productsTable.status,
      createdAt: productsTable.createdAt,
    })
    .from(productsTable)
    .leftJoin(categoriesTable, eq(productsTable.categoryId, categoriesTable.id))
    .where(eq(productsTable.id, updated.id));

  res.json(UpdateProductResponse.parse(coerceProduct({ ...row, createdAt: String(row.createdAt) } as Record<string, unknown>)));
});

// DELETE /admin/products/:id
router.delete("/admin/products/:id", requireAdmin, async (req, res): Promise<void> => {
  const params = DeleteProductParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [deleted] = await db
    .delete(productsTable)
    .where(eq(productsTable.id, params.data.id))
    .returning();

  if (!deleted) {
    res.status(404).json({ error: "Product not found" });
    return;
  }

  res.sendStatus(204);
});

// POST /admin/categories
router.post("/admin/categories", requireAdmin, async (req, res): Promise<void> => {
  const parsed = CreateCategoryBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [cat] = await db.insert(categoriesTable).values(parsed.data).returning();
  res.status(201).json({ ...cat, createdAt: String(cat.createdAt) });
});

// PUT /admin/categories/:id
router.put("/admin/categories/:id", requireAdmin, async (req, res): Promise<void> => {
  const params = UpdateCategoryParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const body = UpdateCategoryBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }

  const [updated] = await db
    .update(categoriesTable)
    .set(body.data)
    .where(eq(categoriesTable.id, params.data.id))
    .returning();

  if (!updated) {
    res.status(404).json({ error: "Category not found" });
    return;
  }

  res.json(UpdateCategoryResponse.parse({ ...updated, createdAt: String(updated.createdAt) }));
});

// DELETE /admin/categories/:id
router.delete("/admin/categories/:id", requireAdmin, async (req, res): Promise<void> => {
  const params = DeleteCategoryParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [deleted] = await db.delete(categoriesTable).where(eq(categoriesTable.id, params.data.id)).returning();
  if (!deleted) {
    res.status(404).json({ error: "Category not found" });
    return;
  }

  res.sendStatus(204);
});

// GET /admin/tables
router.get("/admin/tables", requireAdmin, async (_req, res): Promise<void> => {
  const tables = await db.select().from(coffeeTablesTable).orderBy(coffeeTablesTable.tableNumber);
  res.json(ListTablesResponse.parse(tables.map((t) => ({ ...t, createdAt: String(t.createdAt) }))));
});

// POST /admin/tables
router.post("/admin/tables", requireAdmin, async (req, res): Promise<void> => {
  const parsed = CreateTableBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [table] = await db
    .insert(coffeeTablesTable)
    .values({
      tableNumber: parsed.data.tableNumber,
      status: parsed.data.status ?? "available",
    })
    .returning();

  res.status(201).json({ ...table, createdAt: String(table.createdAt) });
});

// PUT /admin/tables/:id
router.put("/admin/tables/:id", requireAdmin, async (req, res): Promise<void> => {
  const params = UpdateTableParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const body = UpdateTableBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }

  const [updated] = await db
    .update(coffeeTablesTable)
    .set(body.data)
    .where(eq(coffeeTablesTable.id, params.data.id))
    .returning();

  if (!updated) {
    res.status(404).json({ error: "Table not found" });
    return;
  }

  res.json(UpdateTableResponse.parse({ ...updated, createdAt: String(updated.createdAt) }));
});

// DELETE /admin/tables/:id
router.delete("/admin/tables/:id", requireAdmin, async (req, res): Promise<void> => {
  const params = DeleteTableParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [deleted] = await db.delete(coffeeTablesTable).where(eq(coffeeTablesTable.id, params.data.id)).returning();
  if (!deleted) {
    res.status(404).json({ error: "Table not found" });
    return;
  }

  res.sendStatus(204);
});

export default router;
