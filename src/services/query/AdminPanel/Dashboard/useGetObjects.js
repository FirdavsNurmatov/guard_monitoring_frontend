import { useQuery } from "@tanstack/react-query";
import { instance } from "../../../../config/axios-instance";

export const useGetObjects = () =>
  useQuery({
    queryKey: ["objects"],
    queryFn: () => instance.get("/object").then((res) => res.data),
  });
