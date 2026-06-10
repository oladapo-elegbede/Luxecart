import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

/**
 * Database Seed Script
 *
 * Populates the database with realistic sample data for development.
 *
 * Run with: npx prisma db seed
 *
 * SAFETY: This script DELETES all existing data first.
 * Never run this against a production database.
 */

const prisma = new PrismaClient();

async function main(): Promise<void> {
  console.log('🌱 Starting database seed...\n');

  // ─────────────────────────────────────────
  // 1. Clean existing data
  // ─────────────────────────────────────────
  console.log('🧹 Cleaning existing data...');

  // Order matters! Delete in reverse dependency order (children before parents)
  await prisma.notification.deleteMany();
  await prisma.review.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.wishlistItem.deleteMany();
  await prisma.wishlist.deleteMany();
  await prisma.cartItem.deleteMany();
  await prisma.cart.deleteMany();
  await prisma.productVariant.deleteMany();
  await prisma.productImage.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.verificationToken.deleteMany();
  await prisma.address.deleteMany();
  await prisma.user.deleteMany();

  console.log('✅ Existing data cleaned\n');

  // ─────────────────────────────────────────
  // 2. Create Users
  // ─────────────────────────────────────────
  console.log('👤 Creating users...');

  const hashedPassword = await bcrypt.hash('Password123!', 12);

  await prisma.user.create({
    data: {
      email: 'admin@luxecart.com',
      password: hashedPassword,
      firstName: 'Marcus',
      lastName: 'Thompson',
      role: 'ADMIN',
      isVerified: true,
    },
  });

  const customerUser = await prisma.user.create({
    data: {
      email: 'sarah@example.com',
      password: hashedPassword,
      firstName: 'Sarah',
      lastName: 'Chen',
      phone: '+1234567890',
      role: 'CUSTOMER',
      isVerified: true,
    },
  });

  // Create cart and wishlist for customer
  await prisma.cart.create({
    data: { userId: customerUser.id },
  });

  await prisma.wishlist.create({
    data: { userId: customerUser.id },
  });

  console.log(`✅ Created ${2} users\n`);

  // ─────────────────────────────────────────
  // 3. Create Categories
  // ─────────────────────────────────────────
  console.log('📂 Creating categories...');

  const electronics = await prisma.category.create({
    data: {
      name: 'Electronics',
      slug: 'electronics',
      description: 'Latest gadgets and electronic devices',
      imageUrl: 'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=800',
      displayOrder: 1,
    },
  });

  const fashion = await prisma.category.create({
    data: {
      name: 'Fashion',
      slug: 'fashion',
      description: 'Trendy clothing and accessories',
      imageUrl: 'https://images.unsplash.com/photo-1445205170230-053b83016050?w=800',
      displayOrder: 2,
    },
  });

  const home = await prisma.category.create({
    data: {
      name: 'Home & Living',
      slug: 'home-living',
      description: 'Beautiful items for your home',
      imageUrl: 'https://images.unsplash.com/photo-1583847268964-b28dc8f51f92?w=800',
      displayOrder: 3,
    },
  });

  const sports = await prisma.category.create({
    data: {
      name: 'Sports & Fitness',
      slug: 'sports-fitness',
      description: 'Gear for an active lifestyle',
      imageUrl: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=800',
      displayOrder: 4,
    },
  });

  const books = await prisma.category.create({
    data: {
      name: 'Books',
      slug: 'books',
      description: 'Bestsellers and timeless classics',
      imageUrl: 'https://images.unsplash.com/photo-1495446815901-a7297e633e8d?w=800',
      displayOrder: 5,
    },
  });

  console.log(`✅ Created 5 categories\n`);

  // ─────────────────────────────────────────
  // 4. Create Products
  // ─────────────────────────────────────────
  console.log('📦 Creating products...');

  const products = [
    {
      name: 'Wireless Noise-Cancelling Headphones',
      slug: 'wireless-noise-cancelling-headphones',
      description:
        'Premium over-ear headphones with industry-leading noise cancellation, 30-hour battery life, and crystal-clear audio quality.',
      shortDescription: 'Premium ANC headphones with 30-hour battery',
      sku: 'AUDIO-WH-001',
      price: 349.99,
      compareAtPrice: 449.99,
      stock: 50,
      categoryId: electronics.id,
      status: 'ACTIVE' as const,
      tags: ['headphones', 'wireless', 'noise-cancelling', 'audio'],
      imageUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800',
    },
    {
      name: 'Smart Fitness Watch Pro',
      slug: 'smart-fitness-watch-pro',
      description:
        'Track your heart rate, steps, sleep, and 100+ workout types. Built-in GPS, 7-day battery, and stunning AMOLED display.',
      shortDescription: 'Advanced fitness tracking with GPS',
      sku: 'WEAR-SW-001',
      price: 249.99,
      stock: 75,
      categoryId: electronics.id,
      status: 'ACTIVE' as const,
      tags: ['smartwatch', 'fitness', 'wearable', 'gps'],
      imageUrl: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800',
    },
    {
      name: 'Premium Leather Backpack',
      slug: 'premium-leather-backpack',
      description:
        'Handcrafted from full-grain leather with reinforced stitching. Spacious laptop compartment fits up to 16" devices.',
      shortDescription: 'Handcrafted full-grain leather backpack',
      sku: 'FASH-BP-001',
      price: 189.99,
      compareAtPrice: 229.99,
      stock: 30,
      categoryId: fashion.id,
      status: 'ACTIVE' as const,
      tags: ['backpack', 'leather', 'laptop bag'],
      imageUrl: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800',
    },
    {
      name: 'Classic Wool Overcoat',
      slug: 'classic-wool-overcoat',
      description:
        'Timeless wool overcoat tailored from premium Italian wool. Perfect for sophisticated winter style.',
      shortDescription: 'Premium Italian wool overcoat',
      sku: 'FASH-CT-001',
      price: 399.99,
      stock: 25,
      categoryId: fashion.id,
      status: 'ACTIVE' as const,
      tags: ['coat', 'wool', 'winter', 'formal'],
      imageUrl: 'https://images.unsplash.com/photo-1539533018447-63fcce2678e3?w=800',
    },
    {
      name: 'Scandinavian Floor Lamp',
      slug: 'scandinavian-floor-lamp',
      description:
        'Minimalist floor lamp with warm dimmable LED lighting. Solid oak base with matte black finish.',
      shortDescription: 'Minimalist Scandinavian floor lamp',
      sku: 'HOME-LP-001',
      price: 149.99,
      stock: 40,
      categoryId: home.id,
      status: 'ACTIVE' as const,
      tags: ['lamp', 'lighting', 'scandinavian', 'minimalist'],
      imageUrl: 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=800',
    },
    {
      name: 'Ceramic Pour-Over Coffee Set',
      slug: 'ceramic-pour-over-coffee-set',
      description:
        'Complete pour-over coffee brewing set with ceramic dripper, glass carafe, and matching mug.',
      shortDescription: 'Handcrafted ceramic coffee set',
      sku: 'HOME-CF-001',
      price: 79.99,
      compareAtPrice: 99.99,
      stock: 60,
      categoryId: home.id,
      status: 'ACTIVE' as const,
      tags: ['coffee', 'ceramic', 'kitchen'],
      imageUrl: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800',
    },
    {
      name: 'Premium Yoga Mat',
      slug: 'premium-yoga-mat',
      description:
        'Extra-thick 6mm yoga mat with non-slip surface, eco-friendly TPE material, and carrying strap.',
      shortDescription: 'Eco-friendly non-slip yoga mat',
      sku: 'SPRT-YM-001',
      price: 59.99,
      stock: 100,
      categoryId: sports.id,
      status: 'ACTIVE' as const,
      tags: ['yoga', 'fitness', 'eco-friendly'],
      imageUrl: 'https://images.unsplash.com/photo-1591291621164-2c6367723315?w=800',
    },
    {
      name: 'Professional Running Shoes',
      slug: 'professional-running-shoes',
      description:
        'Lightweight running shoes with responsive foam cushioning and breathable mesh upper.',
      shortDescription: 'Lightweight performance running shoes',
      sku: 'SPRT-RS-001',
      price: 159.99,
      stock: 80,
      categoryId: sports.id,
      status: 'ACTIVE' as const,
      tags: ['shoes', 'running', 'athletic'],
      imageUrl: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800',
    },
    {
      name: 'The Art of Modern Cooking',
      slug: 'art-of-modern-cooking',
      description:
        'A comprehensive guide to contemporary cuisine featuring 200+ recipes from world-renowned chefs.',
      shortDescription: '200+ recipes from world-class chefs',
      sku: 'BOOK-CK-001',
      price: 34.99,
      stock: 120,
      categoryId: books.id,
      status: 'ACTIVE' as const,
      tags: ['cooking', 'cookbook', 'recipes'],
      imageUrl: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=800',
    },
    {
      name: 'Atomic Habits Hardcover',
      slug: 'atomic-habits-hardcover',
      description:
        'The international bestseller on building good habits and breaking bad ones. Premium hardcover edition.',
      shortDescription: 'Bestseller on habit formation',
      sku: 'BOOK-AH-001',
      price: 24.99,
      compareAtPrice: 32.99,
      stock: 200,
      categoryId: books.id,
      status: 'ACTIVE' as const,
      tags: ['self-help', 'productivity', 'bestseller'],
      imageUrl: 'https://images.unsplash.com/photo-1589998059171-988d887df646?w=800',
    },
  ];

  for (const productData of products) {
    const { imageUrl, ...data } = productData;

    const product = await prisma.product.create({
      data: {
        ...data,
        images: {
          create: {
            url: imageUrl,
            altText: productData.name,
            position: 0,
          },
        },
      },
    });

    console.log(`  ✓ Created: ${product.name}`);
  }

  console.log(`\n✅ Created ${products.length} products\n`);

  // ─────────────────────────────────────────
  // Summary
  // ─────────────────────────────────────────
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🎉 Seed completed successfully!\n');
  console.log('Test accounts:');
  console.log('  👤 Admin:    admin@luxecart.com / Password123!');
  console.log('  👤 Customer: sarah@example.com / Password123!');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
}

main()
  .catch((error: unknown) => {
    console.error('❌ Seed failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });