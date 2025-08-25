import { check } from "@tauri-apps/plugin-updater";
import { relaunch } from "@tauri-apps/plugin-process";
import { ask } from "@tauri-apps/plugin-dialog";
import { getVersion } from "@tauri-apps/api/app";

export interface UpdateInfo {
  available: boolean;
  currentVersion: string;
  version?: string;
  date?: string;
  body?: string;
}

export class UpdaterService {
  private static instance: UpdaterService;

  public static getInstance(): UpdaterService {
    if (!UpdaterService.instance) {
      UpdaterService.instance = new UpdaterService();
    }
    return UpdaterService.instance;
  }

  /**
   * Проверяет наличие обновлений
   */
  async checkForUpdates(): Promise<UpdateInfo> {
    try {
      const currentVersion = await getVersion();
      
      // Check if we're running in development mode
      if (import.meta.env.DEV) {
        console.log('Development mode - skipping update check');
        return {
          available: false,
          currentVersion,
        };
      }

      const update = await check();
      
      if (update) {
        return {
          available: true,
          currentVersion: update.currentVersion,
          version: update.version,
          date: update.date,
          body: update.body,
        };
      }

      return {
        available: false,
        currentVersion,
      };
    } catch (error) {
      console.error("Error checking for updates:", error);
      // Return safe fallback instead of throwing
      const currentVersion = await getVersion().catch(() => "unknown");
      return {
        available: false,
        currentVersion,
      };
    }
  }

  /**
   * Загружает и устанавливает обновление
   */
  async downloadAndInstall(): Promise<void> {
    try {
      // Check if we're running in development mode
      if (import.meta.env.DEV) {
        console.log("Development mode - update installation not available");
        throw new Error("Updates not available in development mode");
      }

      const update = await check();

      if (!update) {
        throw new Error("No updates available");
      }

      console.log(
        `Found update ${update.version} from ${update.date} with notes ${update.body}`
      );

      // Показываем диалог подтверждения
      const confirmed = await ask(
        `Update available: ${update.version}\n\n${
          update.body || "New version available"
        }\n\nDo you want to install it now?`,
        {
          title: "Update Available",
          kind: "info",
        }
      );

      if (!confirmed) {
        return;
      }

      let downloaded = 0;
      let contentLength = 0;

      // Загружаем и устанавливаем обновление с прогресс-индикатором
      await update.downloadAndInstall((event) => {
        switch (event.event) {
          case "Started":
            contentLength = event.data.contentLength || 0;
            console.log(
              `Started downloading ${event.data.contentLength || 0} bytes`
            );
            break;
          case "Progress":
            downloaded += event.data.chunkLength || 0;
            console.log(`Downloaded ${downloaded} from ${contentLength}`);
            break;
          case "Finished":
            console.log("Download finished");
            break;
        }
      });

      console.log("Update installed");

      // Показываем диалог о необходимости перезапуска
      const restart = await ask(
        "Update installed successfully. The application needs to restart to apply the changes.",
        {
          title: "Restart Required",
          kind: "info",
        }
      );

      if (restart) {
        await relaunch();
      }
    } catch (error) {
      console.error("Error downloading and installing update:", error);
      throw new Error("Failed to download and install update");
    }
  }

  /**
   * Автоматическая проверка обновлений при запуске
   */
  async autoCheckForUpdates(): Promise<void> {
    try {
      const updateInfo = await this.checkForUpdates();

      if (updateInfo.available) {
        console.log("Update available:", updateInfo);
        // Можно добавить уведомление в UI
      }
    } catch (error) {
      console.error("Auto update check failed:", error);
    }
  }
}
