import { useQuery } from "@tanstack/react-query";
import { instance } from "../../../../config/axios-instance";

export const useGetUsers = ({ onError } = {}) => {
  return useQuery({
    queryKey: ["users"],
    queryFn: async () => {
      const res = await instance.get("/admin/users");
      return res.data;
    },
    onError,
  });
};
