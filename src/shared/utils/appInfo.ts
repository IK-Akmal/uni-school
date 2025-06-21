import { getVersion, getName } from "@tauri-apps/api/app";

export interface AppInfo {
  name: string;
  version: string;
  buildDate: string;
  buildNumber: string;
  environment: string;
}

/**
 * Получает информацию о приложении
 */
export const getAppInfo = async (): Promise<AppInfo> => {
  try {
    const [name, version] = await Promise.all([getName(), getVersion()]);

    // Генерируем номер сборки на основе версии и текущей даты
    const buildNumber = generateBuildNumber(version);

    // Определяем дату сборки (для dev версии - текущая дата)
    const buildDate = new Date().toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    // Определяем окружение
    const environment = import.meta.env.DEV ? "Development" : "Production";

    return {
      name,
      version,
      buildDate,
      buildNumber,
      environment,
    };
  } catch (error) {
    console.error("Failed to get app info:", error);

    // Fallback значения
    return {
      name: "School Management System",
      version: "0.1.0",
      buildDate: new Date().toLocaleDateString("en-US"),
      buildNumber: generateBuildNumber("0.1.0"),
      environment: "Unknown",
    };
  }
};

/**
 * Генерирует номер сборки на основе версии
 */
const generateBuildNumber = (version: string): string => {
  // Преобразуем версию в число и добавляем timestamp
  const versionParts = version.split(".").map(Number);
  const versionNumber =
    versionParts[0] * 10000 + versionParts[1] * 100 + (versionParts[2] || 0);
  const timestamp = Date.now().toString().slice(-4); // Последние 4 цифры timestamp

  return `${versionNumber}${timestamp}`;
};
