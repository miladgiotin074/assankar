#!/usr/bin/env bash
# نصب، گواهی SSL و به‌روزرسانی آسان‌کار روی اوبونتو.
#
# پیش از اجرا، رکورد A دامنه باید به IP همین سرور اشاره کند.
#
# نصب اول:
#   curl -fsSL https://raw.githubusercontent.com/miladgiotin074/assankar/main/deploy.sh -o deploy.sh
#   sudo bash deploy.sh
#   sudo bash deploy.sh example.com
#
# به‌روزرسانی، با همین فایل:
#   sudo bash deploy.sh

set -euo pipefail

export DEBIAN_FRONTEND=noninteractive

APP_DIR=/opt/assankar
APP_USER=assankar
REPO=https://github.com/miladgiotin074/assankar.git
BRANCH=main
ENV_FILE="${APP_DIR}/.env.production"
SERVICE_NAME=assankar
NGINX_SITE=/etc/nginx/sites-available/assankar
NODE_MAJOR=22

if [[ "${EUID}" -ne 0 ]]; then
  echo "این اسکریپت را با sudo اجرا کنید."
  exit 1
fi

if [[ ! -f /etc/os-release ]]; then
  echo "این اسکریپت فقط برای اوبونتو است."
  exit 1
fi

# shellcheck disable=SC1091
. /etc/os-release
if [[ "${ID:-}" != "ubuntu" ]]; then
  echo "این اسکریپت فقط برای اوبونتو است."
  exit 1
fi

case "${VERSION_CODENAME:-}" in
  focal|jammy|noble)
    MONGO_VERSION=8.0
    MONGO_CODENAME="${VERSION_CODENAME}"
    MONGO_KEY=https://pgp.mongodb.com/server-8.0.asc
    MONGO_KEYRING=/usr/share/keyrings/mongodb-server-8.0.gpg
    ;;
  resolute)
    MONGO_VERSION=9.0
    MONGO_CODENAME=resolute
    MONGO_KEY=https://pgp.mongodb.com/server-9.asc
    MONGO_KEYRING=/usr/share/keyrings/mongodb-server-9.gpg
    ;;
  *)
    echo "اوبونتو ${VERSION_ID:-ناشناخته} پشتیبانی نمی‌شود. نسخه‌های ۲۰.۰۴، ۲۲.۰۴، ۲۴.۰۴ یا ۲۶.۰۴ لازم است."
    exit 1
    ;;
esac

log() {
  printf '\n== %s\n' "$1"
}

git_app() {
  git -c safe.directory="${APP_DIR}" -C "${APP_DIR}" "$@"
}

as_app() {
  sudo -u "${APP_USER}" env HOME=/var/lib/assankar npm_config_cache=/var/lib/assankar/.npm "$@"
}

normalize_domain() {
  local value="$1"
  value="${value#http://}"
  value="${value#https://}"
  value="${value%%/*}"
  value="${value%%:*}"
  printf '%s' "${value,,}"
}

valid_domain() {
  [[ "$1" =~ ^([a-z0-9](-?[a-z0-9])*\.)+[a-z]{2,}$ ]]
}

ensure_swap() {
  local available
  available="$(awk '/MemAvailable/ {print $2}' /proc/meminfo)"
  if [[ "${available}" -ge 1500000 || -n "$(swapon --noheadings)" ]]; then
    return
  fi
  log "افزودن فضای swap برای ساخت اپ"
  fallocate -l 2G /swapfile || dd if=/dev/zero of=/swapfile bs=1M count=2048 status=none
  chmod 600 /swapfile
  mkswap /swapfile >/dev/null
  swapon /swapfile
  grep -q '/swapfile' /etc/fstab || echo '/swapfile none swap sw 0 0' >> /etc/fstab
}

install_base() {
  log "نصب پیش‌نیازها"
  apt-get update
  apt-get install -y ca-certificates curl gnupg git nginx certbot python3-certbot-nginx ufw openssl
}

install_node() {
  if command -v node >/dev/null 2>&1; then
    local major
    major="$(node -p 'process.versions.node.split(".")[0]')"
    if [[ "${major}" -ge 20 ]]; then
      return
    fi
  fi
  log "نصب Node.js ${NODE_MAJOR}"
  curl -fsSL "https://deb.nodesource.com/setup_${NODE_MAJOR}.x" | bash -
  apt-get install -y nodejs
}

install_mongo() {
  if command -v mongod >/dev/null 2>&1 && systemctl is-active --quiet mongod; then
    systemctl enable mongod
    return
  fi
  log "نصب MongoDB"
  apt-get remove -y mongodb mongodb-server >/dev/null 2>&1 || true
  install -d -m 0755 /usr/share/keyrings
  if [[ ! -f "${MONGO_KEYRING}" ]]; then
    curl -fsSL "${MONGO_KEY}" | gpg --dearmor -o "${MONGO_KEYRING}"
    chmod 644 "${MONGO_KEYRING}"
  fi
  echo "deb [ arch=amd64,arm64 signed-by=${MONGO_KEYRING} ] https://repo.mongodb.org/apt/ubuntu ${MONGO_CODENAME}/mongodb-org/${MONGO_VERSION} multiverse" \
    > "/etc/apt/sources.list.d/mongodb-org-${MONGO_VERSION}.list"
  apt-get update
  apt-get install -y mongodb-org
  systemctl enable --now mongod
}

