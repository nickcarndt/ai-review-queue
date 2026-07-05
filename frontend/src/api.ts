export async function gql(query: string, variables: Record<string, unknown> = {}) {
  const res = await fetch("http://localhost:8000/graphql", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query, variables }),
  });

  let json: { data?: Record<string, unknown>; errors?: { message: string }[] };
  try {
    json = await res.json();
  } catch {
    throw new Error(`Invalid JSON response (HTTP ${res.status})`);
  }

  if (!res.ok) {
    throw new Error(json.errors?.[0]?.message ?? `HTTP ${res.status}`);
  }
  if (json.errors?.length) {
    throw new Error(json.errors[0].message);
  }
  if (!json.data) {
    throw new Error("GraphQL response missing data");
  }

  return json.data;
}
