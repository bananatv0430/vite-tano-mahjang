export class Router {
  constructor() {
    this.routes = [];
  }

  /**
   * プレフィックスをつけて別ルーターを登録する
   */
  mount(prefix, routeModule) {
    for (const route of routeModule.routes) {
      this.routes.push({
        method: route.method,
        path: prefix + route.path,
        handler: route.handler,
      });
    }
  }

  /**
   * リクエストを処理する
   */
  async handle(request, env, ctx) {
    try {
      // リクエスト受信ログ
      console.log(`[Router] ${request.method} ${request.url}`);

      const url = new URL(request.url);
      const pathname = url.pathname;
      const method = request.method.toUpperCase();

      for (const route of this.routes) {
        if (method !== route.method) continue;

        // パラメータ対応（:id）
        const match = this.matchPath(route.path, pathname);
        if (match) {
          const params = match.params;
          const body = await this.parseBody(request);

          return route.handler({
            request,
            env,
            ctx,
            params,
            query: url.searchParams,
            body,
          });
        }
      }

      return new Response(
        JSON.stringify({ error: "Not Found" }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    } catch (e) {
      // エラー発生時は必ずログ出力
      console.error('[Router][ERROR]', e);
      return new Response(
        JSON.stringify({ error: e.message, stack: e.stack }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }
  }

  /**
   * ルートパスと実パスのマッチング
   */
  matchPath(routePath, requestPath) {
    const routeParts = routePath.split("/").filter(Boolean);
    const reqParts = requestPath.split("/").filter(Boolean);

    if (routeParts.length !== reqParts.length) return null;

    const params = {};

    for (let i = 0; i < routeParts.length; i++) {
      if (routeParts[i].startsWith(":")) {
        const key = routeParts[i].slice(1);
        params[key] = reqParts[i];
      } else if (routeParts[i] !== reqParts[i]) {
        return null;
      }
    }

    return { params };
  }

  /**
   * JSON / multipart / text を自動パース
   */
  async parseBody(request) {
    const method = request.method.toUpperCase();
    if (method === "GET") return null;
    const type = request.headers.get("content-type") || "";

    if (type.includes("application/json")) {
      try {
        return await request.json();
      } catch {
        return null;
      }
    }

    if (type.includes("multipart/form-data")) {
      return await request.formData();
    }

    try {
      return await request.text();
    } catch {
      return null;
    }
  }
}