export function hashPassword(
  password: string,
  salt: Uint8Array | number[]
): Promise<{ hash: string; salt: string }> {
  return new Promise((resolve, reject) => {
    try {
      // Encode the password and salt
      const encoder = new TextEncoder();
      const passwordData = encoder.encode(password);

      // Combine password with salt
      const combinedData = new Uint8Array(passwordData.length + salt.length);
      combinedData.set(passwordData);
      combinedData.set(salt, passwordData.length);

      // Hash with SHA-256 (fast but still secure when properly salted)
      crypto.subtle
        .digest("SHA-256", combinedData)
        .then((hashBuffer) => {
          // Convert to Base64 for more compact storage
          const hashArray = new Uint8Array(hashBuffer);

          // Handle potential issues with large TypedArrays in fromCharCode
          let hashBase64, saltBase64;
          try {
            hashBase64 = btoa(String.fromCharCode(...hashArray));
            saltBase64 = btoa(String.fromCharCode(...salt));

            resolve({
              hash: hashBase64,
              salt: saltBase64,
            });
          } catch {
            reject(new Error(`Base64 encoding error`));
          }
        })
        .catch((error) => {
          reject(new Error(`Hashing error: ${error.message}`));
        });
    } catch {
      reject(new Error(`Setup error`));
    }
  });
}
