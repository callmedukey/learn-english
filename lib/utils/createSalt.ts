export default function createSalt() {
  return crypto.getRandomValues(new Uint8Array(16));
}
