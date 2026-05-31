import { useMutation, useQueryClient } from "@tanstack/react-query";
import { instance } from "../../../../config/axios-instance";

export const useCreateUser = ({ onSuccess, onError } = {}) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (values) => instance.post("/user", values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      onSuccess?.();
    },
    onError,
  });
};
