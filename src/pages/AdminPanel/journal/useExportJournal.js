import { useState } from "react";
import { instance } from "../../../config/axios-instance";
import { formatDate } from "../../../utils/dateFormat";
import dayjs from "dayjs";
import * as XLSX from "xlsx";
import toast from "react-hot-toast";

export const useExportJournal = ({
  selectedMapId,
  pickerMode,
  selectedDate,
  dateRange,
  t,
}) => {
  const [exportLoading, setExportLoading] = useState(false);

  const handleExportToExcel = async () => {
    if (!selectedMapId) return;

    setExportLoading(true);

    try {
      let startDate, endDate;
      const now = dayjs();

      if (pickerMode === "range") {
        if (!dateRange?.[0] || !dateRange?.[1]) {
          toast.error(t("messages.selectDateFirst"));
          return;
        }
        startDate = dateRange[0].startOf("day").format("YYYY-MM-DD");
        endDate = dateRange[1].endOf("day").format("YYYY-MM-DD");
      } else {
        const base = selectedDate || now;
        const unit = pickerMode === "date" ? "day" : pickerMode; // "date" → "day"
        startDate = base.startOf(unit).format("YYYY-MM-DD");
        endDate = base.endOf(unit).format("YYYY-MM-DD");
      }

      const url = `/admin/monitoringLogsFiltered?objectId=${selectedMapId}&startDate=${startDate}&endDate=${endDate}&page=1&limit=10000`;
      const res = await instance.get(url);
      const data = res?.data?.items;

      if (data.length === 0) {
        toast.error(t("messages.noDataToExport"));
        return;
      }

      const exportData = data.map((log) => ({
        [t("dashboardPage.username")]:
          log.user?.username || log.user?.login || "-",
        [t("dashboardPage.checkpointName")]: log.checkpoint?.name || "-",
        [t("dashboardPage.arrivalDate")]: formatDate(
          new Date(log.createdAt),
          true,
        ),
        [t("dashboardPage.status")]:
          log.status === "ON_TIME"
            ? t("dashboardPage.onTimeStatus")
            : log.status === "LATE"
              ? t("dashboardPage.lateStatus")
              : t("dashboardPage.veryLateStatus"),
        [t("dashboardPage.latitude")]: log.location?.latitude || "-",
        [t("dashboardPage.longitude")]: log.location?.longitude || "-",
        [t("dashboardPage.distance")]:
          log?.distance !== null && log?.distance !== undefined
            ? `${log.distance} m`
            : "-",
      }));

      const worksheet = XLSX.utils.json_to_sheet(exportData);

      // Set column widths
      worksheet['!cols'] = [
        { wch: 20 }, // username
        { wch: 20 }, // checkpointName
        { wch: 18 }, // arrivalDate
        { wch: 14 }, // status
        { wch: 12 }, // latitude
        { wch: 12 }, // longitude
        { wch: 10 }, // distance
      ];

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Journal");
      const fileName = `journal_${startDate}_${endDate}.xlsx`;
      XLSX.writeFile(workbook, fileName);
    } catch (error) {
      // console.error("Error exporting to Excel:", error);
      toast.error(t("messages.exportError"));
    } finally {
      setExportLoading(false);
    }
  };

  return { handleExportToExcel, exportLoading };
};
