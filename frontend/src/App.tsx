import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { gql } from "./api";

type Item = {
  id: number;
  content: string;
  status: string;
  riskScore: number;
  category: string;
};

const CATEGORIES = [
  { value: "general", label: "General" },
  { value: "spam", label: "Spam" },
  { value: "harassment", label: "Harassment" },
  { value: "misinformation", label: "Misinformation" },
  { value: "other", label: "Other" },
] as const;

const DEFAULT_CATEGORY = CATEGORIES[0].value;

export default function App() {
  const queryClient = useQueryClient();
  const [content, setContent] = useState("");
  const [category, setCategory] = useState<string>(DEFAULT_CATEGORY);

  const { data, isPending, error } = useQuery({
    queryKey: ["items"],
    queryFn: async () => {
      const d = await gql(
        `query { items { id content status riskScore category } }`
      );
      return d.items as Item[];
    },
  });

  const addItem = useMutation({
    mutationFn: ({ content, category }: { content: string; category: string }) =>
      gql(
        `mutation($c: String!, $cat: String) { addItem(content: $c, category: $cat) { id category } }`,
        { c: content, cat: category }
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["items"] });
      setContent("");
      setCategory(DEFAULT_CATEGORY);
    },
  });

  const reviewItem = useMutation({
    mutationFn: ({ id, decision }: { id: number; decision: string }) =>
      gql(
        `mutation($id: Int!, $d: String!) { reviewItem(id: $id, decision: $d) { id status category } }`,
        { id, d: decision }
      ),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["items"] }),
  });

  if (isPending) return <p style={{ textAlign: "center" }}>Loading...</p>;
  if (error) return <p style={{ textAlign: "center" }}>Error: {(error as Error).message}</p>;

  const items = data ?? [];

  return (
    <div style={{ maxWidth: 600, margin: "40px auto", fontFamily: "sans-serif" }}>
      <h1>AI Review Queue</h1>
      <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
        <input
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="New item to review"
          style={{ flex: 1, padding: 8 }}
        />
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          style={{ padding: 8 }}
          aria-label="Category"
        >
          {CATEGORIES.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </select>
        <button
          onClick={() => addItem.mutate({ content: content.trim(), category })}
          disabled={!content.trim() || addItem.isPending}
        >
          Add
        </button>
      </div>
      {items.length === 0 ? (
        <p style={{ color: "#666" }}>No items yet.</p>
      ) : (
        <ul style={{ listStyle: "none", padding: 0 }}>
          {items.map((item) => (
            <li
              key={item.id}
              style={{
                border: "1px solid #ddd",
                borderRadius: 8,
                padding: 12,
                marginBottom: 8,
              }}
            >
              <div><b>{item.content}</b></div>
              <div style={{ fontSize: 13, color: "#666" }}>
                status: {item.status} · risk: {item.riskScore} · category: {item.category}
              </div>
              <div style={{ marginTop: 8, display: "flex", gap: 6 }}>
                <button
                  onClick={() => reviewItem.mutate({ id: item.id, decision: "approved" })}
                  disabled={reviewItem.isPending}
                >
                  Approve
                </button>
                <button
                  onClick={() => reviewItem.mutate({ id: item.id, decision: "removed" })}
                  disabled={reviewItem.isPending}
                >
                  Remove
                </button>
                <button
                  onClick={() => reviewItem.mutate({ id: item.id, decision: "escalated" })}
                  disabled={reviewItem.isPending}
                >
                  Escalate
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
