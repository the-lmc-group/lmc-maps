import { WarningMessage } from "@/components/WarningMessage";
import { Colors } from "@/constants/theme";
import { useUpdate } from "@/contexts/UpdateContext";
import { createTranslator } from "@/i18n";
import { downloadAndInstallAPK } from "@/services/UpdateService";
import React from "react";
import { View } from "react-native";

export function UpdateDialog() {
  const { t } = createTranslator("navigate");
  const { hasUpdate, releaseInfo, dismissUpdate, isChecking } = useUpdate();
  const [isDownloading, setIsDownloading] = React.useState(false);
  const [downloadProgress, setDownloadProgress] = React.useState(0);

  const handleDownloadAndInstall = React.useCallback(async () => {
    if (!releaseInfo?.assets || releaseInfo.assets.length === 0) {
      return;
    }

    const apkAsset = releaseInfo.assets.find((asset) =>
      asset.name.toLowerCase().endsWith(".apk"),
    );

    if (!apkAsset) {
      return;
    }

    setIsDownloading(true);
    setDownloadProgress(0);
    try {
      await downloadAndInstallAPK(apkAsset.browser_download_url, (p) =>
        setDownloadProgress(p),
      );
    } catch {
    } finally {
      setIsDownloading(false);
    }
  }, [releaseInfo]);

  if (!hasUpdate || !releaseInfo || isChecking) {
    return null;
  }

  if (isDownloading) {
    return (
      <View>
        <WarningMessage
          visible={true}
          iconName="download"
          title={t("update.downloading") as string}
          description={t("update.downloadingDesc") as string}
          buttons={[]}
        />
        <View style={{ padding: 16 }}>
          <View
            style={{
              height: 6,
              backgroundColor: "#444",
              borderRadius: 3,
              overflow: "hidden",
            }}
          >
            <View
              style={{
                width: `${Math.round(downloadProgress * 100)}%`,
                height: 6,
                backgroundColor: Colors.dark.primary,
              }}
            />
          </View>
        </View>
      </View>
    );
  }

  return (
    <WarningMessage
      visible={hasUpdate}
      onDismiss={dismissUpdate}
      iconName="system-update"
      title={t("update.title") as string}
      description={releaseInfo.body || (t("update.description") as string)}
      buttons={[
        {
          label: t("update.download") as string,
          action: handleDownloadAndInstall,
        },
        {
          label: t("update.later") as string,
          action: dismissUpdate,
        },
      ]}
    />
  );
}

export default UpdateDialog;
