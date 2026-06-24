"""Seed the catalog with everyday Indian grocery staples.

Usage:
    python manage.py seed_db            # add staples (idempotent upsert by name)
    python manage.py seed_db --flush    # wipe products first, then seed

The command is idempotent: products are matched by name and updated in place,
so running it repeatedly will not create duplicates.
"""

from decimal import Decimal

from django.core.management.base import BaseCommand
from django.db import transaction

from apps.products.models import Product

# A compact, realistic set of Indian quick-commerce staples across categories.
STAPLES = [
    {
        "name": "Amul Gold Milk",
        "brand": "Amul",
        "category": Product.Category.DAIRY,
        "description": "Full-cream homogenised toned milk, rich and creamy.",
        "price": Decimal("34.00"),
        "mrp": Decimal("36.00"),
        "stock_quantity": 120,
        "unit": "500 ml",
        "image_emoji": "🥛",
        "is_veg": True,
        "deal_badge": None,
        "estimated_delivery_time": 12,
    },
    {
        "name": "Amul Butter",
        "brand": "Amul",
        "category": Product.Category.DAIRY,
        "description": "Pasteurised salted table butter — the taste of India.",
        "price": Decimal("56.00"),
        "mrp": Decimal("60.00"),
        "stock_quantity": 80,
        "unit": "100 g",
        "image_emoji": "🧈",
        "is_veg": True,
        "deal_badge": "Bestseller",
        "estimated_delivery_time": 12,
    },
    {
        "name": "Cadbury Celebrations Pack",
        "brand": "Cadbury",
        "category": Product.Category.SNACKS,
        "description": "Assorted chocolate gift pack, perfect for festivities.",
        "price": Decimal("175.00"),
        "mrp": Decimal("200.00"),
        "stock_quantity": 45,
        "unit": "130 g",
        "image_emoji": "🍫",
        "is_veg": True,
        "deal_badge": "Festive Deal",
        "estimated_delivery_time": 15,
    },
    {
        "name": "Oreo Chocolate Cookies",
        "brand": "Cadbury",
        "category": Product.Category.SNACKS,
        "description": "Crunchy chocolate sandwich cookies with vanilla creme.",
        "price": Decimal("30.00"),
        "mrp": Decimal("35.00"),
        "stock_quantity": 150,
        "unit": "120 g",
        "image_emoji": "🍪",
        "is_veg": True,
        "deal_badge": None,
        "estimated_delivery_time": 15,
    },
    {
        "name": "Maggi 2-Minute Noodles",
        "brand": "Nestle",
        "category": Product.Category.SNACKS,
        "description": "Masala instant noodles — a quick, tasty snack.",
        "price": Decimal("14.00"),
        "mrp": Decimal("15.00"),
        "stock_quantity": 300,
        "unit": "70 g",
        "image_emoji": "🍜",
        "is_veg": True,
        "deal_badge": None,
        "estimated_delivery_time": 12,
    },
    {
        "name": "Colgate MaxFresh Toothpaste",
        "brand": "Colgate",
        "category": Product.Category.HYGIENE,
        "description": "Cooling crystals toothpaste for long-lasting fresh breath.",
        "price": Decimal("95.00"),
        "mrp": Decimal("110.00"),
        "stock_quantity": 60,
        "unit": "150 g",
        "image_emoji": "🪥",
        "is_veg": True,
        "deal_badge": None,
        "estimated_delivery_time": 18,
    },
    {
        "name": "Tata Salt",
        "brand": "Tata",
        "category": Product.Category.EVERYDAY,
        "description": "Vacuum-evaporated iodised salt — desh ka namak.",
        "price": Decimal("28.00"),
        "mrp": Decimal("30.00"),
        "stock_quantity": 200,
        "unit": "1 kg",
        "image_emoji": "🧂",
        "is_veg": True,
        "deal_badge": None,
        "estimated_delivery_time": 15,
    },
    {
        "name": "Aashirvaad Whole Wheat Atta",
        "brand": "Aashirvaad",
        "category": Product.Category.EVERYDAY,
        "description": "100% whole wheat atta for soft, fluffy rotis.",
        "price": Decimal("260.00"),
        "mrp": Decimal("285.00"),
        "stock_quantity": 70,
        "unit": "5 kg",
        "image_emoji": "🌾",
        "is_veg": True,
        "deal_badge": "Save ₹25",
        "estimated_delivery_time": 20,
    },
    {
        "name": "Fortune Sunflower Oil",
        "brand": "Fortune",
        "category": Product.Category.EVERYDAY,
        "description": "Refined sunflower cooking oil, light and healthy.",
        "price": Decimal("145.00"),
        "mrp": Decimal("160.00"),
        "stock_quantity": 90,
        "unit": "1 L",
        "image_emoji": "🛢️",
        "is_veg": True,
        "deal_badge": None,
        "estimated_delivery_time": 18,
    },
    {
        "name": "Mother Dairy Paneer",
        "brand": "Mother Dairy",
        "category": Product.Category.DAIRY,
        "description": "Fresh, soft cottage cheese — high in protein.",
        "price": Decimal("89.00"),
        "mrp": Decimal("95.00"),
        "stock_quantity": 40,
        "unit": "200 g",
        "image_emoji": "🧀",
        "is_veg": True,
        "deal_badge": None,
        "estimated_delivery_time": 14,
    },
    {
        "name": "Lay's Classic Salted Chips",
        "brand": "Lay's",
        "category": Product.Category.SNACKS,
        "description": "Crispy potato chips with the perfect pinch of salt.",
        "price": Decimal("20.00"),
        "mrp": Decimal("20.00"),
        "stock_quantity": 220,
        "unit": "52 g",
        "image_emoji": "🥔",
        "is_veg": True,
        "deal_badge": None,
        "estimated_delivery_time": 12,
    },
    {
        "name": "Dettol Original Soap",
        "brand": "Dettol",
        "category": Product.Category.HYGIENE,
        "description": "Trusted germ-protection bathing soap.",
        "price": Decimal("40.00"),
        "mrp": Decimal("45.00"),
        "stock_quantity": 130,
        "unit": "125 g",
        "image_emoji": "🧼",
        "is_veg": True,
        "deal_badge": None,
        "estimated_delivery_time": 18,
    },
]


class Command(BaseCommand):
    help = "Populate the database with everyday Indian grocery staples."

    def add_arguments(self, parser):
        parser.add_argument(
            "--flush",
            action="store_true",
            help="Delete all existing products before seeding.",
        )

    @transaction.atomic
    def handle(self, *args, **options):
        if options["flush"]:
            deleted, _ = Product.objects.all().delete()
            self.stdout.write(self.style.WARNING(f"Flushed {deleted} existing rows."))

        created, updated = 0, 0
        for item in STAPLES:
            name = item.pop("name")
            _, was_created = Product.objects.update_or_create(
                name=name, defaults=item
            )
            # Restore name so the dict can be reused if the command re-runs.
            item["name"] = name
            if was_created:
                created += 1
            else:
                updated += 1

        self.stdout.write(
            self.style.SUCCESS(
                f"Seed complete: {created} created, {updated} updated. "
                f"Catalog now has {Product.objects.count()} products."
            )
        )
