import vault from 'node-vault';

let secretsCache = null;

export async function getSecrets() {
  // Try Vault first
  try {
    const vaultClient = vault({
      endpoint: process.env.VAULT_ADDR || 'http://127.0.0.1:18300',
      token: process.env.VAULT_TOKEN,
    });
    const result = await vaultClient.read('secret/ft_transcendence');
    secretsCache = result.data;
    return secretsCache;
  } catch (err) {
    // Fallback to .env
    if (!secretsCache) {
      secretsCache = {
        JWT_SECRET: process.env.JWT_SECRET,
        DB_PASSWORD: process.env.DB_PASSWORD,
      };
    }
    return secretsCache;
  }
}

// import vault from 'node-vault';

// const vaultClient = vault({
//   endpoint: process.env.VAULT_ADDR || 'http://127.0.0.1:18300',
//   token: process.env.VAULT_TOKEN, // Set this securely!
// });

// export async function getSecrets() {
//   const result = await vaultClient.read('secret/ft_transcendence');
//   return result.data;
// }