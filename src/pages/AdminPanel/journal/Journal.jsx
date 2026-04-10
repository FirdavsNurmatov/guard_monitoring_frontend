import { useEffect, useState, useMemo } from "react";
import { instance } from "../../../config/axios-instance";
import { DatePicker, Table, ConfigProvider, theme } from "antd";
import { useTranslation } from "react-i18next";
import { useObjectStore } from "../../../store/useObjectStore";
import { formatDate } from "../../../utils/dateFormat";

const Journal = () => {
  const { t, i18n } = useTranslation();
  const { selectedMapId, setSelectedMapId } = useObjectStore();

  const currentLocale =
    i18n.language === "uz"
      ? "uz-UZ"
      : i18n.language === "ru"
        ? "ru-RU"
        : "en-US";

  const [journalLogs, setJournalLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    const fetchJournalLogs = async () => {
      if (!selectedMapId) return;

      try {
        const res = await instance.get(
          `/admin/monitoringLogs?objectId=${selectedMapId}&page=${page}&limit=30`,
        );
        const data = res?.data?.items || res?.data || [];
        const formattedLogs = data.map((log) => ({
          id: log.id,
          guard: log.user?.username || log.user?.login,
          checkpoint: log.checkpoint?.name || "-",
          createdAtRaw: new Date(log.createdAt),
          status: log.status,
        }));
        setJournalLogs(formattedLogs);
        setTotal(res?.data?.total || data.length || 0);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching journal logs:", error);
        setLoading(false);
      }
    };
    fetchJournalLogs();
  }, [page, selectedMapId]);

  const sortedJournalLogs = useMemo(() => {
    let filtered = [...journalLogs];

    if (dateRange && dateRange[0] && dateRange[1]) {
      const startDate = new Date(dateRange[0].$d);
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(dateRange[1].$d);
      endDate.setHours(23, 59, 59, 999);
      filtered = filtered.filter((log) => {
        const logDate = new Date(log.createdAtRaw);
        return logDate >= startDate && logDate <= endDate;
      });
    }

    return filtered.sort((a, b) => b.createdAtRaw - a.createdAtRaw);
  }, [journalLogs, dateRange]);

  const filteredTotal = useMemo(() => {
    if (dateRange && dateRange[0] && dateRange[1]) {
      return sortedJournalLogs.length;
    }
    return total;
  }, [dateRange, sortedJournalLogs.length, total]);

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
  ];

  return (
    <div className="min-h-screen bg-gray-950 p-6 relative overflow-hidden">
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
              <DatePicker.RangePicker
                value={dateRange}
                onChange={(dates) => {
                  setDateRange(dates);
                  setPage(1);
                }}
                className="dark-select"
                placeholder={[t("common.startDate"), t("common.endDate")]}
                popupClassName="dark-picker"
              />
            </ConfigProvider>
            {dateRange && (
              <button
                onClick={() => {
                  setDateRange(null);
                  setPage(1);
                }}
                className="px-3 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-red-500/30"
              >
                {t("common.clear")}
              </button>
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
            size="middle"
            rowClassName={(record) =>
              record.status === "ON_TIME"
                ? "bg-emerald-500/10"
                : record.status === "LATE"
                  ? "bg-yellow-500/10"
                  : "bg-red-500/10"
            }
          />
        </div>
      </div>
    </div>
  );
};

export default Journal;
