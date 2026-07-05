import strawberry
from typing import List, Optional

from reviews.models import ReviewItem as ItemModel


VALID_CATEGORIES = {choice.value for choice in ItemModel.Category}
VALID_STATUSES = {choice.value for choice in ItemModel.Status}


def _resolve_category(category: Optional[str]) -> str:
    if category is None or not category.strip():
        return ItemModel.Category.GENERAL
    normalized = category.strip().lower()
    if normalized not in VALID_CATEGORIES:
        valid_list = ", ".join(sorted(VALID_CATEGORIES))
        raise ValueError(f"Invalid category '{category}'. Must be one of: {valid_list}")
    return normalized


def _resolve_decision(decision: str) -> str:
    if not decision or not decision.strip():
        raise ValueError("decision cannot be empty")
    normalized = decision.strip().lower()
    if normalized not in VALID_STATUSES:
        valid_list = ", ".join(sorted(VALID_STATUSES))
        raise ValueError(f"Invalid decision '{decision}'. Must be one of: {valid_list}")
    return normalized


def _to_review_item(item: ItemModel) -> "ReviewItem":
    return ReviewItem(
        id=item.id,
        content=item.content,
        risk_score=item.risk_score,
        status=item.status,
        category=item.category,
    )


@strawberry.type
class ReviewItem:
    id: int
    content: str
    risk_score: int
    status: str
    category: str


@strawberry.type
class Query:
    @strawberry.field
    def items(self) -> List[ReviewItem]:
        return [_to_review_item(i) for i in ItemModel.objects.all()]


@strawberry.type
class Mutation:
    @strawberry.mutation
    def add_item(self, content: str, category: Optional[str] = None) -> ReviewItem:
        if not content or not content.strip():
            raise ValueError("content cannot be empty")
        item = ItemModel.objects.create(
            content=content.strip(),
            category=_resolve_category(category),
        )
        return _to_review_item(item)

    @strawberry.mutation
    def review_item(self, id: int, decision: str) -> ReviewItem:
        try:
            item = ItemModel.objects.get(id=id)
        except ItemModel.DoesNotExist as exc:
            raise ValueError(f"ReviewItem with id {id} not found") from exc
        item.status = _resolve_decision(decision)
        item.save()
        return _to_review_item(item)


schema = strawberry.Schema(query=Query, mutation=Mutation)
