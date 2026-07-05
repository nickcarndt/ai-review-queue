import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { gql } from "./api";

type Item = { id: number; content: string; status: string; riskScore: number };

export default function App() {
  const queryClient = useQueryClient();
  const [content, setContent] = useState("");

  const { data, isPending, error } = useQuery({
    queryKey: ["items"],
    queryFn: async () => {
      const d = await gql(`query { items { id content status riskScore } }`);
      return d.items as Item[];
    },
  });

  const addItem = useMutation({
    mutationFn: (content: string) =>
      gql(`mutation($c: String!) { addItem(content: $c) { id } }`, { c: content }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["items"] });
      setContent("");
    },
  });

  const reviewItem = useMutation({
    mutationFn: ({ id, decision }: { id: number; decision: string }) =>
      gql(`mutation($id: Int!, $d: String!) { reviewItem(id: $id, decision: $d) { id status } }`, { id, d: decision }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["items"] }),
  });

  if (isPending) return <p style={{ textAlign: "center" }}>Loading...</p>;
  if (error) return <p style={{ textAlign: "center" }}>Error: {(error as Error).message}</p>;

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
        <button onClick={() => addItem.mutate(content)} disabled={!content}>Add</button>
      </div>
      <ul style={{ listStyle: "none", padding: 0 }}>
        {data.map((item) => (
          <li key={item.id} style={{ border: "1px solid #ddd", borderRadius: 8, padding: 12, marginBottom: 8 }}>
            <div><b>{item.content}</b></div>
            <div style={{ fontSize: 13, color: "#666" }}>status: {item.status} · risk: {item.riskScore}</div>
            <div style={{ marginTop: 8, display: "flex", gap: 6 }}>
              <button onClick={() => reviewItem.mutate({ id: item.id, decision: "approved" })}>Approve</button>
              <button onClick={() => reviewItem.mutate({ id: item.id, decision: "removed" })}>Remove</button>
              <button onClick={() => reviewItem.mutate({ id: item.id, decision: "escalated" })}>Escalate</button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
