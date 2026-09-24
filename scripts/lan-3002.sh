#!/usr/bin/env bash
# Deja la demo (puerto 3002) alcanzable desde el celular en la misma red Wi-Fi.
#
# Por qué hace falta (design.md L-09): WSL2 corre en modo NAT. Linux tiene una
# IP interna (172.x) que solo ve Windows; el celular solo ve la IP de Windows en
# el Wi-Fi (192.168.x). Windows tiene que reenviar el puerto 3002 hacia WSL
# (netsh interface portproxy) y el firewall tiene que dejar entrar esa conexión.
#
# Este script SOLO LEE el estado de Windows y, si falta algo, GENERA un .ps1 con
# los comandos de administrador. No los ejecuta ni pide permisos: eso lo haces tú.
# No toca las reglas de RUTEANDO (3000, 3001, 9000).
#
# Uso: bash scripts/lan-3002.sh     (o: npm run lan)
set -euo pipefail

PUERTO=3002
REGLA="Boton-ancla dev (LAN)"

ps() { powershell.exe -NoProfile -Command "$1" 2>/dev/null | tr -d '\r'; }

titulo() { printf '\n\033[1;36m== %s\033[0m\n' "$1"; }

# 1. IPs -----------------------------------------------------------------------
titulo "IPs"
WSL_IP="$(hostname -I | awk '{print $1}')"
LAN_IP="$(ps "(Get-NetIPConfiguration | Where-Object { \$_.IPv4DefaultGateway -ne \$null -and \$_.NetAdapter.Status -eq 'Up' } | Select-Object -First 1 -ExpandProperty IPv4Address).IPAddress" | tr -d '\n')"
if [ -z "$WSL_IP" ]; then
  echo "No se pudo leer la IP interna de WSL." >&2
  exit 1
fi
if [ -z "$LAN_IP" ]; then
  echo "No se pudo leer la IP de Windows en la red (¿powershell.exe disponible desde WSL?)." >&2
  exit 1
fi
echo "IP interna de WSL:        $WSL_IP"
echo "IP de Windows en el Wi-Fi: $LAN_IP"

# 2. Estado actual (solo lectura) -------------------------------------------------
titulo "Estado actual en Windows"
PROXY="$(ps "netsh interface portproxy show v4tov4")"
if echo "$PROXY" | grep -qE "0\.0\.0\.0[[:space:]]+$PUERTO[[:space:]]+$WSL_IP[[:space:]]+$PUERTO"; then
  PROXY_OK=1
  echo "Reenvío del $PUERTO: correcto (→ $WSL_IP)."
elif echo "$PROXY" | grep -qE "0\.0\.0\.0[[:space:]]+$PUERTO[[:space:]]"; then
  PROXY_OK=0
  echo "Reenvío del $PUERTO: existe, pero apunta a una IP vieja de WSL."
else
  PROXY_OK=0
  echo "Reenvío del $PUERTO: no existe."
fi

FW="$(ps "if (Get-NetFirewallRule -DisplayName '$REGLA' -ErrorAction SilentlyContinue) { 'si' } else { 'no' }" | tr -d '\n')"
if [ "$FW" = "si" ]; then
  FW_OK=1
  echo "Regla del firewall \"$REGLA\": existe."
else
  FW_OK=0
  echo "Regla del firewall \"$REGLA\": no existe."
fi

if [ "$PROXY_OK" -eq 1 ] && [ "$FW_OK" -eq 1 ]; then
  titulo "Listo, no hay que hacer nada en Windows"
  echo "Con la demo corriendo (npm run dev -w demo), abre en el celular:"
  echo "    http://$LAN_IP:$PUERTO"
  exit 0
fi

# 3. Generar el .ps1 (no se ejecuta) ---------------------------------------------
WIN_HOME="$(ps '$env:USERPROFILE' | tr -d '\n')"
PS1_WIN="${WIN_HOME}\\boton-ancla-lan-${PUERTO}.ps1"
PS1_WSL="$(wslpath -u "$PS1_WIN")"

cat >"$PS1_WSL" <<EOF
# Generado por boton-ancla/scripts/lan-3002.sh - ejecutar en PowerShell como administrador.
# Reenvia el puerto $PUERTO de Windows hacia WSL ($WSL_IP) y abre el firewall solo para la red local.
# Se puede ejecutar varias veces: borra lo anterior antes de crear lo nuevo.
# (Solo caracteres ASCII: Windows PowerShell 5.1 lee los .ps1 sin BOM como ANSI.)
netsh interface portproxy delete v4tov4 listenaddress=0.0.0.0 listenport=$PUERTO 2>\$null | Out-Null
netsh interface portproxy add v4tov4 listenaddress=0.0.0.0 listenport=$PUERTO connectaddress=$WSL_IP connectport=$PUERTO
Remove-NetFirewallRule -DisplayName '$REGLA' -ErrorAction SilentlyContinue
New-NetFirewallRule -DisplayName '$REGLA' -Direction Inbound -Protocol TCP -LocalPort $PUERTO -RemoteAddress LocalSubnet -Action Allow | Out-Null
netsh interface portproxy show v4tov4
Write-Host ''
Write-Host 'Listo. Desde el celular: http://$LAN_IP:$PUERTO'
EOF

titulo "Falta configurar Windows (lo haces tú, como administrador)"
echo "Se generó: $PS1_WIN"
echo
echo "Opción A — ejecutar el archivo. En PowerShell abierto como administrador:"
echo "    powershell -NoProfile -ExecutionPolicy Bypass -File \"$PS1_WIN\""
echo
echo "Opción B — pegar los comandos uno por uno en PowerShell como administrador:"
sed -n '/^netsh\|^Remove\|^New/p' "$PS1_WSL" | sed 's/^/    /'
echo
echo "Después vuelve a correr este script para confirmar: bash scripts/lan-3002.sh"
