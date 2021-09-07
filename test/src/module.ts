export async function call(msg: string): Promise<boolean> {
  // eslint-disable-next-line no-console
  console.log('inside module:', msg);
  return true;
}
