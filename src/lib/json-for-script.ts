/**
 * A value as the JSON that a script holds. A `</script>` in the value would
 * end the script, whatever it is quoted as, so `<` is written as an escape of
 * its own there.
 */
export function jsonForScript(value: unknown): string {
  return String(JSON.stringify(value)).replace(/</g, '\\u003c');
}
