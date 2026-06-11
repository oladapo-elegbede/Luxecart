import { PrismaClient } from '@prisma/client';

/**
 * Quick script to seed test notifications.
 *
 * Usage: tsx prisma/seed-notifications.ts
 *
 * NOT part of the main seed script — this is a temporary tool
 * for testing the notifications module.
 */

const prisma = new PrismaClient();

async function main() {
  // Find our test user
  const user = await prisma.user.findUnique({
    where: { email: 'testuser@example.com' },
  });

  if (!user) {
    console.error('Test user not found. Run main seed first.');
    process.exit(1);
  }

  // Find an order to reference in notifications
  const order = await prisma.order.findFirst({
    where: { userId: user.id },
  });

  // Create a variety of notifications
  const notifications = [
    {
      userId: user.id,
      type: 'SYSTEM' as const,
      title: 'Welcome to LuxeCart!',
      message: 'Thanks for joining. Explore our curated collection of premium products.',
      data: {},
      isRead: false,
    },
    {
      userId: user.id,
      type: 'ORDER_UPDATE' as const,
      title: 'Order received',
      message: `We've received your order ${order?.orderNumber ?? ''}. It's being processed.`,
      data: order ? { orderId: order.id, orderNumber: order.orderNumber } : {},
      isRead: false,
    },
    {
      userId: user.id,
      type: 'PROMOTION' as const,
      title: 'Summer Sale starts tomorrow',
      message: 'Get up to 50% off on selected items. Limited time only!',
      data: { campaign: 'summer-sale-2026' },
      isRead: true,  // This one already read
    },
    {
      userId: user.id,
      type: 'ORDER_UPDATE' as const,
      title: 'Your order is being prepared',
      message: `Order ${order?.orderNumber ?? ''} is being packed and will ship soon.`,
      data: order ? { orderId: order.id } : {},
      isRead: false,
    },
    {
      userId: user.id,
      type: 'REVIEW_RESPONSE' as const,
      title: 'Your review was helpful',
      message: '3 people found your review of "Wireless Noise-Cancelling Headphones" helpful.',
      data: {},
      isRead: false,
    },
  ];

  for (const notif of notifications) {
    await prisma.notification.create({
      data: notif,
    });
    console.log(`✓ Created: "${notif.title}"`);
  }

  console.log(`\n✅ Created ${notifications.length} test notifications for ${user.email}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });