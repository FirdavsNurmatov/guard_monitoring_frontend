import { Table, Modal } from "antd";
import { formatDate, formatTime } from "../../utils/dateFormat";
import { useMemo } from "react";

const JournalModal = ({
  open,
  onCancel,
  journalLogs,
  page,
  setPage,
  total,
  t,
}) => {
  const journalLogColumns = useMemo(() => [
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
      render: (time) => `${formatDate(time)} ${formatTime(time)}`,
      key: "createdAt",
    },
    {
      title: t("dashboardPage.status"),
      dataIndex: "status",
      render: (status) =>
        status === "ON_TIME"
          ? t("dashboardPage.onTimeStatus")
          : status === "LATE"
            ? t("dashboardPage.lateStatus")
            : t("dashboardPage.veryLateStatus"),
      key: "status",
    },
  ], [t]);

  return (
    <Modal
      title={
        <span className="text-white">
          {t("dashboardPage.employeeJournal")}
        </span>
      }
      open={open}
      onCancel={onCancel}
      footer={null}
      width="70vw"
      style={{ top: 20 }}
      className="dark-modal"
      styles={{
        content: { backgroundColor: "#111827", borderRadius: "1rem" },
        header: {
          backgroundColor: "#111827",
          borderBottom: "1px solid #374151",
        },
      }}
    >
      <Table
        size="small"
        dataSource={journalLogs.map((l, i) => ({
          ...l,
          key: i,
          id: (page - 1) * 50 + (i + 1),
        }))}
        columns={journalLogColumns}
        pagination={{
          current: page,
          pageSize: 50,
          total: total,
          showSizeChanger: false,
          onChange: (p) => setPage(p),
          showTotal: (total) => `${t("dashboardPage.total")}: ${total}`,
          className: "dark-pagination",
        }}
        scroll={{ y: 500 }}
        className="dark-table table-compact"
        rowClassName={() => "dark-table-row"}
      />
    </Modal>
  );
};

export default JournalModal;
