import * as Application from "expo-application";
import Constants from "expo-constants";
import * as Device from "expo-device";
import * as Localization from "expo-localization";
import { Platform } from "react-native";

export type PrivacyLevel = "total" | "necessary" | "limited" | "none";

export type TelemetryEventType =
  | "error"
  | "warning"
  | "crash"
  | "install"
  | "app_start"
  | "navigation_start"
  | "navigation_stop"
  | "feature_used"
  | "session_end";

export interface TelemetryEventData {
  event: TelemetryEventType;
  errorType?: string;
  message?: string;
  stacktrace?: string;
  logs?: string[];
  metadata?: Record<string, any>;
  timestamp?: number;
}

export interface TelemetryPayload {
  event: TelemetryEventType;
  timestamp: number;

  app_version?: string;

  os?: string;
  device?: string;
  system_language?: string;
  build_number?: string;
  error_type?: string;

  stacktrace?: string;
  logs?: string[];
  usage_data?: {
    app_start_count?: number;
    session_duration?: number;
    features_used?: string[];
    fps?: number;
    route_calculation_time?: number;
  };
  technical_logs?: string[];
  metadata?: Record<string, any>;
}

class SystemInfoCollector {
  static getAppVersion(): string {
    try {
      return Constants.expoConfig?.version || "unknown";
    } catch {
      return "unknown";
    }
  }

  static getBuildNumber(): string {
    try {
      return Application.nativeBuildVersion || "unknown";
    } catch {
      return "unknown";
    }
  }

  static getOSVersion(): string {
    try {
      let os = Platform.OS.toUpperCase();
      const version = Platform.Version || "unknown";
      return `${os} ${version}`;
    } catch {
      return "unknown";
    }
  }

  static getDeviceModel(): string {
    try {
      return Device.modelName || "unknown";
    } catch {
      return "unknown";
    }
  }

  static getSystemLanguage(): string {
    try {
      return Localization.getLocales()[0]?.languageCode || "unknown";
    } catch {
      return "unknown";
    }
  }
}

class DataFilter {
  static filterPayload(
    payload: TelemetryPayload,
    privacyLevel: PrivacyLevel,
  ): TelemetryPayload | null {
    if (privacyLevel === "none") {
      return null;
    }

    const filtered: TelemetryPayload = {
      event: payload.event,
      timestamp: payload.timestamp,
    };

    if (privacyLevel === "limited") {
      filtered.app_version = payload.app_version;
      return filtered;
    }

    if (privacyLevel === "necessary") {
      if (!["error", "crash"].includes(payload.event)) {
        return null;
      }

      filtered.app_version = payload.app_version;
      filtered.os = payload.os;
      filtered.device = payload.device;
      filtered.error_type = payload.error_type;
      filtered.stacktrace = payload.stacktrace;
      return filtered;
    }

    if (privacyLevel === "total") {
      return payload;
    }

    return null;
  }
}

export class TelemetryService {
  private static privacyLevel: PrivacyLevel = "total";
  private static enabled: boolean =
    (process.env.EXPO_PUBLIC_TELEMETRY_ENABLED || "false") === "true";
  private static endpoint: string =
    process.env.EXPO_PUBLIC_TELEMETRY_ENDPOINT ||
    process.env.TELEMETRY_ENDPOINT ||
    "";

  static setEnabled(value: boolean) {
    this.enabled = value;
  }

  static setEndpoint(url: string) {
    this.endpoint = url;
  }

  static setPrivacyLevel(level: PrivacyLevel): void {
    this.privacyLevel = level;
  }

  static getPrivacyLevel(): PrivacyLevel {
    return this.privacyLevel;
  }

  static getTelemetryInfo(
    eventData: TelemetryEventData,
  ): TelemetryPayload | null {
    const payload: TelemetryPayload = {
      event: eventData.event,
      timestamp: eventData.timestamp || Date.now(),
      app_version: SystemInfoCollector.getAppVersion(),
      build_number: SystemInfoCollector.getBuildNumber(),
      os: SystemInfoCollector.getOSVersion(),
      device: SystemInfoCollector.getDeviceModel(),
      system_language: SystemInfoCollector.getSystemLanguage(),
      error_type: eventData.errorType,
      stacktrace: eventData.stacktrace,
      logs: eventData.logs,
      metadata: eventData.metadata,
    };

    const filtered = DataFilter.filterPayload(payload, this.privacyLevel);
    return filtered;
  }

  static async recordEvent(
    eventData: TelemetryEventData,
  ): Promise<TelemetryPayload | null> {
    const payload = this.getTelemetryInfo(eventData);

    if (!payload) {
      return null;
    }

    await this.sendTelemetry(payload);

    return payload;
  }

  static async sendTelemetry(payload: TelemetryPayload): Promise<boolean> {
    try {
      if (!this.enabled || this.privacyLevel === "none") {
        return false;
      }

      const TELEMETRY_ENDPOINT = this.endpoint || "";

      if (!TELEMETRY_ENDPOINT) {
        return false;
      }

      const response = await fetch(TELEMETRY_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      return response.ok;
    } catch {
      return false;
    }
  }
}

export const telemetryError = (
  errorType: string,
  message?: string,
  stacktrace?: string,
  metadata?: Record<string, any>,
): Promise<TelemetryPayload | null> => {
  return TelemetryService.recordEvent({
    event: "error",
    errorType,
    message,
    stacktrace,
    metadata,
  });
};

export const telemetryCrash = (
  message: string,
  stacktrace: string,
  metadata?: Record<string, any>,
): Promise<TelemetryPayload | null> => {
  return TelemetryService.recordEvent({
    event: "crash",
    message,
    stacktrace,
    metadata,
  });
};

export const telemetryWarning = (
  message: string,
  metadata?: Record<string, any>,
): Promise<TelemetryPayload | null> => {
  return TelemetryService.recordEvent({
    event: "warning",
    message,
    metadata,
  });
};

export const telemetryInstall = (): Promise<TelemetryPayload | null> => {
  return TelemetryService.recordEvent({
    event: "install",
  });
};

export const telemetryAppStart = (
  metadata?: Record<string, any>,
): Promise<TelemetryPayload | null> => {
  return TelemetryService.recordEvent({
    event: "app_start",
    metadata,
  });
};

export const telemetryNavigationStart = (
  feature?: string,
  metadata?: Record<string, any>,
): Promise<TelemetryPayload | null> => {
  return TelemetryService.recordEvent({
    event: "navigation_start",
    message: feature,
    metadata,
  });
};

export const telemetryNavigationStop = (
  metadata?: Record<string, any>,
): Promise<TelemetryPayload | null> => {
  return TelemetryService.recordEvent({
    event: "navigation_stop",
    metadata,
  });
};

export const telemetryFeatureUsed = (
  featureName: string,
  metadata?: Record<string, any>,
): Promise<TelemetryPayload | null> => {
  return TelemetryService.recordEvent({
    event: "feature_used",
    message: featureName,
    metadata,
  });
};

export const telemetrySessionEnd = (
  metadata?: Record<string, any>,
): Promise<TelemetryPayload | null> => {
  return TelemetryService.recordEvent({
    event: "session_end",
    metadata,
  });
};

export default TelemetryService;
