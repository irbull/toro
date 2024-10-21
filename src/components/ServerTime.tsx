import { useEffect, useState } from "preact/hooks";
import type { APIRoute } from "astro";

export default function ServerTime() {
  const [serverTime, setServerTime] = useState("0");
  useEffect(() => {
    const getInitialTime = async () => {
      try {
        const resp = await fetch("/api/get-time");
        setServerTime(await resp.text());
      } catch (e) {
        console.error(e);
      }
    };
    getInitialTime();
  }, []);

  return <span>{serverTime}</span>;
}
