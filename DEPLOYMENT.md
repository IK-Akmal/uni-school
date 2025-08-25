# CI/CD Deployment Guide

## Настройка CI/CD для School Management System

Этот проект настроен для автоматической сборки и развертывания с использованием GitHub Actions.

## Структура CI/CD

### 1. Build Workflow (`.github/workflows/build.yml`)
- **Триггеры**: Push в `main`/`develop`, Pull Request в `main`
- **Платформы**: Windows, macOS, Ubuntu
- **Функции**:
  - Установка зависимостей
  - Сборка frontend и Tauri приложения
  - Тестирование на всех платформах

### 2. Release Workflow (`.github/workflows/release.yml`)
- **Триггер**: Push тега `v*` (например, `v1.0.0`)
- **Функции**:
  - Создание GitHub Release
  - Сборка приложения для всех платформ
  - Генерация ключей для updater
  - Подпись бинарных файлов
  - Публикация релиза

### 3. Updater Workflow (`.github/workflows/updater.yml`)
- **Триггер**: Публикация релиза
- **Функции**:
  - Создание `latest.json` для Tauri Updater
  - Загрузка файла в релиз

## Настройка Secrets

Для работы CI/CD необходимо настроить следующие секреты в GitHub:

### 1. Генерация ключей для updater
```bash
# Установите Tauri CLI
npm install -g @tauri-apps/cli@latest

# Сгенерируйте ключи
tauri signer generate

# Это создаст два файла:
# - tauri-updater.key (приватный ключ)
# - tauri-updater.key.pub (публичный ключ)
```

### 2. Добавление секретов в GitHub
Перейдите в Settings → Secrets and variables → Actions и добавьте:

- **`TAURI_PRIVATE_KEY`**: Содержимое файла `tauri-updater.key`
- **`TAURI_KEY_PASSWORD`**: Пароль для ключа (если установлен)

### 3. Обновление публичного ключа в конфигурации
Скопируйте содержимое `tauri-updater.key.pub` и обновите поле `pubkey` в `src-tauri/tauri.conf.json`.

## Процесс релиза

### 1. Создание релиза
```bash
# Обновите версию в package.json
npm version patch  # или minor/major

# Создайте и отправьте тег
git push origin main --tags
```

### 2. Автоматический процесс
1. GitHub Actions создаст draft релиз
2. Соберет приложение для всех платформ
3. Подпишет бинарные файлы
4. Опубликует релиз
5. Создаст `latest.json` для updater

## Структура релиза

Каждый релиз будет содержать:
- **Windows**: `.msi` установщик + `.sig` подпись
- **macOS**: `.app.tar.gz` архив + `.sig` подпись  
- **Linux**: `.AppImage.tar.gz` архив + `.sig` подпись
- **latest.json**: Метаданные для updater

## Updater Configuration

Updater настроен для проверки обновлений по адресу:
```
https://github.com/IK-Akmal/uni-school/releases/latest/download/latest.json
```

## Troubleshooting

### Ошибки сборки
- Убедитесь, что все зависимости установлены
- Проверьте версии Node.js и Rust
- Проверьте права доступа к секретам

### Проблемы с updater
- Убедитесь, что публичный ключ в `tauri.conf.json` соответствует приватному ключу в секретах
- Проверьте, что `latest.json` создается корректно
- Убедитесь, что endpoint в конфигурации указывает на правильный URL

## Локальная разработка

```bash
# Установка зависимостей
npm install

# Разработка
npm run dev

# Сборка
npm run build

# Сборка Tauri приложения
npm run tauri build
```

## Мониторинг

- Проверяйте статус Actions в разделе "Actions" репозитория
- Логи сборки доступны для каждого workflow
- Релизы публикуются в разделе "Releases"
