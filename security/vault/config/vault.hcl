storage "file" {
  path = "/workspaces/ft_transcendence/security/vault/data"
}

listener "tcp" {
  address     = "0.0.0.0:8200"
  tls_cert_file = "/workspaces/ft_transcendence/security/ssl/server.crt"
  tls_key_file  = "/workspaces/ft_transcendence/security/ssl/server.key"
}

disable_mlock = true
ui = true
api_addr = "https://0.0.0.0:8200"
cluster_addr = "https://0.0.0.0:8201"
