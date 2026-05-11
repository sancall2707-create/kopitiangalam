import { Router, type IRouter } from "express";
import { eq, ilike, and, sql } from "drizzle-orm";
import { db, categoriesTable, productsTable, ordersTable, orderItemsTable } from "@workspace/db";
import {
  ListCategoriesResponse,
  ListProductsQueryParams,
  ListProductsResponse,
  GetProductParams,
  GetProductResponse,
  CreateOrderBody,
  GetOrderByNumberParams,
  GetOrderByNumberResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

function parseId(raw: string | string[] | undefined): number {
  const s = Array.isArray(raw) ? raw[0] : raw;
  return parseInt(s ?? "", 10);
}

function coerceProduct(p: Record<string, unknown>) {
  return {
    ...p,
    price: parseFloat(p.price as string),
  };
}

function coerceOrder(o: Record<string, unknown>, items: unknown[]) {
  return {
    ...o,
    totalPrice: parseFloat(o.totalPrice as string),
    createdAt: String(o.createdAt),
    items,
  };
}

function coerceOrderItem(i: Record<string, unknown>) {
  return {
    ...i,
    price: parseFloat(i.price as string),
    subtotal: parseFloat(i.subtotal as string),
  };
}

function generateOrderNumber(): string {
  const d = new Date();
  const date = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `KTA-${date}-${rand}`;
}

// GET /categories
router.get("/categories", async (_req, res): Promise<void> => {
  const cats = await db.select().from(categoriesTable).orderBy(categoriesTable.id);
  res.json(ListCategoriesResponse.parse(cats.map((c) => ({ ...c, createdAt: String(c.createdAt) }))));
});

// GET /products
router.get("/products", async (req, res): Promise<void> => {
  const parsed = ListProductsQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { categoryId, search } = parsed.data;

  const conditions = [eq(productsTable.status, "active")];
  if (categoryId != null) conditions.push(eq(productsTable.categoryId, categoryId));
  if (search) conditions.push(ilike(productsTable.name, `%${search}%`));

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
    .where(and(...conditions))
    .orderBy(productsTable.id);

  res.json(ListProductsResponse.parse(rows.map((r) => ({ ...coerceProduct(r as Record<string, unknown>), createdAt: String(r.createdAt) }))));
});

// GET /products/:id
router.get("/products/:id", async (req, res): Promise<void> => {
  const params = GetProductParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
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
    .where(eq(productsTable.id, params.data.id));

  if (!row) {
    res.status(404).json({ error: "Product not found" });
    return;
  }

  res.json(GetProductResponse.parse({ ...coerceProduct(row as Record<string, unknown>), createdAt: String(row.createdAt) }));
});

// POST /orders
router.post("/orders", async (req, res): Promise<void> => {
  const parsed = CreateOrderBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { customerName, tableNumber, orderType, notes, items } = parsed.data;

  // Fetch product prices
  const productIds = items.map((i) => i.productId);
  const products = await db
    .select()
    .from(productsTable)
    .where(sql`${productsTable.id} = ANY(${productIds})`);

  const productMap = new Map(products.map((p) => [p.id, p]));

  let totalPrice = 0;
  const enrichedItems: Array<{ productId: number; quantity: number; price: number; subtotal: number }> = [];

  for (const item of items) {
    const product = productMap.get(item.productId);
    if (!product) {
      res.status(400).json({ error: `Product ${item.productId} not found` });
      return;
    }
    const price = parseFloat(product.price as string);
    const subtotal = price * item.quantity;
    totalPrice += subtotal;
    enrichedItems.push({ productId: item.productId, quantity: item.quantity, price, subtotal });
  }

  const orderNumber = generateOrderNumber();

  const [order] = await db
    .insert(ordersTable)
    .values({
      orderNumber,
      customerName,
      tableNumber: tableNumber ?? null,
      orderType,
      status: "pending",
      notes: notes ?? null,
      totalPrice: String(totalPrice),
    })
    .returning();

  // Insert order items
  const itemRows = await db
    .insert(orderItemsTable)
    .values(
      enrichedItems.map((ei) => ({
        orderId: order.id,
        productId: ei.productId,
        quantity: ei.quantity,
        price: String(ei.price),
        subtotal: String(ei.subtotal),
      }))
    )
    .returning();

  // Fetch product names for response
  const orderItemsWithNames = itemRows.map((item) => {
    const product = productMap.get(item.productId)!;
    return {
      id: item.id,
      productId: item.productId,
      productName: product.name,
      productImage: product.image ?? null,
      quantity: item.quantity,
      price: parseFloat(item.price as string),
      subtotal: parseFloat(item.subtotal as string),
    };
  });

  const responseOrder = coerceOrder({ ...order, createdAt: order.createdAt } as Record<string, unknown>, orderItemsWithNames);
  res.status(201).json(responseOrder);
});

// GET /orders/:orderNumber
router.get("/orders/:orderNumber", async (req, res): Promise<void> => {
  const params = GetOrderByNumberParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [order] = await db
    .select()
    .from(ordersTable)
    .where(eq(ordersTable.orderNumber, params.data.orderNumber));

  if (!order) {
    res.status(404).json({ error: "Order not found" });
    return;
  }

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

  const orderItemsMapped = items.map((i) => coerceOrderItem(i as Record<string, unknown>));
  const responseOrder = coerceOrder({ ...order } as Record<string, unknown>, orderItemsMapped);

  res.json(GetOrderByNumberResponse.parse(responseOrder));
});

export { parseId, coerceProduct, coerceOrder, coerceOrderItem };
export default router;
