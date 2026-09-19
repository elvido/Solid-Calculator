/**
 * Resolves the path sent to a configured proxy target.
 *
 * The most specific matching route wins. A proxy can either remove its route
 * prefix with stripPrefix or replace the path with an explicit rewrite. The
 * original query string is preserved in both cases.
 */
export function rewriteProxyPath(requestPath, requestUrl, proxy) {
  const pathname = (requestUrl || requestPath || '').split('?')[0];
  const proxyRoutes = Object.keys(proxy || {}).sort((a, b) => b.length - a.length);
  const route = proxyRoutes.find((candidate) => pathname === candidate || pathname.startsWith(candidate + '/'));
  const config = route ? proxy[route] : undefined;
  const query = requestPath.includes('?') ? requestPath.slice(requestPath.indexOf('?')) : '';

  if (!route || !config) return requestPath;
  if (config.rewrite) return config.rewrite + query;
  if (!config.stripPrefix) return requestPath;

  return (pathname.slice(route.length) || '/') + query;
}
