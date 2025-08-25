import { check } from '@tauri-apps/plugin-updater';
import { relaunch } from '@tauri-apps/plugin-process';
import { ask } from '@tauri-apps/plugin-dialog';

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
      const update = await check();
      
      if (update?.available) {
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
        currentVersion: update?.currentVersion || '0.1.0',
      };
    } catch (error) {
      console.error('Error checking for updates:', error);
      throw new Error('Failed to check for updates');
    }
  }

  /**
   * Загружает и устанавливает обновление
   */
  async downloadAndInstall(): Promise<void> {
    try {
      const update = await check();
      
      if (!update?.available) {
        throw new Error('No updates available');
      }

      // Показываем диалог подтверждения
      const confirmed = await ask(
        `Update available: ${update.version}\n\n${update.body || 'New version available'}\n\nDo you want to install it now?`,
        {
          title: 'Update Available',
          kind: 'info',
        }
      );

      if (!confirmed) {
        return;
      }

      // Загружаем и устанавливаем обновление
      await update.downloadAndInstall();

      // Показываем диалог о необходимости перезапуска
      const restart = await ask(
        'Update installed successfully. The application needs to restart to apply the changes.',
        {
          title: 'Restart Required',
          kind: 'info',
        }
      );

      if (restart) {
        await relaunch();
      }
    } catch (error) {
      console.error('Error downloading and installing update:', error);
      throw new Error('Failed to download and install update');
    }
  }

  /**
   * Автоматическая проверка обновлений при запуске
   */
  async autoCheckForUpdates(): Promise<void> {
    try {
      const updateInfo = await this.checkForUpdates();
      
      if (updateInfo.available) {
        console.log('Update available:', updateInfo);
        // Можно добавить уведомление в UI
      }
    } catch (error) {
      console.error('Auto update check failed:', error);
    }
  }
}
