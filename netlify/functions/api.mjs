process.env.NETLIFY = process.env.NETLIFY || "true";
process.env.PHAKATHI_EMBEDDED_API = "true";

import serverless from "serverless-http";

let lambdaHandler;
let appModule;

function headersToObject(headers) {
  return Object.fromEntries(headers.entries());
}

function queryToObject(searchParams) {
  const result = {};
  for (const [key, value] of searchParams.entries()) result[key] = value;
  return result;
}

export default async (request, context) => {
  try {
    appModule ||= await import("../../backend/src/index.js");
    await appModule.prepareApp();
    lambdaHandler ||= serverless(appModule.app);

    const url = new URL(request.url);
    const body = ["GET", "HEAD"].includes(request.method) ? undefined : await request.text();
    const event = {
      httpMethod: request.method,
      path: url.pathname,
      rawUrl: request.url,
      rawQuery: url.search.slice(1),
      queryStringParameters: queryToObject(url.searchParams),
      headers: headersToObject(request.headers),
      body,
      isBase64Encoded: false,
    };

    const result = await lambdaHandler(event, context);
    return new Response(result.body || "", {
      status: result.statusCode || 200,
      headers: result.headers || {},
    });
  } catch (error) {
    console.error("Phakathi Flow API function failed", error);
    return Response.json({
      ok: false,
      message: error.message || "API function failed",
      name: error.name || "Error",
    }, { status: 500 });
  }
};

export const config = {
  path: "/api/*",
};