ensure_user() {
  if ! id "${APP_USER}" >/dev/null 2>&1; then
    useradd --system --create-home --home-dir /var/lib/assankar --shell /usr/sbin/nologin "${APP_USER}"
  fi
  install -d -o "${APP_USER}" -g "${APP_USER}" /var/lib/assankar /var/lib/assankar/.npm
}

sync_code() {
  log "گرفتن کد از گیت‌هاب"
  if [[ -d "${APP_DIR}/.git" ]]; then
    git_app fetch origin "${BRANCH}"
    git_app checkout "${BRANCH}"
    git_app pull --ff-only origin "${BRANCH}"
  elif [[ -e "${APP_DIR}" ]]; then
    echo "${APP_DIR} وجود دارد ولی مخزن گیت نیست."
    exit 1
  else
    git clone --branch "${BRANCH}" "${REPO}" "${APP_DIR}"
  fi
  chown -R "${APP_USER}:${APP_USER}" "${APP_DIR}"
}

ask_domain() {
  local raw=""
  if [[ "${1:-}" != "" ]]; then
    raw="$1"
  elif [[ -r /dev/tty ]]; then
    read -r -p "آدرس دامنه را وارد کنید: " raw < /dev/tty
  else
    echo "دامنه را به‌صورت آرگومان بدهید: sudo bash deploy.sh example.com"
    exit 1
  fi
  DOMAIN="$(normalize_domain "${raw}")"
  if ! valid_domain "${DOMAIN}"; then
    echo "دامنه معتبر نیست: ${raw}"
    exit 1
  fi
}

env_get() {
  local key="$1"
  if [[ ! -f "${ENV_FILE}" ]]; then
    return 0
  fi
  grep -E "^${key}=" "${ENV_FILE}" | head -n 1 | cut -d= -f2- || true
}

env_set() {
  local key="$1"
  local value="$2"
  local tmp
  touch "${ENV_FILE}"
  tmp="$(mktemp)"
  if grep -qE "^${key}=" "${ENV_FILE}"; then
    awk -v key="${key}" -v value="${value}" '
      BEGIN { found = 0 }
      index($0, key "=") == 1 {
        print key "=" value
        found = 1
        next
      }
      { print }
      END {
        if (!found) print key "=" value
      }
    ' "${ENV_FILE}" > "${tmp}"
  else
    cat "${ENV_FILE}" > "${tmp}"
    printf '%s=%s\n' "${key}" "${value}" >> "${tmp}"
  fi
  mv "${tmp}" "${ENV_FILE}"
  chown "${APP_USER}:${APP_USER}" "${ENV_FILE}"
  chmod 600 "${ENV_FILE}"
}

ask_admin_telegram() {
  local token=""
  local admin_ids=""
  local current_token current_ids

  current_token="$(env_get BOT_TOKEN)"
  current_ids="$(env_get ADMIN_TELEGRAM_IDS)"

  if [[ -n "${current_token}" && -n "${current_ids}" ]]; then
    if [[ -r /dev/tty ]]; then
      echo "توکن بات و آی‌دی ادمین از قبل تنظیم شده‌اند."
      read -r -p "می‌خواهید دوباره وارد کنید؟ (y/N): " redo < /dev/tty || true
      if [[ ! "${redo:-}" =~ ^[Yy]$ ]]; then
        return
      fi
    else
      return
    fi
  fi

  if [[ ! -r /dev/tty ]]; then
    echo "برای ست کردن BOT_TOKEN و ADMIN_TELEGRAM_IDS ترمینال تعاملی لازم است."
    exit 1
  fi

  echo
  echo "تنظیم پنل مدیریت تلگرام (/admin)"
  if [[ -n "${current_token}" ]]; then
    read -r -p "توکن بات تلگرام [Enter = بدون تغییر]: " token < /dev/tty
    if [[ -z "${token}" ]]; then
      token="${current_token}"
    fi
  else
    read -r -p "توکن بات تلگرام (BotFather): " token < /dev/tty
  fi
  token="$(printf '%s' "${token}" | tr -d '[:space:]')"
  if [[ -z "${token}" || "${token}" != *:* ]]; then
    echo "توکن بات معتبر نیست."
    exit 1
  fi

  if [[ -n "${current_ids}" ]]; then
    read -r -p "آی‌دی عددی ادمین(ها) [فعلی: ${current_ids}]: " admin_ids < /dev/tty
    if [[ -z "${admin_ids}" ]]; then
      admin_ids="${current_ids}"
    fi
  else
    read -r -p "آی‌دی عددی تلگرام ادمین (چندتایی با کاما): " admin_ids < /dev/tty
  fi
  admin_ids="$(printf '%s' "${admin_ids}" | tr -d '[:space:]')"
  if [[ ! "${admin_ids}" =~ ^[0-9]+(,[0-9]+)*$ ]]; then
    echo "آی‌دی ادمین باید عددی باشد؛ چند ادمین را با کاما جدا کنید."
    exit 1
  fi

  env_set BOT_TOKEN "${token}"
  env_set ADMIN_TELEGRAM_IDS "${admin_ids}"
  if [[ -z "$(env_get ADMIN_SESSION_SECRET)" ]]; then
    env_set ADMIN_SESSION_SECRET "$(openssl rand -base64 32)"
  fi
}

