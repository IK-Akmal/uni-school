import React, { useEffect, useState } from "react";
import { Button, notification, Modal, Typography, Space, Tag } from "antd";
import {
  DownloadOutlined,
  ReloadOutlined,
  CheckCircleOutlined,
} from "@ant-design/icons";
import { UpdaterService, UpdateInfo } from "@/shared/utils/updater";

const { Text, Paragraph } = Typography;

interface UpdateCheckerProps {
  autoCheck?: boolean;
  showButton?: boolean;
}

export const UpdateChecker: React.FC<UpdateCheckerProps> = ({
  autoCheck = true,
  showButton = true,
}) => {
  const [updateInfo, setUpdateInfo] = useState<UpdateInfo | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [showModal, setShowModal] = useState(false);

  const updaterService = UpdaterService.getInstance();

  const checkForUpdates = async () => {
    setIsChecking(true);
    try {
      const info = await updaterService.checkForUpdates();

      setUpdateInfo(info);

      if (info.available) {
        setShowModal(true);
        notification.info({
          message: "Update Available",
          description: `Version ${info.version} is available for download.`,
          icon: <DownloadOutlined style={{ color: "#1890ff" }} />,
          duration: 0,
          key: "update-available",
          btn: (
            <Button
              type="primary"
              size="small"
              onClick={() => {
                notification.destroy("update-available");
                setShowModal(true);
              }}
            >
              View Details
            </Button>
          ),
        });
      } else if (showButton) {
        notification.success({
          message: "No Updates Available",
          description: "You are running the latest version.",
          icon: <CheckCircleOutlined style={{ color: "#52c41a" }} />,
          duration: 3,
        });
      }
    } catch (error) {
      notification.error({
        message: "Update Check Failed",
        description: "Failed to check for updates. Please try again later.",
        duration: 5,
      });
    } finally {
      setIsChecking(false);
    }
  };

  const handleUpdate = async () => {
    setIsUpdating(true);
    try {
      await updaterService.downloadAndInstall();
      notification.success({
        message: "Update Installed",
        description: "The application will restart to apply the update.",
        duration: 3,
      });
      setShowModal(false);
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : typeof error === "string"
          ? error
          : "Unknown error";

      notification.error({
        message: "Update Failed",
        description:
          "Failed to download and install the update. " + errorMessage,
        duration: 5,
      });
    } finally {
      setIsUpdating(false);
    }
  };

  useEffect(() => {
    if (autoCheck) {
      // Проверяем обновления при загрузке компонента
      updaterService.autoCheckForUpdates();
    }
  }, [autoCheck]);

  return (
    <>
      {showButton && (
        <Button
          icon={<ReloadOutlined />}
          onClick={checkForUpdates}
          loading={isChecking}
          size="small"
        >
          Check for Updates
        </Button>
      )}

      <Modal
        title="Update Available"
        open={showModal}
        onCancel={() => setShowModal(false)}
        footer={[
          <Button key="cancel" onClick={() => setShowModal(false)}>
            Later
          </Button>,
          <Button
            key="update"
            type="primary"
            icon={<DownloadOutlined />}
            loading={isUpdating}
            onClick={handleUpdate}
          >
            Download & Install
          </Button>,
        ]}
        width={500}
      >
        {updateInfo?.available && (
          <Space direction="vertical" style={{ width: "100%" }}>
            <div>
              <Text strong>New Version: </Text>
              <Tag color="blue">{updateInfo.version}</Tag>
            </div>

            <div>
              <Text strong>Current Version: </Text>
              <Tag>{updateInfo.currentVersion}</Tag>
            </div>

            {updateInfo.date && (
              <div>
                <Text strong>Release Date: </Text>
                <Text type="secondary">
                  {new Date(updateInfo.date).toLocaleDateString()}
                </Text>
              </div>
            )}

            {updateInfo.body && (
              <div>
                <Text strong>What's New:</Text>
                <Paragraph
                  style={{
                    marginTop: 8,
                    padding: 12,
                    backgroundColor: "#f5f5f5",
                    borderRadius: 4,
                    maxHeight: 200,
                    overflowY: "auto",
                  }}
                >
                  {updateInfo.body}
                </Paragraph>
              </div>
            )}
          </Space>
        )}
      </Modal>
    </>
  );
};
