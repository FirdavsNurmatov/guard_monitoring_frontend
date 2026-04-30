import { useEffect, useState, useMemo } from "react";
import { instance } from "../../../config/axios-instance";
import { DatePicker, Table, ConfigProvider, Button, Select } from "antd";
import { SearchOutlined, DownloadOutlined, EnvironmentOutlined } from "@ant-design/icons";
import { useTranslation } from "react-i18next";
import { useObjectStore } from "../../../store/useObjectStore";
import { formatDate } from "../../../utils/dateFormat";
import dayjs from "dayjs";
import * as XLSX from "xlsx";
import toast from "react-hot-toast";
import LocationMapModal from "./component/LocationMapModal";
import "./Journal.css";

const Journal = () => {
  const { t, i18n } = useTranslation();
  const { selectedMapId, setSelectedMapId } = useObjectStore();

  const currentLocale =
    i18n.language === "uz"
      ? "uz-UZ"
      : i18n.language === "ru"
        ? "ru-RU"
        : "en-US";

  // Initialize search state from localStorage with defaults
  const [selectedDate, setSelectedDate] = useState(() => {
    const saved = localStorage.getItem("journalSelectedDate");
    return saved ? dayjs(saved) : dayjs();
  });

  const [dateRange, setDateRange] = useState(() => {
    const saved = localStorage.getItem("journalDateRange");
    return saved ? JSON.parse(saved) : null;
  });

  const [pickerMode, setPickerMode] = useState(() => {
    return localStorage.getItem("journalPickerMode") || "month";
  });

  const [hasSearched, setHasSearched] = useState(() => {
    return localStorage.getItem("journalHasSearched") === "true";
  });

  const [journalLogs, setJournalLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchLoading, setSearchLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [exportPeriod, setExportPeriod] = useState("day");
  const [mapModalOpen, setMapModalOpen] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState(null);

  // Save search state to localStorage when any of it changes
  useEffect(() => {
    localStorage.setItem("journalHasSearched", hasSearched.toString());
    if (selectedDate) {
      localStorage.setItem("journalSelectedDate", selectedDate.toISOString());
    }
    if (dateRange) {
      localStorage.setItem("journalDateRange", JSON.stringify(dateRange));
    }
    localStorage.setItem("journalPickerMode", pickerMode);
  }, [hasSearched, selectedDate, dateRange, pickerMode]);

  const fetchJournalLogs = async (currentPage = 1) => {
    if (!selectedMapId) return;

    try {
      let url;

      if (hasSearched && (selectedDate || dateRange)) {
        // Use filtered API when search is performed
        if (pickerMode === "range" && dateRange) {
          // Range mode - send custom start and end dates without period
          const startDate = dayjs(dateRange[0]).format("YYYY-MM-DD");
          const endDate = dayjs(dateRange[1]).format("YYYY-MM-DD");
          url = `/admin/monitoringLogsFiltered?objectId=${selectedMapId}&page=${currentPage}&limit=30&startDate=${startDate}&endDate=${endDate}`;
        } else if (selectedDate) {
          // Day/Week/Month mode - use period
          const period =
            pickerMode === "date"
              ? "daily"
              : pickerMode === "week"
                ? "weekly"
                : "monthly";
          url = `/admin/monitoringLogsFiltered?objectId=${selectedMapId}&page=${currentPage}&limit=30&period=${period}`;

          const startDate = selectedDate
            .startOf(
              pickerMode === "date"
                ? "day"
                : pickerMode === "week"
                  ? "week"
                  : "month",
            )
            .format("YYYY-MM-DD");
          const endDate = selectedDate
            .endOf(
              pickerMode === "date"
                ? "day"
                : pickerMode === "week"
                  ? "week"
                  : "month",
            )
            .format("YYYY-MM-DD");
          url += `&startDate=${startDate}&endDate=${endDate}`;
        }
      } else {
        // Use regular API for general data with pagination
        url = `/admin/monitoringLogs?objectId=${selectedMapId}&page=${currentPage}&limit=30`;
      }

      const res = await instance.get(url);
      const data = res?.data?.items || res?.data || [];
      const formattedLogs = data.map((log) => {
        const distance = calculateDistance(
          log.location?.latitude,
          log.location?.longitude,
          log.checkpoint?.location?.lat,
          log.checkpoint?.location?.lng
        );

        return {
          id: log.id,
          guard: log.user?.username || log.user?.login,
          checkpoint: log.checkpoint?.name || "-",
          checkpointLocation: log.checkpoint?.location || null,
          createdAtRaw: new Date(log.createdAt),
          status: log.status,
          location: log.location || null,
          distance: distance,
        };
      });
      setJournalLogs(formattedLogs);
      setTotal(res?.data?.total || data.length || 0);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching journal logs:", error);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJournalLogs(page);
  }, [page, selectedMapId, hasSearched]);

  const sortedJournalLogs = useMemo(() => {
    return [...journalLogs].sort((a, b) => b.createdAtRaw - a.createdAtRaw);
  }, [journalLogs]);

  const filteredTotal = total;

  // Calculate distance between two coordinates in meters using Haversine formula
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    if (!lat1 || !lon1 || !lat2 || !lon2) return null;

    const R = 6371e3; // Earth's radius in meters
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return Math.round(R * c);
  };

  const handleSearch = () => {
    setSearchLoading(true);
    setHasSearched(true);
    setPage(1);
    setLoading(true);
    fetchJournalLogs(1);
    setTimeout(() => {
      setSearchLoading(false);
    }, 300);
  };

  const handleClear = () => {
    setSelectedDate(null);
    setDateRange(null);
    setHasSearched(false);
    setPage(1);
  };

  const handleExportToExcel = async () => {
    if (!selectedMapId) return;

    try {
      let url;
      const now = dayjs();

      if (exportPeriod === "day") {
        const startDate = now.startOf("day").format("YYYY-MM-DD");
        const endDate = now.endOf("day").format("YYYY-MM-DD");
        url = `/admin/monitoringLogsFiltered?objectId=${selectedMapId}&startDate=${startDate}&endDate=${endDate}&page=1&limit=10000`;
      } else if (exportPeriod === "week") {
        const startDate = now.startOf("week").format("YYYY-MM-DD");
        const endDate = now.endOf("week").format("YYYY-MM-DD");
        url = `/admin/monitoringLogsFiltered?objectId=${selectedMapId}&startDate=${startDate}&endDate=${endDate}&page=1&limit=10000`;
      } else if (exportPeriod === "month") {
        const startDate = now.startOf("month").format("YYYY-MM-DD");
        const endDate = now.endOf("month").format("YYYY-MM-DD");
        url = `/admin/monitoringLogsFiltered?objectId=${selectedMapId}&startDate=${startDate}&endDate=${endDate}&page=1&limit=10000`;
      }

      const res = await instance.get(url);
      const data = res?.data?.items || res?.data || [];

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
      }));

      const worksheet = XLSX.utils.json_to_sheet(exportData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Journal");
      const fileName = `journal_${exportPeriod}_${now.format("YYYY-MM-DD")}.xlsx`;
      XLSX.writeFile(workbook, fileName);
    } catch (error) {
      console.error("Error exporting to Excel:", error);
      toast.error(t("messages.exportError"));
    }
  };

  const getPickerPlaceholder = () => {
    switch (pickerMode) {
      case "date":
        return t("common.selectDate");
      case "week":
        return t("common.selectWeek");
      case "month":
        return t("common.selectMonth");
      case "range":
        return [t("common.startDate"), t("common.endDate")];
      default:
        return t("common.selectDate");
    }
  };

  const getPickerFormat = () => {
    switch (pickerMode) {
      case "date":
        return "DD MMMM YYYY";
      case "week":
        return "[Week] w, YYYY";
      case "month":
        return "MMMM YYYY";
      case "range":
        return "DD/MM/YYYY";
      default:
        return "DD MMMM YYYY";
    }
  };

  const journalColumns = [
    {
      title: "#",
      dataIndex: "id",
      key: "id",
      width: 80,
    },
    {
      title: t("dashboardPage.username"),
      dataIndex: "guard",
      key: "guard",
    },
    {
      title: t("dashboardPage.checkpointName"),
      dataIndex: "checkpoint",
      key: "checkpoint",
    },
    {
      title: t("dashboardPage.arrivalDate"),
      dataIndex: "createdAtRaw",
      render: (time) => formatDate(time, true),
      sorter: (a, b) => a.createdAtRaw - b.createdAtRaw,
      defaultSortOrder: "descend",
      key: "createdAt",
    },
    {
      title: t("dashboardPage.status"),
      dataIndex: "status",
      render: (status) =>
        status === "ON_TIME" ? (
          <span className="text-emerald-400">
            {t("dashboardPage.onTimeStatus")}
          </span>
        ) : status === "LATE" ? (
          <span className="text-yellow-400">
            {t("dashboardPage.lateStatus")}
          </span>
        ) : (
          <span className="text-red-400">
            {t("dashboardPage.veryLateStatus")}
          </span>
        ),
      key: "status",
    },
    {
      title: t("dashboardPage.location"),
      dataIndex: "location",
      render: (location, record) =>
        location ? (
          <Button
            type="link"
            icon={<EnvironmentOutlined />}
            onClick={() => {
              setSelectedLocation({
                ...location,
                checkpoint: record.checkpoint,
                guard: record.guard,
                createdAtRaw: record.createdAtRaw,
                status: record.status,
              });
              setMapModalOpen(true);
            }}
            className="text-emerald-400 hover:text-emerald-300"
          >
            {t("dashboardPage.viewMap")}
          </Button>
        ) : (
          <span className="text-gray-500">-</span>
        ),
      key: "location",
    },
    {
      title: t("dashboardPage.distance"),
      dataIndex: "distance",
      render: (distance) =>
        distance !== null && distance !== undefined ? (
          <span className="text-gray-300">
            {distance} m
          </span>
        ) : (
          <span className="text-gray-500">-</span>
        ),
      key: "distance",
    },
  ];

  return (
    <div className="bg-gray-950 p-6 relative">
      <style>{`
        .ant-picker-input input {
          color: white !important;
        }
        .ant-picker-input input::placeholder {
          color: rgba(255, 255, 255, 0.5) !important;
        }
        .ant-picker input {
          color: white !important;
        }
        .dark-picker .ant-picker-cell-in-range .ant-picker-cell-inner {
          background-color: #10b981 !important;
          color: white !important;
          border-radius: 2px !important;
        }
        .dark-picker .ant-picker-cell-in-range:hover .ant-picker-cell-inner {
          background-color: #059669 !important;
        }
        .ant-picker-cell-range-start,
        .ant-picker-cell-range-end {
          background-color: #10b981 !important;
        }
        .ant-picker-cell-range-start .ant-picker-cell-inner,
        .ant-picker-cell-range-end .ant-picker-cell-inner {
          color: white !important;
        }
        .ant-picker-cell-in-range .ant-picker-cell-inner {
          color: white !important;
        }
        .ant-table-column-sorter-up,
        .ant-table-column-sorter-down {
          font-size: 16px !important;
        }
        .ant-table-column-sorter-up.active,
        .ant-table-column-sorter-down.active {
          color: #10b981 !important;
        }
      `}</style>
      <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-gray-950 to-black pointer-events-none"></div>
      <div className="absolute inset-0 opacity-20 pointer-events-none">
        <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-emerald-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse animation-delay-1s"></div>
      </div>

      <div className="relative z-10 w-full px-4">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white mb-1">
              {t("dashboardPage.employeeJournal")}
            </h1>
            <p className="text-gray-400 text-sm">
              {t("dashboardPage.recentLogs")}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-3 bg-gray-800/50 px-4 py-2 rounded-lg border border-gray-700/50">
              <span className="text-gray-400 text-sm font-medium">
                {t("common.excel")}:
              </span>
              <ConfigProvider
                theme={{
                  token: {
                    colorPrimary: "#10b981",
                    colorText: "white",
                    colorTextPlaceholder: "rgba(255, 255, 255, 0.5)",
                    colorBorder: "#10b981",
                    colorBgContainer: "rgba(16, 185, 129, 0.1)",
                  },
                }}
              >
                <Select
                  value={exportPeriod}
                  onChange={(value) => {
                    setExportPeriod(value);
                  }}
                  className="dark-select"
                  style={{ width: 120 }}
                  options={[
                    { label: t("common.day"), value: "day" },
                    { label: t("common.week"), value: "week" },
                    { label: t("common.month"), value: "month" },
                  ]}
                />
              </ConfigProvider>
              <Button
                type="primary"
                icon={<DownloadOutlined />}
                onClick={handleExportToExcel}
                className="bg-emerald-500 hover:bg-emerald-600 border-emerald-500 text-white"
                style={{
                  backgroundColor: "#10b981",
                  borderColor: "#10b981",
                  color: "white",
                }}
              >
                {t("common.export")}
              </Button>
            </div>

            <ConfigProvider
              theme={{
                token: {
                  colorPrimary: "#10b981",
                  colorText: "white",
                  colorTextPlaceholder: "rgba(255, 255, 255, 0.5)",
                  colorBorder: "#10b981",
                  colorBgContainer: "rgba(16, 185, 129, 0.1)",
                },
              }}
            >
              <Select
                value={pickerMode}
                onChange={(value) => {
                  setPickerMode(value);
                }}
                className="dark-select"
                style={{ width: 100 }}
                options={[
                  { label: t("common.day"), value: "date" },
                  { label: t("common.week"), value: "week" },
                  { label: t("common.month"), value: "month" },
                  { label: t("common.range"), value: "range" },
                ]}
              />
              {pickerMode === "range" ? (
                <DatePicker.RangePicker
                  value={dateRange}
                  onChange={(dates) => {
                    setDateRange(dates);
                    setSelectedDate(null);
                  }}
                  className="dark-select"
                  placeholder={getPickerPlaceholder()}
                  popupClassName="dark-picker"
                  format={getPickerFormat()}
                />
              ) : (
                <DatePicker
                  value={selectedDate}
                  onChange={(date) => {
                    setSelectedDate(date);
                    setDateRange(null);
                  }}
                  picker={pickerMode}
                  className="dark-select"
                  placeholder={getPickerPlaceholder()}
                  format={getPickerFormat()}
                />
              )}
            </ConfigProvider>
            <Button
              type="primary"
              icon={<SearchOutlined />}
              onClick={handleSearch}
              loading={searchLoading}
              className="bg-emerald-500 hover:bg-emerald-600 border-emerald-500 text-white"
              style={{
                backgroundColor: "#10b981",
                borderColor: "#10b981",
                color: "white",
              }}
            >
              {t("common.search")}
            </Button>
            {(selectedDate || dateRange) && (
              <Button
                onClick={handleClear}
                className="bg-red-500 hover:bg-red-600 border-red-500 text-white"
                style={{
                  backgroundColor: "#ef4444",
                  borderColor: "#ef4444",
                  color: "white",
                }}
              >
                {t("common.clear")}
              </Button>
            )}
          </div>
        </div>

        <div className="bg-gray-900/80 backdrop-blur-xl border border-gray-700/50 rounded-2xl overflow-hidden shadow-xl shadow-black/20">
          <Table
            dataSource={sortedJournalLogs.map((l, i) => ({ ...l, key: i }))}
            columns={journalColumns}
            pagination={{
              showSizeChanger: false,
              showTotal: (total) => t("pagination.total", { count: total }),
              className: "dark-pagination pagination-dark",
              pageSize: 30,
              current: page,
              total: filteredTotal,
              onChange: (page) => setPage(page),
            }}
            loading={loading}
            className="dark-table table-large"
            size="medium"
            scroll={{ y: 520 }}
            rowClassName={(record) =>
              record.status === "ON_TIME"
                ? "bg-emerald-500/10"
                : record.status === "LATE"
                  ? "bg-yellow-500/10"
                  : "bg-red-500/10"
            }
          />
        </div>
        <LocationMapModal
          open={mapModalOpen}
          onClose={() => setMapModalOpen(false)}
          location={selectedLocation}
          checkpoint={selectedLocation?.checkpoint}
          guard={selectedLocation?.guard}
          createdAtRaw={selectedLocation?.createdAtRaw}
          status={selectedLocation?.status}
        />
      </div>
    </div>
  );
};

export default Journal;