write_env() {
  if [[ -f "${ENV_FILE}" ]]; then
    ask_admin_telegram
    return
  fi
  local secret admin_secret
  secret="$(openssl rand -base64 32)"
  admin_secret="$(openssl rand -base64 32)"
  install -d -o "${APP_USER}" -g "${APP_USER}" "${APP_DIR}"
  cat > "${ENV_FILE}" <<EOF
NODE_ENV=production
MONGODB_URI=mongodb://127.0.0.1:27017
MONGODB_DB=assankar
AUTH_SECRET=${secret}
ADMIN_SESSION_SECRET=${admin_secret}
NEXT_PUBLIC_SITE_URL=https://${DOMAIN}
EOF
  chown "${APP_USER}:${APP_USER}" "${ENV_FILE}"
  chmod 600 "${ENV_FILE}"
  ask_admin_telegram
}

read_domain() {
  local site
  site="$(grep -E '^NEXT_PUBLIC_SITE_URL=' "${ENV_FILE}" | head -n 1 | cut -d= -f2-)"
  DOMAIN="$(normalize_domain "${site}")"
  if ! valid_domain "${DOMAIN}"; then
    echo "دامنه در ${ENV_FILE} پیدا نشد."
    exit 1
  fi
}

build_app() {
  log "ساخت اپ"
  as_app npm --prefix "${APP_DIR}" ci
  as_app npm --prefix "${APP_DIR}" run build
}

write_service() {
  local npm_bin
  npm_bin="$(command -v npm)"
  cat > "/etc/systemd/system/${SERVICE_NAME}.service" <<EOF
[Unit]
Description=AssanKar
After=network.target mongod.service
Wants=mongod.service

[Service]
Type=simple
User=${APP_USER}
Group=${APP_USER}
WorkingDirectory=${APP_DIR}
Environment=NODE_ENV=production
EnvironmentFile=${ENV_FILE}
ExecStart=${npm_bin} run start -- -H 127.0.0.1 -p 3000
Restart=always
RestartSec=3
NoNewPrivileges=true

[Install]
WantedBy=multi-user.target
EOF
  systemctl daemon-reload
  systemctl enable "${SERVICE_NAME}"
}

write_nginx() {
  if [[ -f "${NGINX_SITE}" ]]; then
    return
  fi
  cat > "${NGINX_SITE}" <<EOF
server {
    listen 80;
    listen [::]:80;
    server_name ${DOMAIN};

    client_max_body_size 8m;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
EOF
  ln -sfn "${NGINX_SITE}" /etc/nginx/sites-enabled/assankar
  rm -f /etc/nginx/sites-enabled/default
  nginx -t
  systemctl enable nginx
  systemctl reload nginx
}

open_firewall() {
  ufw allow OpenSSH
  ufw allow 80/tcp
  ufw allow 443/tcp
  ufw --force enable
}

obtain_cert() {
  if [[ -d "/etc/letsencrypt/live/${DOMAIN}" ]]; then
    certbot renew --quiet || true
    return
  fi
  log "دریافت گواهی SSL برای ${DOMAIN}"
  certbot --nginx -d "${DOMAIN}" --non-interactive --agree-tos --register-unsafely-without-email --redirect
}

start_app() {
  systemctl restart "${SERVICE_NAME}"
  systemctl is-active --quiet "${SERVICE_NAME}"
}

install_all() {
  ensure_swap
  install_base
  install_node
  install_mongo
  ensure_user
  ask_domain "${1:-}"
  sync_code
  write_env
  build_app
  write_service
  write_nginx
  open_firewall
  start_app
  obtain_cert
  systemctl reload nginx
  echo
  echo "آسان‌کار روی https://${DOMAIN} در حال اجراست."
  echo "پنل ادمین Mini App: https://${DOMAIN}/admin"
  echo "در BotFather آدرس Mini App را روی همان /admin بگذارید."
  echo "برای به‌روزرسانی بعدی همین دستور را دوباره بزنید: sudo bash deploy.sh"
}

update_all() {
  read_domain
  ensure_swap
  install_base
  install_node
  install_mongo
  ensure_user
  sync_code
  ask_admin_telegram
  build_app
  write_service
  write_nginx
  start_app
  obtain_cert
  systemctl reload nginx
  echo
  echo "آسان‌کار به‌روز شد: https://${DOMAIN}"
  echo "پنل ادمین: https://${DOMAIN}/admin"
}

if [[ -f "${ENV_FILE}" && -d "${APP_DIR}/.git" ]]; then
  update_all
else
  install_all "${1:-}"
fi
