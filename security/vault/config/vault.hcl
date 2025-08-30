# Minimal Vault configuration for development
storage "file" {
  path = "/vault/data"
}

listener "tcp" {
  address     = "0.0.0.0:18300"
  tls_disable = 1
}

ui = true
