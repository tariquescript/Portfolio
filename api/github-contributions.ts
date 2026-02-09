export const config = {
  runtime: "edge",
};

export default async function handler() {
  const res = await fetch(
    "https://github.com/users/tariquescript/contributions",
    {
      headers: {
        "User-Agent": "Mozilla/5.0",
      },
    }
  );

  const svg = await res.text();

  return new Response(svg, {
    headers: {
      "Content-Type": "image/svg+xml",
      "Cache-Control": "public, max-age=86400",
    },
  });
}
