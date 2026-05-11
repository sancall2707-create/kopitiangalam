import { db, adminsTable, categoriesTable, productsTable, coffeeTablesTable } from "@workspace/db";
import bcrypt from "bcryptjs";

async function seed() {
  console.log("Seeding database...");

  // Admin
  const existing = await db.select().from(adminsTable);
  if (existing.length === 0) {
    const hash = await bcrypt.hash("admin123", 10);
    await db.insert(adminsTable).values({ username: "admin", password: hash });
    console.log("Created admin user: admin / admin123");
  } else {
    console.log("Admin user already exists");
  }

  // Categories
  const cats = await db.select().from(categoriesTable);
  let catMap: Record<string, number> = {};
  if (cats.length === 0) {
    const inserted = await db.insert(categoriesTable).values([
      { name: "Coffee" },
      { name: "Non Coffee" },
      { name: "Food" },
      { name: "Snacks" },
    ]).returning();
    inserted.forEach((c) => (catMap[c.name] = c.id));
    console.log("Created categories:", Object.keys(catMap).join(", "));
  } else {
    cats.forEach((c) => (catMap[c.name] = c.id));
    console.log("Categories already exist");
  }

  // Products
  const prods = await db.select().from(productsTable);
  if (prods.length === 0) {
    await db.insert(productsTable).values([
      { name: "Kopi Tubruk", categoryId: catMap["Coffee"], description: "Kopi hitam khas nusantara dengan cita rasa bold dan earthy", price: "15000", stock: 50, status: "active", image: "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=400&q=80" },
      { name: "Es Kopi Susu", categoryId: catMap["Coffee"], description: "Kopi espresso dicampur susu segar, disajikan dingin", price: "22000", stock: 40, status: "active", image: "https://images.unsplash.com/photo-1561882468-9110e03e0f78?w=400&q=80" },
      { name: "Kopi Latte", categoryId: catMap["Coffee"], description: "Espresso dengan steamed milk dan sedikit foam", price: "28000", stock: 35, status: "active", image: "https://images.unsplash.com/photo-1485808191679-5f86510bd9d4?w=400&q=80" },
      { name: "Cappuccino", categoryId: catMap["Coffee"], description: "Espresso dengan steamed milk dan frothy foam yang tebal", price: "28000", stock: 30, status: "active", image: "https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=400&q=80" },
      { name: "Americano", categoryId: catMap["Coffee"], description: "Espresso yang diencerkan dengan air panas", price: "20000", stock: 50, status: "active", image: "https://images.unsplash.com/photo-1551033406-611cf9a28f67?w=400&q=80" },
      { name: "Teh Tarik", categoryId: catMap["Non Coffee"], description: "Teh susu kental manis yang ditarik hingga berbusa", price: "15000", stock: 40, status: "active", image: "https://images.unsplash.com/photo-1571934811356-5cc061b6821f?w=400&q=80" },
      { name: "Coklat Panas", categoryId: catMap["Non Coffee"], description: "Minuman coklat hangat dengan susu segar", price: "20000", stock: 30, status: "active", image: "https://images.unsplash.com/photo-1517578239113-b03992dcdd25?w=400&q=80" },
      { name: "Jus Jeruk", categoryId: catMap["Non Coffee"], description: "Jus jeruk segar diperas langsung", price: "18000", stock: 25, status: "active", image: "https://images.unsplash.com/photo-1613478223719-2ab802602423?w=400&q=80" },
      { name: "Nasi Goreng", categoryId: catMap["Food"], description: "Nasi goreng spesial dengan telur, ayam, dan bumbu rahasia", price: "35000", stock: 20, status: "active", image: "https://images.unsplash.com/photo-1512058564366-18510be2db19?w=400&q=80" },
      { name: "Mie Goreng", categoryId: catMap["Food"], description: "Mie goreng spesial dengan sayuran segar dan telur", price: "30000", stock: 20, status: "active", image: "https://images.unsplash.com/photo-1569050467447-ce54b3bbc37d?w=400&q=80" },
      { name: "Roti Bakar", categoryId: catMap["Snacks"], description: "Roti bakar dengan pilihan topping selai dan meses coklat", price: "18000", stock: 30, status: "active", image: "https://images.unsplash.com/photo-1484723091739-30a097e8f929?w=400&q=80" },
      { name: "Pisang Goreng", categoryId: catMap["Snacks"], description: "Pisang goreng crispy dengan toping keju dan coklat", price: "15000", stock: 25, status: "active", image: "https://images.unsplash.com/photo-1571871125645-cadb1f5a5a0c?w=400&q=80" },
    ]);
    console.log("Created 12 sample products");
  } else {
    console.log("Products already exist");
  }

  // Tables
  const tables = await db.select().from(coffeeTablesTable);
  if (tables.length === 0) {
    await db.insert(coffeeTablesTable).values(
      Array.from({ length: 10 }, (_, i) => ({
        tableNumber: String(i + 1).padStart(2, "0"),
        status: "available" as const,
      }))
    );
    console.log("Created 10 tables (01-10)");
  } else {
    console.log("Tables already exist");
  }

  console.log("Seeding complete!");
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
