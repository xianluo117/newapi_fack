export async function onRequest(): Promise<Response> {
  return Response.redirect('/admin/', 302);
}
