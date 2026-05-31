import { useQuery } from "@tanstack/react-query";
import { instance } from "../../../../config/axios-instance";

// hooks/useGetLogs.js
export const useGetLogs = (objectId) =>
  useQuery({
    queryKey: ["logs", objectId],
    queryFn: () =>
      instance
        .get(`/admin/logs?limit=50&objectId=${objectId}`)
        .then((res) => res.data?.data),
    enabled: !!objectId,
  });
