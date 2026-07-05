import strawberry
from typing import List
from reviews.models import ReviewItem as ItemModel


@strawberry.type
class ReviewItem:
    id: int
    content: str
    risk_score: int
    status: str


@strawberry.type
class Query:
    @strawberry.field
    def items(self) -> List[ReviewItem]:
        return [
            ReviewItem(id=i.id, content=i.content, risk_score=i.risk_score, status=i.status)
            for i in ItemModel.objects.all()
        ]


@strawberry.type
class Mutation:
    @strawberry.mutation
    def add_item(self, content: str) -> ReviewItem:
        i = ItemModel.objects.create(content=content)
        return ReviewItem(id=i.id, content=i.content, risk_score=i.risk_score, status=i.status)

    @strawberry.mutation
    def review_item(self, id: int, decision: str) -> ReviewItem:
        i = ItemModel.objects.get(id=id)
        i.status = decision
        i.save()
        return ReviewItem(id=i.id, content=i.content, risk_score=i.risk_score, status=i.status)


schema = strawberry.Schema(query=Query, mutation=Mutation)
