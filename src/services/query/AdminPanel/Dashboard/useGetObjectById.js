import { useQuery } from "@tanstack/react-query";
import { instance } from "../../../../config/axios-instance";

export const useGetObjectById = (id) =>
  useQuery({
    queryKey: ["object", id],
    queryFn: () => instance.get(`/object/${id}`).then((res) => res.data),
    enabled: !!id, // id bo'lmasa fetch bo'lmaydi
  });
