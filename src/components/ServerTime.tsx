import { useState } from "preact/hooks";
import type { APIRoute } from "astro";

const getServerTime: APIRoute = () => {
  const currentTime = new Date().toISOString();
  return new Response(currentTime, {
    headers: {
      "content-type": "text/plain",
    },
  });
};

export default function ServerTime() {
  const [serverTime, setServerTime] = useState("0");

  const getInitialTime = async () => {
    const resp = await getServerTime();
    setServerTime(await resp.text());
  };
  getInitialTime();

  return <span>{serverTime}</span>;
}
