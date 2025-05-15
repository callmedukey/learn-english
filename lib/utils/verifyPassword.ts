export function verifyPassword(
  inputPassword: string,
  storedHash: string,
  storedSalt: string
): Promise<boolean> {
  return new Promise((resolve, reject) => {
    try {
      // Convert the stored salt from Base64 back to Uint8Array
      const saltString = atob(storedSalt);
      const salt = new Uint8Array(saltString.length);
      for (let i = 0; i < saltString.length; i++) {
        salt[i] = saltString.charCodeAt(i);
      }

      // Hash the input password with the same salt
      const encoder = new TextEncoder();
      const passwordData = encoder.encode(inputPassword);

      // Combine password with salt
      const combinedData = new Uint8Array(passwordData.length + salt.length);
      combinedData.set(passwordData);
      combinedData.set(salt, passwordData.length);

      // Hash with SHA-256
      crypto.subtle
        .digest("SHA-256", combinedData)
        .then((hashBuffer) => {
          // Convert to Base64
          const hashArray = new Uint8Array(hashBuffer);
          const hashBase64 = btoa(String.fromCharCode(...hashArray));

          // Compare the calculated hash with the stored hash
          resolve(hashBase64 === storedHash);
        })
        .catch((error) => {
          reject(new Error(`Verification error: ${error.message}`));
        });
    } catch {
      reject(new Error(`Setup error`));
    }
  });
}
