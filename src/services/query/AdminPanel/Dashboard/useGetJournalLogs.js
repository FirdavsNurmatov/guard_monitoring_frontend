import { useQuery } from "@tanstack/react-query";
import { instance } from "../../../../config/axios-instance";

export const useGetJournalLogs = ({ objectId, page, enabled }) =>
  useQuery({
    queryKey: ["journalLogs", objectId, page],
    queryFn: () =>
      instance
        .get(`/admin/monitoringLogs?objectId=${objectId}&page=${page}&limit=30`)
        .then((res) => res.data),
    enabled: !!objectId && enabled, // modal ochiq bo'lsagina
  });
