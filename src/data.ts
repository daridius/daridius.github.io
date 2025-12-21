export interface WrappedData {
  year: number;
  totalMessages: number;
  topUser: string;
  userShare: number;
  topEmoji: string;
  topMonth: number;
  peakHour: number;
  longestMessageLength: number;
  quietDaysMax: number;
}

export const wrappedData: WrappedData = {
  year: 2025,
  totalMessages: 12847,
  topUser: "Juan",
  userShare: 34,
  topEmoji: "😂",
  topMonth: 8,
  peakHour: 23,
  longestMessageLength: 1243,
  quietDaysMax: 9
};

export const monthNames = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
];
