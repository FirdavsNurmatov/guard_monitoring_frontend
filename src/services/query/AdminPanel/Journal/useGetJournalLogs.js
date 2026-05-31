import { useQuery } from "@tanstack/react-query";
import dayjs from "dayjs";
import { instance } from "../../../../config/axios-instance";

const buildUrl = ({
  selectedMapId,
  page,
  hasSearched,
  pickerMode,
  selectedDate,
  dateRange,
}) => {
  if (!selectedMapId) return null;

  if (hasSearched && (selectedDate || dateRange)) {
    if (pickerMode === "range" && dateRange) {
      const startDate = dayjs(dateRange[0]).format("YYYY-MM-DD");
      const endDate = dayjs(dateRange[1]).format("YYYY-MM-DD");
      return `/admin/monitoringLogsFiltered?objectId=${selectedMapId}&page=${page}&limit=30&startDate=${startDate}&endDate=${endDate}`;
    }

    if (selectedDate) {
      const unit =
        pickerMode === "date"
          ? "day"
          : pickerMode === "week"
            ? "week"
            : "month";
      const period =
        pickerMode === "date"
          ? "daily"
          : pickerMode === "week"
            ? "weekly"
            : "monthly";
      const startDate = selectedDate.startOf(unit).format("YYYY-MM-DD");
      const endDate = selectedDate.endOf(unit).format("YYYY-MM-DD");
      return `/admin/monitoringLogsFiltered?objectId=${selectedMapId}&page=${page}&limit=30&period=${period}&startDate=${startDate}&endDate=${endDate}`;
    }
  }

  return `/admin/monitoringLogs?objectId=${selectedMapId}&page=${page}&limit=30`;
};

export const useGetJournalLogs = ({
  selectedMapId,
  page,
  hasSearched,
  pickerMode,
  selectedDate,
  dateRange,
}) => {
  return useQuery({
    queryKey: [
      "journalLogs",
      selectedMapId,
      page,
      hasSearched,
      pickerMode,
      selectedDate?.toISOString(),
      dateRange,
    ],
    queryFn: async () => {
      const url = buildUrl({
        selectedMapId,
        page,
        hasSearched,
        pickerMode,
        selectedDate,
        dateRange,
      });
      const res = await instance.get(url);
      return res?.data;
    },
    enabled: !!selectedMapId,
    select: (raw) => {
      const items = raw?.items || raw || [];
      return {
        logs: items.map((log) => ({
          id: log.id,
          guard: log.user?.username || log.user?.login,
          checkpoint: log.checkpoint?.name || "-",
          checkpointLocation: log.checkpoint?.location || null,
          createdAtRaw: new Date(log.createdAt),
          status: log.status,
          location: log.location || null,
          distance: log?.distance,
        })),
        total: raw?.total || items.length || 0,
      };
    },
  });
};
