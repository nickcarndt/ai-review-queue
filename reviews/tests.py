from django.test import TestCase

from reviews.models import ReviewItem
from reviews.schema import schema


class ReviewItemModelTests(TestCase):
    def test_default_category(self):
        item = ReviewItem.objects.create(content="test item")
        self.assertEqual(item.category, ReviewItem.Category.GENERAL)

    def test_explicit_category(self):
        item = ReviewItem.objects.create(
            content="spam post",
            category=ReviewItem.Category.SPAM,
        )
        self.assertEqual(item.category, "spam")


class SchemaTests(TestCase):
    def test_items_query_includes_category(self):
        ReviewItem.objects.create(content="hello", category=ReviewItem.Category.HARASSMENT)
        result = schema.execute_sync(
            "query { items { id content category status riskScore } }"
        )
        self.assertIsNone(result.errors)
        self.assertEqual(len(result.data["items"]), 1)
        self.assertEqual(result.data["items"][0]["category"], "harassment")

    def test_add_item_default_category(self):
        result = schema.execute_sync(
            'mutation { addItem(content: "new item") { id category status } }'
        )
        self.assertIsNone(result.errors)
        self.assertEqual(result.data["addItem"]["category"], "general")
        self.assertEqual(result.data["addItem"]["status"], "pending")

    def test_add_item_explicit_category(self):
        result = schema.execute_sync(
            'mutation { addItem(content: "bad ad", category: "spam") { category } }'
        )
        self.assertIsNone(result.errors)
        self.assertEqual(result.data["addItem"]["category"], "spam")

    def test_add_item_rejects_empty_content(self):
        result = schema.execute_sync(
            'mutation { addItem(content: "   ") { id } }'
        )
        self.assertIsNotNone(result.errors)
        self.assertIn("content cannot be empty", result.errors[0].message)

    def test_add_item_rejects_invalid_category(self):
        result = schema.execute_sync(
            'mutation { addItem(content: "x", category: "not-a-real-category") { id } }'
        )
        self.assertIsNotNone(result.errors)
        self.assertIn("Invalid category", result.errors[0].message)

    def test_review_item_preserves_category(self):
        item = ReviewItem.objects.create(
            content="keep category",
            category=ReviewItem.Category.MISINFORMATION,
        )
        result = schema.execute_sync(
            f'mutation {{ reviewItem(id: {item.id}, decision: "approved") {{ status category }} }}'
        )
        self.assertIsNone(result.errors)
        self.assertEqual(result.data["reviewItem"]["status"], "approved")
        self.assertEqual(result.data["reviewItem"]["category"], "misinformation")

    def test_review_item_not_found(self):
        result = schema.execute_sync(
            'mutation { reviewItem(id: 99999, decision: "approved") { id } }'
        )
        self.assertIsNotNone(result.errors)
        self.assertIn("not found", result.errors[0].message)

    def test_review_item_rejects_invalid_decision(self):
        item = ReviewItem.objects.create(content="test")
        result = schema.execute_sync(
            f'mutation {{ reviewItem(id: {item.id}, decision: "banana") {{ id }} }}'
        )
        self.assertIsNotNone(result.errors)
        self.assertIn("Invalid decision", result.errors[0].message)
