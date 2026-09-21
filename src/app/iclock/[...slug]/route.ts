import { NextRequest, NextResponse } from "next/server";

const getBackendUrl = () => {
  return (
    process.env.INTERNAL_API_URL?.replace(/\/api\/v1\/?$/, "") ||
    process.env.NEXT_PUBLIC_BACKEND_URL ||
    (process.env.NEXT_PUBLIC_API_URL ? process.env.NEXT_PUBLIC_API_URL.replace(/\/+$/, "").replace(/\/api\/v1\/?$/, "") : "") ||
    "https://api.ischool.mddoulat.com"
  );
};

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string[] }> }
) {
  const { slug } = await params;
  const path = slug.join("/").toLowerCase();
  const searchParams = request.nextUrl.searchParams;
  const sn = searchParams.get("SN") || searchParams.get("sn") || request.headers.get("x-serial-number") || "NYU7254701628";
  const backendUrl = getBackendUrl();

  // 1. Heartbeat & Command Polling (getrequest.php)
  if (path.includes("getrequest")) {
    // Notify Laravel backend in background to update device online status & heartbeat timestamp
    fetch(`${backendUrl}/iclock/getrequest.php?SN=${sn}`, {
      headers: { "Content-Type": "text/plain", "x-serial-number": sn },
    }).catch(() => {});

    // Return OK immediately (< 10ms) to satisfy ZKTeco 2.0s hardware watchdog
    return new NextResponse("OK\n", {
      status: 200,
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache, private",
      },
    });
  }

  // 2. Handshake & Option Query (cdata.php)
  if (path.includes("cdata")) {
    const options = searchParams.get("options") || searchParams.get("pushver");
    if (options || searchParams.has("pushver") || searchParams.has("options")) {
      const optionsResponse =
        `GET OPTION FROM: ${sn}\r\n` +
        `ServerVer=3.4.1\r\n` +
        `ATTLOGStamp=0\r\n` +
        `OPERLOGStamp=0\r\n` +
        `BIODATAStamp=0\r\n` +
        `Realtime=1\r\n` +
        `TransFlag=111111111111\r\n` +
        `ErrorDelay=30\r\n` +
        `Delay=10\r\n` +
        `TransTimes=00:00;14:05\r\n` +
        `TransInterval=1\r\n` +
        `PushProtVer=2.4.1\r\n` +
        `Encrypt=0\r\n` +
        `SupportPing=1\r\n` +
        `PushOptionsFlag=1\r\n`;

      return new NextResponse(optionsResponse, {
        status: 200,
        headers: {
          "Content-Type": "text/plain; charset=utf-8",
          "Cache-Control": "no-cache, private",
        },
      });
    }

    return new NextResponse("OK\n", {
      status: 200,
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache, private",
      },
    });
  }

  // 3. Device Command Ack (devicecmd.php)
  return new NextResponse("OK\n", {
    status: 200,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-cache, private",
    },
  });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string[] }> }
) {
  const { slug } = await params;
  const path = slug.join("/").toLowerCase();
  const searchParams = request.nextUrl.searchParams;
  const sn = searchParams.get("SN") || searchParams.get("sn") || request.headers.get("x-serial-number") || "NYU7254701628";
  const table = (searchParams.get("table") || "").toLowerCase();
  const backendUrl = getBackendUrl();

  const rawBody = await request.text();

  // Acknowledge options/rtstate/operlog instantly
  if (["options", "rtstate", "operlog", "biodatastamp"].includes(table)) {
    return new NextResponse("OK\n", {
      status: 200,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }

  // Forward attendance data (ATTLOG / rtlog) to Laravel backend for student & staff database matching
  if (rawBody.trim()) {
    const queryString = searchParams.toString();
    const targetUrl = `${backendUrl}/iclock/${slug.join("/")}${queryString ? `?${queryString}` : ""}`;

    fetch(targetUrl, {
      method: "POST",
      headers: {
        "Content-Type": "text/plain",
        "x-serial-number": sn,
      },
      body: rawBody,
    }).catch((err) => {
      console.error("[iClock Next.js Proxy] Error forwarding punch packet to backend:", err);
    });
  }

  // Count valid punch lines for precise ADMS terminal acknowledgement
  const lines = rawBody
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith("table=") && !l.startsWith("stamp="));

  const ack = lines.length > 0 ? `OK: ${lines.length}\n` : "OK\n";

  return new NextResponse(ack, {
    status: 200,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-cache, private",
    },
  });
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      Allow: "GET, POST, OPTIONS",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "*",
    },
  });
}
